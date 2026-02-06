/**
 * Parser module for detecting dependencies from file content.
 * Uses regex-based heuristics (lightweight, no WASM required).
 * Detects imports/requires across JS/TS/Python/Go/Rust/Java.
 */

export interface ParsedDependency {
  source: string; // file that imports
  target: string; // imported module/path
  type: "import" | "require" | "dynamic";
}

/**
 * Parse file content and extract import dependencies
 */
export function parseImports(filePath: string, content: string): ParsedDependency[] {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const deps: ParsedDependency[] = [];

  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      deps.push(...parseJSImports(filePath, content));
      break;
    case "py":
      deps.push(...parsePythonImports(filePath, content));
      break;
    case "go":
      deps.push(...parseGoImports(filePath, content));
      break;
    case "rs":
      deps.push(...parseRustImports(filePath, content));
      break;
    case "java":
      deps.push(...parseJavaImports(filePath, content));
      break;
    case "vue":
    case "svelte":
      deps.push(...parseJSImports(filePath, content));
      break;
  }

  return deps;
}

function parseJSImports(filePath: string, content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];

  // ES imports: import X from 'path', import { X } from 'path', import 'path'
  const esImportRegex = /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = esImportRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "import" });
  }

  // CommonJS: require('path')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "require" });
  }

  // Dynamic import: import('path')
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "dynamic" });
  }

  // Re-exports: export { X } from 'path'
  const reexportRegex = /export\s+(?:[\w*{}\s,]+\s+from\s+)['"]([^'"]+)['"]/g;
  while ((match = reexportRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "import" });
  }

  return deps;
}

function parsePythonImports(filePath: string, content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  let match;

  // from X import Y
  const fromImportRegex = /^from\s+([\w.]+)\s+import/gm;
  while ((match = fromImportRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "import" });
  }

  // import X
  const importRegex = /^import\s+([\w.]+)/gm;
  while ((match = importRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "import" });
  }

  return deps;
}

function parseGoImports(filePath: string, content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  let match;

  const importRegex = /import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g;
  while ((match = importRegex.exec(content)) !== null) {
    if (match[2]) {
      deps.push({ source: filePath, target: match[2], type: "import" });
    } else if (match[1]) {
      const pathRegex = /"([^"]+)"/g;
      let pathMatch;
      while ((pathMatch = pathRegex.exec(match[1])) !== null) {
        deps.push({ source: filePath, target: pathMatch[1], type: "import" });
      }
    }
  }

  return deps;
}

function parseRustImports(filePath: string, content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  let match;

  // use crate::module, use std::io
  const useRegex = /use\s+([\w:]+)/g;
  while ((match = useRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "import" });
  }

  // mod module_name
  const modRegex = /mod\s+(\w+)/g;
  while ((match = modRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "import" });
  }

  return deps;
}

function parseJavaImports(filePath: string, content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  let match;

  const importRegex = /import\s+([\w.]+)/g;
  while ((match = importRegex.exec(content)) !== null) {
    deps.push({ source: filePath, target: match[1], type: "import" });
  }

  return deps;
}

/**
 * Resolve a relative import to a full file path within the repo tree
 */
export function resolveImportPath(
  sourcePath: string,
  importPath: string,
  allPaths: string[]
): string | null {
  // Skip external packages (no relative path prefix)
  if (!importPath.startsWith(".") && !importPath.startsWith("@/") && !importPath.startsWith("~/")) {
    return null;
  }

  // Handle alias paths like @/ → src/
  let resolved = importPath;
  if (resolved.startsWith("@/")) {
    resolved = "src/" + resolved.slice(2);
  } else if (resolved.startsWith("~/")) {
    resolved = resolved.slice(2);
  } else if (resolved.startsWith(".")) {
    // Resolve relative to source directory
    const sourceDir = sourcePath.split("/").slice(0, -1).join("/");
    const parts = resolved.split("/");
    const dirParts = sourceDir.split("/").filter(Boolean);

    for (const part of parts) {
      if (part === "..") dirParts.pop();
      else if (part !== ".") dirParts.push(part);
    }

    resolved = dirParts.join("/");
  }

  // Try adding common extensions
  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (allPaths.includes(candidate)) return candidate;
  }

  return null;
}

/**
 * Detect exports from JS/TS file content
 */
export function parseExports(content: string): string[] {
  const exports: string[] = [];
  let match;

  // Named exports: export const/function/class X
  const namedRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  while ((match = namedRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // Default export
  if (/export\s+default/.test(content)) {
    exports.push("default");
  }

  // module.exports
  if (/module\.exports/.test(content)) {
    exports.push("default");
  }

  return exports;
}
