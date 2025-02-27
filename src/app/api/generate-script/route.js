import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { headers } from "next/headers";

// Initialize rate limiting map
const rateLimitMap = new Map();
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

// Rate limiting function
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_DURATION);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

// Initialize the Google Generative AI with your API key
const apiKey = process.env.GEMINI_API_KEY;

// Validate API key at startup
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
  throw new Error("Missing API key configuration");
}

const genAI = new GoogleGenerativeAI(apiKey);

async function generateText(prompt, input, category, tags) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Add safety settings
    const safetySettings = [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const response = await result.response;
    const generatedText = response.text().replace(/\*\*(.*?)\*\*/g, "$1");

    return generatedText;
  } catch (error) {
    console.error("Error in generateText:", error);

    if (error.message?.includes("API key not valid")) {
      throw new Error("Invalid API key configuration");
    } else if (error.message?.includes("quota exceeded")) {
      throw new Error("API quota exceeded");
    } else if (error.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded");
    }

    throw new Error("Failed to generate content: " + error.message);
  }
}

export async function POST(req) {
  try {
    // Get client IP for rate limiting
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const { input } = await req.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: "Invalid input. Please provide a valid text prompt." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing Gemini API key");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash"
    });

    const prompt = `Create an engaging YouTube Shorts script about ${input}. 
    The script must follow this EXACT format with line breaks (do not include any other text or formatting):

    "[An engaging question about the theme that hooks viewers]"

    "[First Option]: [One word] - [2-3 word compelling explanation]"

    "[Second Option]: [One word] - [2-3 word compelling explanation]"

    "[Third Option]: [One word] - [2-3 word compelling explanation]"

    "[Fourth Option]: [One word] - [2-3 word compelling explanation]"

    "[One engaging line that includes both a call-to-action to comment and a FOMO-inducing statement]"

    Example format:
    "Calling all Yamaha enthusiasts! Which beast do you love the most?"

    "YZF-R1: Unleash the racing spirit."

    "MT-10: Master the urban jungle."

    "XSR900: The modern-classic outlaw."

    "Niken: Conquer the curves with three wheels."

    "Share your choice and let's ride together!"

    Follow this format exactly with double quote, keeping options concise with one primary word followed by a short explanation. Make the CTA engaging and include both a comment prompt and FOMO element. Use conversational, TikTok-style language.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const script = response.text();

      if (!script) {
        throw new Error("Empty response from AI model");
      }

      return NextResponse.json({ 
        script,
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7)
      });
    } catch (modelError) {
      console.error("AI Model error:", modelError);
      
      // Handle specific API errors
      if (modelError.message?.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid API configuration" },
          { status: 401 }
        );
      } else if (modelError.message?.includes("quota") || modelError.message?.includes("rate")) {
        return NextResponse.json(
          { error: "API rate limit exceeded" },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to generate script. Please try again." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
