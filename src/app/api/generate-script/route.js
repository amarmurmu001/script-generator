import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateText(prompt) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().replace(/\*\*(.*?)\*\*/g, '$1'); // Remove asterisks from the output
}

export async function POST(req) {
  try {
    const { input } = await req.json();
    
    if (!input || typeof input !== 'string' || !input.trim()) {
      return NextResponse.json({ error: 'Invalid input provided' }, { status: 400 });
    }

    console.log("Input received:", input);

    const prompt = `Generate a video script for the theme: "${input.trim()}". Structure it as follows:
    1. Pose a question related to the theme.
    2. Provide four distinct one word options with CTA.
    3. End with a call to action (CTA) that encourages engagement based on the selected option.
    Format:
    "Your question here"
     "First option. with 2-3 words explaination."
    "Second option. with 2-3 words explaination."
    "Third option. with 2-3 words explaination."
    "Fourth option. with 2-3 words explaination."
    "Call to action based on user choice. in one line"
    `;

    const generatedText = await generateText(prompt);
    return NextResponse.json({ script: generatedText }, { status: 200 });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json({ error: 'Error generating script: ' + error.message }, { status: 500 });
  }
}
