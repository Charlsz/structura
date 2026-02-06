"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { GitHubRepoSchema, GitHubTreeSchema } from "@/lib/types";
import type { GraphData, RepoAnalysis, FileAnalysis, GraphNode, ModuleAnalysis } from "@/lib/types";
import { buildGraph, addDependencyLinks, groupIntoModules } from "@/lib/graph-builder";
import { parseImports, resolveImportPath } from "@/lib/parser";

interface UseRepoGraphOptions {
  owner: string;
  repo: string;
  enabled?: boolean;
}

/**
 * Main hook: fetches repo metadata + tree, builds graph, detects modules
 */
export function useRepoGraph({ owner, repo, enabled = true }: UseRepoGraphOptions) {
  // 1. Fetch repo metadata
  const repoQuery = useQuery({
    queryKey: ["repo", owner, repo],
    queryFn: async () => {
      const res = await fetch(`/api/repo/${owner}/${repo}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to fetch repo");
      return GitHubRepoSchema.parse(await res.json());
    },
    enabled: enabled && !!owner && !!repo,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // 2. Fetch file tree
  const treeQuery = useQuery({
    queryKey: ["tree", owner, repo, repoQuery.data?.default_branch],
    queryFn: async () => {
      const branch = repoQuery.data?.default_branch ?? "main";
      const res = await fetch(`/api/repo/${owner}/${repo}/tree/${branch}`);
      if (!res.ok) {
        // Fallback to master
        const res2 = await fetch(`/api/repo/${owner}/${repo}/tree/master`);
        if (!res2.ok) throw new Error("Failed to fetch tree");
        return GitHubTreeSchema.parse(await res2.json());
      }
      return GitHubTreeSchema.parse(await res.json());
    },
    enabled: !!repoQuery.data,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // 3. Build graph from tree
  const graph: GraphData | null = useMemo(() => {
    if (!treeQuery.data) return null;
    return buildGraph(treeQuery.data.tree);
  }, [treeQuery.data]);

  // 4. Group files into modules
  const modules: ModuleAnalysis[] = useMemo(() => {
    if (!graph) return [];
    return groupIntoModules(graph.nodes);
  }, [graph]);

  // 5. Compute language stats
  const stats = useMemo(() => {
    if (!graph) return null;

    const files = graph.nodes.filter((n) => n.type === "file");
    const folders = graph.nodes.filter((n) => n.type === "folder");
    const languages: Record<string, number> = {};

    for (const file of files) {
      const ext = file.extension ?? "unknown";
      languages[ext] = (languages[ext] ?? 0) + 1;
    }

    return {
      totalFiles: files.length,
      totalFolders: folders.length,
      languages,
    };
  }, [graph]);

  // Build the full analysis object
  const analysis: RepoAnalysis | null = useMemo(() => {
    if (!repoQuery.data || !graph || !stats) return null;
    return {
      repo: {
        owner,
        name: repo,
        description: repoQuery.data.description,
        defaultBranch: repoQuery.data.default_branch,
        stars: repoQuery.data.stargazers_count,
        forks: repoQuery.data.forks_count,
        language: repoQuery.data.language,
      },
      graph,
      modules,
      stats,
    };
  }, [repoQuery.data, graph, modules, stats, owner, repo]);

  return {
    analysis,
    graph,
    modules,
    stats,
    repoData: repoQuery.data,
    isLoading: repoQuery.isLoading || treeQuery.isLoading,
    isError: repoQuery.isError || treeQuery.isError,
    error: repoQuery.error ?? treeQuery.error,
    refetch: () => {
      repoQuery.refetch();
      treeQuery.refetch();
    },
  };
}

/**
 * Hook to fetch file content and AI analysis on demand (double-click)
 */
export function useFileContent(owner: string, repo: string, branch = "main") {
  const queryClient = useQueryClient();

  const fetchContent = useMutation({
    mutationFn: async (node: GraphNode) => {
      // Fetch raw file content
      const res = await fetch(`/api/repo/${owner}/${repo}/raw/${node.path}?branch=${encodeURIComponent(branch)}`);
      if (!res.ok) throw new Error("Failed to fetch file content");
      const content = await res.text();

      // Attempt AI analysis
      let analysis: FileAnalysis | null = null;
      try {
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: node.path, content: content.slice(0, 5000) }),
        });
        if (analyzeRes.ok) {
          analysis = await analyzeRes.json();
        }
      } catch {
        // AI analysis is optional
      }

      return { node, content, analysis };
    },
  });

  return {
    fetchFile: fetchContent.mutate,
    fileData: fetchContent.data,
    isLoadingFile: fetchContent.isPending,
    fileError: fetchContent.error,
    reset: fetchContent.reset,
  };
}

/**
 * Hook to add dependency links by parsing file contents
 */
export function useDependencyLinks(owner: string, repo: string, graph: GraphData | null, branch = "main") {
  return useQuery({
    queryKey: ["dependencies", owner, repo, branch],
    queryFn: async () => {
      if (!graph) return graph;

      const allPaths = graph.nodes.filter((n) => n.type === "file").map((n) => n.path);

      // Only parse files that might have imports (limit to manageable number)
      const parsableExtensions = ["ts", "tsx", "js", "jsx", "mjs", "py", "go", "rs", "java", "vue", "svelte"];
      const filesToParse = allPaths
        .filter((p) => {
          const ext = p.split(".").pop()?.toLowerCase() ?? "";
          return parsableExtensions.includes(ext);
        })
        .slice(0, 50); // Limit API calls

      const resolvedDeps: Array<{ source: string; target: string }> = [];

      // Fetch and parse a sample of files for dependencies
      const results = await Promise.allSettled(
        filesToParse.slice(0, 20).map(async (filePath) => {
          const res = await fetch(`/api/repo/${owner}/${repo}/raw/${filePath}?branch=${encodeURIComponent(branch)}`);
          if (!res.ok) return [];
          const content = await res.text();
          const imports = parseImports(filePath, content);

          return imports
            .map((imp) => {
              const resolved = resolveImportPath(filePath, imp.target, allPaths);
              if (resolved) return { source: filePath, target: resolved };
              return null;
            })
            .filter(Boolean) as Array<{ source: string; target: string }>;
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          resolvedDeps.push(...result.value);
        }
      }

      return addDependencyLinks(graph, resolvedDeps);
    },
    enabled: !!graph && graph.nodes.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });
}
