"use client";

import { useState, useCallback, Suspense } from "react";
import { useRepoGraph, useFileContent, useDependencyLinks } from "@/hooks/useRepoGraph";
import { parseGitHubUrl } from "@/lib/utils";
import type { GraphNode, SelectedNode } from "@/lib/types";
import StatsPanels from "@/components/StatsPanels";
import FileSidebar from "@/components/FileSidebar";
import { useResizable, ResizablePanel } from "@/components/ResizeHandle";
import StructuraGraph from "@/components/StructuraGraph";
import {
  Search,
  GitFork,
  Star,
  Loader2,
  AlertCircle,
  ArrowRight,
  Github,
  Zap,
  Eye,
  Network,
  Boxes,
} from "lucide-react";

export default function RepoExplorer() {
  const [inputUrl, setInputUrl] = useState("");
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightModule, setHighlightModule] = useState<string | null>(null);

  const { graph, modules, stats, repoData, isLoading, isError, error } =
    useRepoGraph({
      owner: repoInfo?.owner ?? "",
      repo: repoInfo?.repo ?? "",
      enabled: !!repoInfo,
    });

  const { fetchFile, fileData, isLoadingFile, reset: resetFile } = useFileContent(
    repoInfo?.owner ?? "",
    repoInfo?.repo ?? "",
    repoData?.default_branch ?? "main"
  );

  const { data: enhancedGraph } = useDependencyLinks(
    repoInfo?.owner ?? "",
    repoInfo?.repo ?? "",
    graph,
    repoData?.default_branch ?? "main"
  );

  const displayGraph = enhancedGraph ?? graph;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = parseGitHubUrl(inputUrl);
      if (parsed) {
        setRepoInfo(parsed);
        setSelectedNode(null);
        resetFile();
      }
    },
    [inputUrl, resetFile]
  );

  // Single click = select + auto-fetch for files
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      if (node.type === "file") fetchFile(node);
    },
    [fetchFile]
  );

  const handleViewFile = useCallback(
    (node: GraphNode) => {
      fetchFile(node);
    },
    [fetchFile]
  );

  const fileDataAsSelectedNode: SelectedNode | null = fileData
    ? { node: fileData.node, content: fileData.content, analysis: fileData.analysis }
    : null;

  // ── Resizable panels ──────────────────────────────────────────
  const leftPanel = useResizable({
    side: "left",
    initial: 220,
    min: 140,
    max: 500,
  });

  const rightPanel = useResizable({
    side: "right",
    initial: 380,
    min: 200,
    max: 700,
  });

  // ── Landing ───────────────────────────────────────────────────
  if (!repoInfo) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#ADE8F4" }}
            >
              <Network className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-black tracking-tight">Structura</h1>
          </div>

          <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
            Paste any public GitHub repository URL to instantly generate an
            interactive 3D architecture graph of its structure.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto mt-6">
            <div className="relative flex-1">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="owner/repo"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full h-11 rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#ADE8F4] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={!parseGitHubUrl(inputUrl)}
              className="h-11 px-5 rounded-lg text-sm font-medium text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{ backgroundColor: "#ADE8F4" }}
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-1 mt-3">
            <span className="text-[11px] text-zinc-400 mr-1">Try:</span>
            {["facebook/react", "vercel/next.js", "denoland/deno", "tailwindlabs/tailwindcss"].map(
              (ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setInputUrl(ex);
                    const p = parseGitHubUrl(ex);
                    if (p) setRepoInfo(p);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-black px-2 py-0.5 rounded hover:bg-zinc-50 font-mono transition-colors cursor-pointer"
                >
                  {ex}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            {
              icon: <Eye className="w-4 h-4" />,
              title: "3D Architecture",
              desc: "Interactive force-directed graph of folder hierarchy and dependencies.",
            },
            {
              icon: <Zap className="w-4 h-4" />,
              title: "Module Detection",
              desc: "Auto-identifies API, frontend, database, and other module types.",
            },
            {
              icon: <Boxes className="w-4 h-4" />,
              title: "Code Preview",
              desc: "Click any file for syntax-highlighted source code preview.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-100 p-4 space-y-1.5"
            >
              <div style={{ color: "#5AB8C9" }}>{f.icon}</div>
              <h3 className="text-sm font-medium text-black">{f.title}</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Explorer ──────────────────────────────────────────────────
  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-zinc-200 bg-white flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <button
          onClick={() => {
            setRepoInfo(null);
            setSelectedNode(null);
            resetFile();
          }}
          className="flex items-center gap-1.5 text-black font-semibold text-sm hover:opacity-70 transition-opacity cursor-pointer"
        >
          <Network className="w-4 h-4" style={{ color: "#ADE8F4" }} />
          Structura
        </button>

        <form onSubmit={handleSubmit} className="flex gap-1.5 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Github className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="owner/repo"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full h-8 rounded-md border border-zinc-200 bg-white pl-8 pr-2 text-xs text-black placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#ADE8F4]"
            />
          </div>
          <button
            type="submit"
            disabled={!parseGitHubUrl(inputUrl)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-black disabled:opacity-30 cursor-pointer"
            style={{ backgroundColor: "#ADE8F4" }}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {repoData && (
          <div className="flex items-center gap-3 text-xs text-zinc-500 ml-auto">
            <a
              href={repoData.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-black transition-colors"
            >
              {repoData.full_name}
            </a>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3" />
              {repoData.stargazers_count.toLocaleString()}
            </div>
            <div className="flex items-center gap-0.5">
              <GitFork className="w-3 h-3" />
              {repoData.forks_count.toLocaleString()}
            </div>
            {repoData.language && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium text-black"
                style={{ backgroundColor: "#ADE8F4" }}
              >
                {repoData.language}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Body — left panel | graph | right panel */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left: Stats panel ──────────────────────────── */}
        <ResizablePanel
          side="left"
          width={leftPanel.width}
          collapsed={leftPanel.collapsed}
          onToggle={leftPanel.toggle}
          handlers={leftPanel.handlers}
        >
          <StatsPanels
            stats={stats}
            modules={modules}
            highlightModule={highlightModule}
            onHighlightModule={setHighlightModule}
          />
        </ResizablePanel>

        {/* ── Center: Graph ──────────────────────────────── */}
        <main className="flex-1 relative min-h-0 min-w-0">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#ADE8F4" }} />
              <span className="text-sm text-zinc-400">
                Fetching repository structure…
              </span>
              <span className="text-xs text-zinc-300 font-mono">
                {repoInfo.owner}/{repoInfo.repo}
              </span>
            </div>
          ) : isError ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <h2 className="text-sm font-medium text-black">
                Failed to load repository
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm text-center">
                {error?.message ?? "An error occurred."}
              </p>
              <button
                onClick={() => {
                  setRepoInfo(null);
                  setSelectedNode(null);
                }}
                className="text-xs text-zinc-500 hover:text-black border border-zinc-200 rounded-md px-3 py-1.5 transition-colors cursor-pointer"
              >
                Try Another Repository
              </button>
            </div>
          ) : displayGraph ? (
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                </div>
              }
            >
              <StructuraGraph
                data={displayGraph}
                onNodeClick={handleNodeClick}
                highlightModule={highlightModule}
              />
            </Suspense>
          ) : null}
        </main>

        {/* ── Right: File sidebar ────────────────────────── */}
        <ResizablePanel
          side="right"
          width={rightPanel.width}
          collapsed={rightPanel.collapsed}
          onToggle={rightPanel.toggle}
          handlers={rightPanel.handlers}
        >
          <FileSidebar
            selectedNode={selectedNode}
            fileData={fileDataAsSelectedNode}
            isLoadingFile={isLoadingFile}
            onViewFile={handleViewFile}
            owner={repoInfo?.owner}
            repo={repoInfo?.repo}
            onClose={() => {
              setSelectedNode(null);
              resetFile();
            }}
          />
        </ResizablePanel>
      </div>
    </div>
  );
}
