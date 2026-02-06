import { NextRequest, NextResponse } from "next/server";
import { analyzeFile } from "@/lib/ai-analyzer";

/**
 * POST /api/analyze — analyze a single file using AI
 * Body: { path: string, content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, content } = body;

    if (!path || !content) {
      return NextResponse.json(
        { error: "Missing required fields: path, content" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const analysis = await analyzeFile(path, content, apiKey);

    return NextResponse.json(analysis, {
      headers: { "Cache-Control": "public, max-age=600" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
