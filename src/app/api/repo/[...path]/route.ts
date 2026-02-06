import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

/**
 * Proxy API route for GitHub requests.
 * Hides the GitHub token from the client and avoids CORS issues.
 *
 * Usage:
 *   /api/repo/owner/repo → repo metadata
 *   /api/repo/owner/repo/tree → file tree
 *   /api/repo/owner/repo/contents/path/to/file → file content
 *   /api/repo/owner/repo/raw/path/to/file → raw file content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  if (!path || path.length < 2) {
    return NextResponse.json(
      { error: "Invalid path. Use /api/repo/{owner}/{repo}[/tree|/contents/{path}]" },
      { status: 400 }
    );
  }

  const [owner, repo, ...rest] = path;
  const action = rest[0]; // 'tree' | 'contents' | 'raw' | undefined

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Structura-App",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    let url: string;

    if (action === "tree") {
      // Fetch full recursive tree
      const branch = rest[1] ?? "main";
      url = `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    } else if (action === "contents") {
      // Fetch file content
      const filePath = rest.slice(1).join("/");
      url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`;
    } else if (action === "raw") {
      // Fetch raw file content
      const filePath = rest.slice(1).join("/");
      const branch = request.nextUrl.searchParams.get("branch") ?? "main";
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      const rawHeaders: HeadersInit = { "User-Agent": "Structura-App" };
      if (token) rawHeaders.Authorization = `Bearer ${token}`;
      const rawRes = await fetch(rawUrl, {
        headers: rawHeaders,
      });

      if (!rawRes.ok) {
        return NextResponse.json(
          { error: `Failed to fetch file: ${rawRes.status}` },
          { status: rawRes.status }
        );
      }

      const text = await rawRes.text();
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    } else {
      // Default: fetch repo metadata
      url = `${GITHUB_API}/repos/${owner}/${repo}`;
    }

    const res = await fetch(url!, {
      headers,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json(
        { error: `GitHub API error: ${res.status}`, details: errorBody },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("GitHub proxy error:", error);
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
