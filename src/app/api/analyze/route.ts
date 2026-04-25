import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Innertube } from "youtubei.js";

function extractVideoId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized or missing API Key" }, { status: 401 });
    }
    const apiKey = authHeader.split(" ")[1];
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "Invalid URLs" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const yt = await Innertube.create();

    const results = [];

    for (const url of urls) {
      try {
        const videoId = extractVideoId(url);
        if (!videoId) {
          results.push({ url, error: "Invalid YouTube URL format." });
          continue;
        }

        const info = await yt.getBasicInfo(videoId);
        const title = info.basic_info.title;
        const description = info.basic_info.short_description || "";

        let commentsText = "";
        try {
          const comments = await yt.getComments(videoId);
          // Extract top 50 comments
          const topComments = comments.contents
            .slice(0, 50)
            .map((c: any) => c.content?.toString() || "");
          commentsText = topComments.join("\n---\n");
        } catch (e) {
          console.warn("Could not fetch comments for", videoId);
        }

        // Summary Generation
        const summaryPrompt = `You are an AI assistant that summarizes YouTube videos. 
Here is the available metadata for a video:
Title: ${title}
Description: ${description}

Top Comments:
${commentsText.substring(0, 3000)}

Based on the title, description, and user comments, please write a concise summary of what this video is about in Korean. 
Even if the description is short or lacks details, do your best to infer the video's topic from the title and comments. DO NOT reply that you lack information. Provide the best summary possible.`;
        const summaryResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: summaryPrompt,
        });
        const summary = summaryResponse.text;

        // Sentiment Analysis
        let sentiment = { pro: 33, neutral: 34, con: 33 }; // Default
        if (commentsText) {
          const sentimentPrompt = `Analyze the sentiment of these YouTube comments regarding the video. Return the ratio of Pro (Agree/Positive), Neutral, and Con (Disagree/Negative) as a JSON object: {"pro": 50, "neutral": 30, "con": 20}. The sum must be 100. Return ONLY the JSON object, no markdown, no other text.\n\nComments:\n${commentsText.substring(0, 10000)}`;
          
          const sentimentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: sentimentPrompt,
          });
          const text = sentimentResponse.text || "{}";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              sentiment = JSON.parse(jsonMatch[0]);
              // Basic normalization in case LLM math is off
              const total = sentiment.pro + sentiment.neutral + sentiment.con;
              if (total !== 100 && total > 0) {
                sentiment.pro = Math.round((sentiment.pro / total) * 100);
                sentiment.neutral = Math.round((sentiment.neutral / total) * 100);
                sentiment.con = 100 - sentiment.pro - sentiment.neutral;
              }
            } catch (e) {
              console.error("Failed to parse JSON from Gemini", text);
            }
          }
        }

        const metric = sentiment.pro >= 80 ? "High" : sentiment.pro >= 40 ? "Medium" : "Low";

        results.push({
          url,
          summary,
          sentiment,
          metric
        });

      } catch (err: any) {
        results.push({ url, error: err.message || "Failed to analyze video." });
      }
    }

    return NextResponse.json({ results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
