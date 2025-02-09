import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { headers } from "next/headers";
import {
  getCachedScript,
  setCachedScript,
  generateCacheKey,
} from "@/lib/cache";

// Initialize rate limiting map
const rateLimitMap = new Map();
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

// Rate limiting function
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];

  // Remove old requests
  const recentRequests = userRequests.filter(
    (time) => now - time < RATE_LIMIT_DURATION
  );

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
    // Check cache first
    const cacheKey = generateCacheKey(input, category, tags);
    const cachedResult = getCachedScript(cacheKey);
    if (cachedResult) {
      console.log("Cache hit for:", cacheKey);
      return cachedResult;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

    // Cache the result
    setCachedScript(cacheKey, generatedText);

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

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const { input, category = "general", tags = [] } = await req.json();

    // Input validation
    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Invalid input provided" },
        { status: 400 }
      );
    }

    const trimmedInput = input.trim();
    if (!trimmedInput || trimmedInput.length < 2) {
      return NextResponse.json(
        { error: "Input too short. Please provide more context." },
        { status: 400 }
      );
    }

    if (trimmedInput.length > 200) {
      return NextResponse.json(
        { error: "Input too long. Please keep it under 200 characters." },
        { status: 400 }
      );
    }

    console.log("Input received:", trimmedInput);

    const prompt = `Generate an engaging YouTube Shorts CTA video script for the theme: "${trimmedInput}".

Instructions:
Create a script following this EXACT format (keep the exact formatting, quotation marks, and line breaks):

"[A short, engaging question about the theme]"

"[First Option]: [One word] - [2-3 word compelling explanation]"

"[Second Option]: [One word] - [2-3 word compelling explanation]"

"[Third Option]: [One word] - [2-3 word compelling explanation]"

"[Fourth Option]: [One word] - [2-3 word compelling explanation]"

"[One engaging line that includes both a call-to-action to comment and a FOMO-inducing statement]"

Example Format:
"Which car is driving your style?"

"Classic: Timeless vibes, refined luxury"

"Sports: Adrenaline rush, head-turning performance"

"SUV: Adventure-ready, spacious comfort"

"Electric: Eco-friendly, futuristic freedom"

"Choose your ride, comment below! Don't miss out on the hottest car trends. Like us for more auto awesomeness!"

Guidelines:
- Use exact format with quotation marks and line breaks as shown
- Keep options concise: one primary word followed by 2-3 word explanation
- Make the CTA engaging and include both comment prompt and FOMO element
- Use conversational, TikTok-style language
- Keep everything punchy and trendy
- Consider the category: ${category}
- Incorporate relevant tags: ${tags.join(", ")}`;

    const generatedText = await generateText(prompt, input, category, tags);

    if (!generatedText || typeof generatedText !== "string") {
      throw new Error("Invalid response format");
    }

    // Validate generated content format
    const lines = generatedText.split("\n").filter((line) => line.trim());
    if (lines.length < 6) {
      throw new Error("Generated content format invalid");
    }

    return NextResponse.json(
      {
        script: generatedText,
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7),
        category,
        tags,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating script:", error);

    let status = 500;
    let message = "Error generating script";

    if (error.message?.includes("API key")) {
      status = 401;
      message = "API configuration error";
    } else if (
      error.message?.includes("rate limit") ||
      error.message?.includes("quota")
    ) {
      status = 429;
      message = "Rate limit exceeded. Please try again later";
    } else if (error.message?.includes("format invalid")) {
      status = 422;
      message = "Failed to generate proper content format";
    }

    return NextResponse.json(
      {
        error: message,
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7),
      },
      { status }
    );
  }
}
