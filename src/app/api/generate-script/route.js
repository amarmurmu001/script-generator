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
    console.log("Input received:", input);

    // Modify the prompt to get the desired format
    const prompt = `Generate an engaging social media post with a theme-based question and response options. Format it as follows:

    "[Theme-related question]?
    
    [Option name]: [Call to action]!
    [Option name]: [Call to action]!
    [Option name]: [Call to action]!
    [Option name]: [Call to action]!"
    
    Each option should pair a character/choice with a unique social media engagement call-to-action (like, comment, share, or subscribe).`;
    const generatedText = await generateText(prompt);
    return NextResponse.json({ script: generatedText }, { status: 200 });
  } catch (error) {
    console.error('Error generating script:', error);
    return NextResponse.json({ error: 'Error generating script: ' + error.message }, { status: 500 });
  }
}
