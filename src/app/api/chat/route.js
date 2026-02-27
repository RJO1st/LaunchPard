import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { system, messages } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: system || "You are Sage, a warm, encouraging UK 11+ tutor.",
        messages: messages
      })
    });

    if (!response.ok) throw new Error("AI Chat Error");

    const data = await response.json();
    
    // Return the specific format the QuizEngine is looking for
    return NextResponse.json({
      content: [{ text: data.content[0].text }]
    });

  } catch (error) {
    console.error("Vault Error: AI Chat Failed", error);
    return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
  }
}