
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MEDIA_MODULES, STYLE_MODULES, SCENARIO_MODULES } from "@/lib/modules";
import { calculateUserCredits } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { image } = body;
    
    // Default to 'watercolor' and 'general' if not provided (Backward compatibility/Default)
    // In future, Frontend should always send these.
    const mediaId = body.mediaId || "watercolor";
    const styleId = body.styleId || "general";
    const scenarioId = body.scenarioId || "free_practice";

    const mediaModule = MEDIA_MODULES[mediaId] || MEDIA_MODULES["watercolor"];
    const styleModule = STYLE_MODULES[styleId] || STYLE_MODULES["general"];
    const scenarioModule = SCENARIO_MODULES[scenarioId] || SCENARIO_MODULES["free_practice"];

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    // --- Usage Limit Check (Server Side) ---
    let user = null;
    let isTrialExpired = false;

    if (session?.user?.id) {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { 
                id: true, 
                plan: true, 
                credits: true, 
                subscriptionCredits: true, 
                trialStartedAt: true,
                subscriptionExpiresAt: true
            }
        });

        if (user) {
            // Initialize Trial if needed (Lazy Init)
            if (user.plan === 'free' && !user.trialStartedAt) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        trialStartedAt: new Date(),
                        subscriptionCredits: 7 // Grant 7 trial uses
                    }
                });
            }

            // Check if Trial Expired
            const { total, isTrialExpired } = calculateUserCredits(user);
            const totalAvailable = total;

            if (totalAvailable <= 0) {
                return NextResponse.json({ 
                    error: "Usage limit reached", 
                    code: "LIMIT_REACHED",
                    details: isTrialExpired ? "Trial expired" : "No credits remaining"
                }, { status: 403 });
            }
        }
    }

    // --- Construct System Prompt based on Modules ---
    
    const promptContext = `
    You are an AI Art Teacher operating a Structured Teaching System.
    Your goal is NOT to judge "good or bad", but to provide structural feedback on "how to see" and "how to improve".
    
    CURRENT MODULES:
    1. Media: ${mediaModule.name} (ID: ${mediaModule.id})
       - Core Techniques: ${mediaModule.core_techniques.join(", ")}
       - Common Mistakes: ${mediaModule.common_mistakes.join(", ")}
       
    2. Style/Teacher: ${styleModule.name} (ID: ${styleModule.id})
       - Reference Type: ${styleModule.reference_type}
       - Core Features: ${styleModule.core_features.join(", ")}
       - Focus Priority: ${styleModule.focus_priority.join(", ")}
       
    3. Usage Scenario: ${scenarioModule.name} (Mode: ${scenarioModule.evaluation_mode})
    
    ANALYSIS PIPELINE (FIXED):
    
    Step 1: Benchmark Declaration
    - Declare what is being evaluated based on the modules.
    
    Step 2: Performance Type (Understanding the User)
    - Analyze the image to determine:
      a) Representation: Realistic / Semi-realistic / Illustration
      b) Driver: Line / Block / Light & Shadow
      c) Atmosphere: Soft / High Contrast / Flat
    - DO NOT give advice or scores here.
    
    Step 3: Technique Extraction (Intersection Logic)
    - Identify 3 key techniques present in the image that are relevant to the Media AND Style.
    - Must be specific nouns (e.g., "Wet-on-wet", "Edge Control").
    
    Step 4: Positional Advice (The Core)
    - Provide 2-3 specific, actionable suggestions.
    - Each MUST have:
      a) Coordinate (x, y, w, h)
      b) Technique Name
      c) Direction (Actionable modification)
    - NO abstract adjectives.
    
    Step 5: Scoring & Reasoning
    - Score 1-5 for:
      a) Media Mastery (媒介掌握度)
      b) Structure & Proportion (結構與比例)
      c) Style Consistency (風格一致性)
      d) Visual Completeness (視覺完成度)
    - Provide a ONE-SENTENCE reason for each score, linking back to module definitions.
    
    Response Language: Traditional Chinese (Taiwan).
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2, // Low temperature for structured output
        messages: [
          {
            role: "system",
            content: `${promptContext}
            
            Return a valid JSON object strictly following this structure:
            {
              "step1_declaration": "本次評分基準說明：...",
              "step2_performance": {
                "representation": "...",
                "driver": "...",
                "atmosphere": "..."
              },
              "step3_techniques": ["tech1", "tech2", "tech3"],
              "step4_advice": [
                {
                  "coordinate": { "x": number, "y": number, "w": number, "h": number },
                  "technique": "...",
                  "direction": "..."
                }
              ],
              "step5_scoring": {
                "media_mastery": { "score": number, "reason": "..." },
                "structure_proportion": { "score": number, "reason": "..." },
                "style_consistency": { "score": number, "reason": "..." },
                "visual_completeness": { "score": number, "reason": "..." }
              },
              "total_score": number (0-100, calculated from above 1-5 scores scaled up)
            }
            `
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze my artwork." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      return NextResponse.json({ error: "OpenAI API request failed", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    // Save analysis and DEDUCT CREDITS if user is logged in
    if (session?.user?.email && user) {
      try {
          // Double check logic for deduction priority:
          // 1. Subscription Credits (if valid)
          // 2. Extra Credits
          
          let updateData = {};
          const { effectiveSubCredits } = calculateUserCredits(user);

          if (effectiveSubCredits > 0) {
              updateData = { subscriptionCredits: { decrement: 1 } };
          } else if (user.credits > 0) {
              updateData = { credits: { decrement: 1 } };
          }

          // Atomic Transaction: Create Analysis + Update User
          await prisma.$transaction([
            prisma.analysis.create({
                data: {
                userId: user.id,
                imageUrl: image,
                score: content.total_score || 0,
                result: JSON.stringify(content),
                type: styleId === 'general' ? 'general' : 'master_style',
                mediaId: mediaId,
                styleId: styleId,
                scenarioId: scenarioId
                },
            }),
            prisma.user.update({
                where: { id: user.id },
                data: updateData
            })
          ]);

      } catch (dbError) {
        console.error("Failed to save analysis/deduct credit:", dbError);
        // We log but don't fail the response to user.
      }
    }

    return NextResponse.json(content);

  } catch (error) {
    console.error("Backend Analysis Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
