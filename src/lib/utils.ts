import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract owner and repo from a GitHub URL.
 * Supports: https://github.com/owner/repo, github.com/owner/repo, owner/repo
 */
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const cleaned = input.trim().replace(/\/+$/, "").replace(/\.git$/, "");

  // Try full URL
  const urlMatch = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)/
  );
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };

  // Try owner/repo shorthand
  const shortMatch = cleaned.match(/^([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/);
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2] };

  return null;
}

/**
 * Get a color for a file extension
 */
export function getExtensionColor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const colors: Record<string, string> = {
    ts: "#3178c6",
    tsx: "#3178c6",
    js: "#f7df1e",
    jsx: "#f7df1e",
    py: "#3776ab",
    rs: "#dea584",
    go: "#00add8",
    java: "#b07219",
    rb: "#cc342d",
    php: "#4f5d95",
    css: "#563d7c",
    scss: "#c6538c",
    html: "#e34c26",
    json: "#292929",
    md: "#083fa1",
    yaml: "#cb171e",
    yml: "#cb171e",
    toml: "#9c4121",
    sql: "#e38c00",
    sh: "#89e051",
    dockerfile: "#384d54",
    vue: "#41b883",
    svelte: "#ff3e00",
  };
  return colors[ext] ?? "#6b7280";
}

/**
 * Detect module type from file path
 */
export function detectModuleType(
  path: string
): "api" | "frontend" | "database" | "config" | "test" | "docs" | "lib" | "unknown" {
  const lower = path.toLowerCase();

  if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(lower) || lower.includes("__tests__"))
    return "test";
  if (
    lower.includes("/api/") ||
    lower.includes("/routes/") ||
    lower.includes("/controllers/") ||
    lower.includes("/handlers/") ||
    lower.includes("server.")
  )
    return "api";
  if (
    lower.includes("/components/") ||
    lower.includes("/pages/") ||
    lower.includes("/views/") ||
    lower.includes("/app/") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".vue") ||
    lower.endsWith(".svelte")
  )
    return "frontend";
  if (
    lower.includes("/models/") ||
    lower.includes("/schema/") ||
    lower.includes("/migrations/") ||
    lower.includes("/prisma/") ||
    lower.includes("/drizzle/") ||
    lower.endsWith(".sql")
  )
    return "database";
  if (
    lower.includes("config") ||
    lower.endsWith(".json") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".toml") ||
    lower.endsWith(".env") ||
    lower.includes("dockerfile")
  )
    return "config";
  if (lower.endsWith(".md") || lower.includes("/docs/")) return "docs";
  if (lower.includes("/lib/") || lower.includes("/utils/") || lower.includes("/helpers/"))
    return "lib";

  return "unknown";
}

/**
 * Module type colors for graph visualization
 */
export const MODULE_COLORS: Record<string, string> = {
  api: "#ef4444",
  frontend: "#3b82f6",
  database: "#f59e0b",
  config: "#6b7280",
  test: "#8b5cf6",
  docs: "#10b981",
  lib: "#06b6d4",
  unknown: "#9ca3af",
};

/**
 * Truncate a path for display
 */
export function truncatePath(path: string, maxLen = 30): string {
  if (path.length <= maxLen) return path;
  const parts = path.split("/");
  if (parts.length <= 2) return "…" + path.slice(-maxLen);
  return parts[0] + "/…/" + parts.slice(-2).join("/");
}
