/**
 * AI Analyzer module using Google Gemini API for semantic code analysis.
 * Falls back to heuristic analysis when no API key is configured.
 */

import type { FileAnalysis, ModuleAnalysis, ModuleType } from "@/lib/types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

/**
 * Analyze a file's purpose using Gemini AI
 */
export async function analyzeFile(
  path: string,
  content: string,
  apiKey?: string
): Promise<FileAnalysis> {
  if (!apiKey) {
    return heuristicFileAnalysis(path, content);
  }

  try {
    const prompt = `Analyze this source code file and respond ONLY with valid JSON (no markdown, no code fences).

File: ${path}

\`\`\`
${content.slice(0, 3000)}
\`\`\`

Return this exact JSON structure:
{
  "path": "${path}",
  "summary": "One sentence describing what this file does",
  "purpose": "Its role in the project architecture",
  "dependencies": ["list of imports/dependencies"],
  "exports": ["list of exports"],
  "complexity": "low|medium|high"
}`;

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!res.ok) {
      console.warn("Gemini API error, falling back to heuristic analysis");
      return heuristicFileAnalysis(path, content);
    }

    const data: GeminiResponse = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return heuristicFileAnalysis(path, content);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      path: parsed.path ?? path,
      summary: parsed.summary ?? "No summary available",
      purpose: parsed.purpose ?? "Unknown purpose",
      dependencies: parsed.dependencies ?? [],
      exports: parsed.exports ?? [],
      complexity: parsed.complexity ?? "medium",
    };
  } catch {
    return heuristicFileAnalysis(path, content);
  }
}

/**
 * Analyze a module (group of related files) using Gemini
 */
export async function analyzeModule(
  name: string,
  type: ModuleType,
  files: string[],
  apiKey?: string
): Promise<ModuleAnalysis> {
  if (!apiKey) {
    return heuristicModuleAnalysis(name, type, files);
  }

  try {
    const prompt = `Analyze this code module and respond ONLY with valid JSON (no markdown, no code fences).

Module: ${name}
Type: ${type}
Files: ${files.join(", ")}

Return this exact JSON structure:
{
  "name": "${name}",
  "type": "${type}",
  "description": "What this module does in the project",
  "files": ${JSON.stringify(files)},
  "entryPoints": ["main entry files"],
  "recommendations": ["architectural suggestions"]
}`;

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 400,
        },
      }),
    });

    if (!res.ok) return heuristicModuleAnalysis(name, type, files);

    const data: GeminiResponse = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return heuristicModuleAnalysis(name, type, files);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      name: parsed.name ?? name,
      type: parsed.type ?? type,
      description: parsed.description ?? "No description available",
      files: parsed.files ?? files,
      entryPoints: parsed.entryPoints ?? [],
      recommendations: parsed.recommendations,
    };
  } catch {
    return heuristicModuleAnalysis(name, type, files);
  }
}

// ─── Heuristic Fallbacks ──────────────────────────────────────────

function heuristicFileAnalysis(path: string, content: string): FileAnalysis {
  const filename = path.split("/").pop() ?? path;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const lines = content.split("\n").length;

  // Detect imports
  const deps: string[] = [];
  const importRegex = /(?:import|require|from)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    deps.push(match[1]);
  }

  // Detect exports
  const exports: string[] = [];
  const exportRegex = /export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  if (/export\s+default/.test(content)) exports.push("default");

  // Complexity heuristic
  const complexity: "low" | "medium" | "high" =
    lines > 300 ? "high" : lines > 100 ? "medium" : "low";

  // Purpose detection
  const purposes: Record<string, string> = {
    "route.ts": "API route handler",
    "route.js": "API route handler",
    "page.tsx": "Page component (Next.js)",
    "page.jsx": "Page component (Next.js)",
    "layout.tsx": "Layout wrapper component",
    "layout.jsx": "Layout wrapper component",
    "middleware.ts": "Request middleware",
    ".config.": "Configuration file",
    ".test.": "Test suite",
    ".spec.": "Test specification",
  };

  let purpose = `${ext.toUpperCase()} source file`;
  for (const [pattern, desc] of Object.entries(purposes)) {
    if (filename.includes(pattern) || path.includes(pattern)) {
      purpose = desc;
      break;
    }
  }

  return {
    path,
    summary: `${filename} — ${lines} lines, ${deps.length} dependencies, ${exports.length} exports`,
    purpose,
    dependencies: deps.slice(0, 20),
    exports: exports.slice(0, 20),
    complexity,
  };
}

function heuristicModuleAnalysis(
  name: string,
  type: ModuleType,
  files: string[]
): ModuleAnalysis {
  const descriptions: Record<ModuleType, string> = {
    api: "Server-side API endpoints and request handlers",
    frontend: "Client-side UI components and pages",
    database: "Database schemas, models, and migrations",
    config: "Project configuration and environment setup",
    test: "Test suites and testing utilities",
    docs: "Documentation and guides",
    lib: "Shared utilities and helper functions",
    unknown: "Miscellaneous project files",
  };

  // Detect entry points
  const entryPatterns = ["index.", "main.", "app.", "server.", "route.", "page."];
  const entryPoints = files.filter((f) =>
    entryPatterns.some((p) => f.split("/").pop()?.startsWith(p))
  );

  return {
    name,
    type,
    description: descriptions[type],
    files,
    entryPoints: entryPoints.slice(0, 5),
    recommendations: [],
  };
}
