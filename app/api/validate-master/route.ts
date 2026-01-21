import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, medium } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Master name is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API Key is missing" }, { status: 500 });
    }

    const systemPrompt = `You are a strict art historian and art market expert. 
    Your task is to validate if a given name belongs to a recognized, world-class, or national-level artist (Master).
    
    CRITERIA FOR "VALID MASTER":
    1. Must be a real, verifiable person (historical or contemporary) or a widely recognized manga/anime artist (e.g., Hayao Miyazaki, Toriyama Akira).
    2. Must have a significant digital footprint (Googleable).
    3. Works must have appeared in major auctions (Sotheby's, Christie's) OR be held in major national museums OR be a top-tier industry professional (for digital/concept art).
    4. "Random names" (e.g., "Wang Daming", "John Doe") or amateur artists must be rejected.
    
    Respond in Traditional Chinese (Taiwan).
    
    Return a valid JSON object strictly following this structure:
    {
      "isValid": boolean,
      "reason": "Short explanation of why they are or are not accepted (max 30 words)",
      "masterInfo": {
        "name": "Correct standard name of the artist",
        "desc": "A concise description of their signature style and technique (max 20 words)",
        "tag": "A short 2-4 character tag representing their key feature (e.g. '光影', '潑墨', '極簡')"
      } (only if isValid is true, otherwise null)
    }`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please validate this artist name: "${name}". The user wants to learn their style for medium: "${medium || 'general'}".`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      return NextResponse.json({ error: "OpenAI API request failed", details: errorData }, { status: response.status });
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(content);

  } catch (error) {
    console.error("Master Validation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
