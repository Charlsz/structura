import { z } from "zod";

// ─── GitHub API Schemas ───────────────────────────────────────────

export const GitHubTreeItemSchema = z.object({
  path: z.string(),
  mode: z.string().optional(),
  type: z.enum(["blob", "tree", "commit"]),
  sha: z.string(),
  size: z.number().optional(),
  url: z.string().optional(),
});

export const GitHubTreeSchema = z.object({
  sha: z.string(),
  url: z.string(),
  tree: z.array(GitHubTreeItemSchema),
  truncated: z.boolean(),
});

export const GitHubFileContentSchema = z.object({
  name: z.string(),
  path: z.string(),
  sha: z.string(),
  size: z.number(),
  type: z.literal("file"),
  content: z.string().optional(),
  encoding: z.string().optional(),
  download_url: z.string().nullable(),
});

export const GitHubRepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  default_branch: z.string(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  language: z.string().nullable(),
  topics: z.array(z.string()).optional(),
  html_url: z.string(),
  private: z.boolean(),
});

// ─── Graph Types ──────────────────────────────────────────────────

export const ModuleTypeSchema = z.enum([
  "api",
  "frontend",
  "database",
  "config",
  "test",
  "docs",
  "lib",
  "unknown",
]);

export const GraphNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  type: z.enum(["file", "folder"]),
  moduleType: ModuleTypeSchema,
  size: z.number().optional(),
  extension: z.string().optional(),
  depth: z.number(),
  color: z.string().optional(),
});

export const GraphLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(["hierarchy", "dependency"]),
});

export const GraphDataSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  links: z.array(GraphLinkSchema),
});

// ─── Analysis Types ───────────────────────────────────────────────

export const FileAnalysisSchema = z.object({
  path: z.string(),
  summary: z.string(),
  purpose: z.string(),
  dependencies: z.array(z.string()),
  exports: z.array(z.string()),
  complexity: z.enum(["low", "medium", "high"]),
});

export const ModuleAnalysisSchema = z.object({
  name: z.string(),
  type: ModuleTypeSchema,
  description: z.string(),
  files: z.array(z.string()),
  entryPoints: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
});

export const RepoAnalysisSchema = z.object({
  repo: z.object({
    owner: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    defaultBranch: z.string(),
    stars: z.number(),
    forks: z.number(),
    language: z.string().nullable(),
  }),
  graph: GraphDataSchema,
  modules: z.array(ModuleAnalysisSchema),
  stats: z.object({
    totalFiles: z.number(),
    totalFolders: z.number(),
    languages: z.record(z.string(), z.number()),
  }),
});

// ─── Inferred TypeScript types ────────────────────────────────────

export type GitHubTreeItem = z.infer<typeof GitHubTreeItemSchema>;
export type GitHubTree = z.infer<typeof GitHubTreeSchema>;
export type GitHubFileContent = z.infer<typeof GitHubFileContentSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;

export type ModuleType = z.infer<typeof ModuleTypeSchema>;
export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphLink = z.infer<typeof GraphLinkSchema>;
export type GraphData = z.infer<typeof GraphDataSchema>;

export type FileAnalysis = z.infer<typeof FileAnalysisSchema>;
export type ModuleAnalysis = z.infer<typeof ModuleAnalysisSchema>;
export type RepoAnalysis = z.infer<typeof RepoAnalysisSchema>;

// ─── Component Props Types ────────────────────────────────────────

export interface SelectedNode {
  node: GraphNode;
  content?: string;
  analysis?: FileAnalysis | null;
}
