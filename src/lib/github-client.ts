import { GitHubRepoSchema, GitHubTreeSchema, GitHubFileContentSchema } from "@/lib/types";
import type { GitHubRepo, GitHubTree, GitHubFileContent } from "@/lib/types";

const GITHUB_API = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Structura-App",
  };

  // Server-side: use env var directly. Client-side: proxy through API route.
  const token = typeof window === "undefined" ? process.env.GITHUB_TOKEN : undefined;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function githubFetch<T>(
  url: string,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 300 }, // Cache 5 min
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Repository not found. Make sure it's public.");
    if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later or add a token.");
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return schema.parse(data);
}

/**
 * Fetch repository metadata
 */
export async function fetchRepo(owner: string, repo: string): Promise<GitHubRepo> {
  return githubFetch(`${GITHUB_API}/repos/${owner}/${repo}`, GitHubRepoSchema);
}

/**
 * Fetch the full file tree (recursive) for a repository
 */
export async function fetchTree(
  owner: string,
  repo: string,
  branch: string = "main"
): Promise<GitHubTree> {
  try {
    return await githubFetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      GitHubTreeSchema
    );
  } catch {
    // Fallback to 'master' if 'main' fails
    if (branch === "main") {
      return githubFetch(
        `${GITHUB_API}/repos/${owner}/${repo}/git/trees/master?recursive=1`,
        GitHubTreeSchema
      );
    }
    throw new Error("Could not fetch repository tree. Check the branch name.");
  }
}

/**
 * Fetch a single file's content
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<GitHubFileContent> {
  return githubFetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    GitHubFileContentSchema
  );
}

/**
 * Decode base64 file content from GitHub API
 */
export function decodeContent(content: string): string {
  try {
    return atob(content.replace(/\n/g, ""));
  } catch {
    return content;
  }
}

/**
 * Fetch raw file content by download URL (no base64)
 */
export async function fetchRawContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = "main"
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Structura-App" },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`Failed to fetch file: ${path}`);
  return res.text();
}
