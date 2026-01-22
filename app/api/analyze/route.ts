import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { image, style } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    const systemPrompt = style 
      ? `You are a professional art teacher. The student is trying to draw in the style of "${style}".
         Analyze the artwork image provided specifically focusing on how well it matches the "${style}" style.
         Respond in Traditional Chinese (Taiwan).`
      : `You are a professional art teacher for beginners. Analyze the artwork image provided.
         Respond in Traditional Chinese (Taiwan).`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        seed: 12345,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}
            Return a valid JSON object strictly following this structure:
            {
              "detectedStyle": "style name in Traditional Chinese (e.g. '印象派', '水彩風', '賽博龐克')",
              "confidence": number (0-100),
              "analysis": "encouraging and specific analysis text (max 100 words)",
              "score": number (0-100),
              "styleMatch": {
                "score": number (0-100),
                "comment": "Specific comment about how well it matches the target style (max 50 words)"
              },
              "encouragement": "short encouraging phrase",
              "feedback": [
                {
                  "title": "short title",
                  "content": "specific advice",
                  "difficulty": "Easy/Medium/Hard",
                  "coordinate": { "x": number (0-100), "y": number (0-100), "w": number (10-30), "h": number (10-30) }
                }
              ],
              "nextStep": "actionable next step"
            }
            Ensure 'feedback' array has 2-3 items pointing to specific areas to improve.
            Coordinates should be percentages relative to the image size (x,y is top-left).
            If no specific style was requested, set styleMatch to null.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: style ? `Please analyze my drawing against the style: ${style}` : "Please analyze my drawing." },
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

    // Save analysis to database if user is logged in
    if (session?.user?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (user) {
          // Truncate image data if it's too long (optional, but good for performance if using base64)
          // For now, we save it as is to allow viewing in admin
          await prisma.analysis.create({
            data: {
              userId: user.id,
              imageUrl: image, // Note: storing base64 in DB is not ideal for production but works for now
              score: content.score || 0,
              result: JSON.stringify(content),
              type: style ? "master_style" : "general",
            },
          });
        }
      } catch (dbError) {
        console.error("Failed to save analysis to DB:", dbError);
        // Don't fail the request if saving fails
      }
    }

    return NextResponse.json(content);

  } catch (error) {
    console.error("Backend Analysis Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}