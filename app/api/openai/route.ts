// app/api/openai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = "gpt-3.5-turbo" } = body;

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "An error occurred during the API call" },
      { status: 500 }
    );
  }
}
