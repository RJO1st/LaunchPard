import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { year, region, subject, count, proficiency, previousQuestions } = await req.json();

    // 1. Verify API Key Presence
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("🚨 Vault Error: ANTHROPIC_API_KEY is missing from .env.local");
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    // 2. Build the strict prompt for the AI
    const prompt = `You are Sage, an expert UK 11+ tutor.
    Generate ${count} multiple-choice questions for a Year ${year} student studying for the ${region} 11+ exam.
    Subject: ${subject}. Student Proficiency: ${proficiency}/100.
    Do NOT repeat these previous questions: ${previousQuestions?.join(' | ') || "None"}.

    Respond ONLY with a valid JSON object matching this exact structure:
    {
      "questions": [
        {
          "q": "The question text",
          "opts": ["A", "B", "C", "D"],
          "a": 0, 
          "exp": "Step-by-step explanation of why this is correct."
        }
      ]
    }`;

    // 3. Securely call the AI (Anthropic Claude)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: "You are an AI that only outputs strict, valid JSON. No conversational text, no markdown code blocks, just the raw JSON object.",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("\n🚨 ANTHROPIC API ERROR DETAILS:");
        console.error(errorText, "\n");
        throw new Error(`Anthropic Error: ${response.status}`);
    }

    const data = await response.json();
    let jsonText = data.content[0].text;

    // 4. Robust JSON Extraction: Find the first '{' and last '}'
    // This prevents crashes if Claude adds "Here is your JSON:" or other text.
    const startIdx = jsonText.indexOf('{');
    const endIdx = jsonText.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("No valid JSON found in AI response");
    }
    
    jsonText = jsonText.substring(startIdx, endIdx + 1);

    const parsed = JSON.parse(jsonText);
    return NextResponse.json(parsed);

  } catch (error) {
    console.error("🚨 Vault Error: AI Generation Failed -", error.message);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}