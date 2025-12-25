import { NextResponse } from "next/server";
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

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("Missing OpenRouter API key");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

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
      // Using Mistral Devstral 2 2512 (free) as requested
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          "X-Title": "Script Generator",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "mistralai/devstral-2512:free",
          "messages": [
            {
              "role": "user",
              "content": prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API Error Response:", errorText);

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || "OpenRouter API error");
        } catch (parseError) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      const script = data.choices[0]?.message?.content;

      if (!script) {
        throw new Error("Empty response from AI model");
      }

      // Clean up the script format if needed (OpenRouter/Mistral might add markdown)
      const cleanScript = script.replace(/\*\*(.*?)\*\*/g, "$1");

      return NextResponse.json({
        script: cleanScript,
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
