"use client";

import { useMemo } from "react";
import { Highlight, themes } from "prism-react-renderer";
import type { SelectedNode, GraphNode } from "@/lib/types";
import { MODULE_COLORS } from "@/lib/utils";
import {
  FileText,
  Loader2,
  Eye,
  FileCode,
  X,
  ImageIcon,
} from "lucide-react";

interface FileSidebarProps {
  selectedNode: GraphNode | null;
  fileData: SelectedNode | null;
  isLoadingFile: boolean;
  onViewFile: (node: GraphNode) => void;
  onClose: () => void;
  owner?: string;
  repo?: string;
  style?: React.CSSProperties;
}

const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp", "avif",
]);

function isImageFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", rs: "rust", go: "go", java: "java", rb: "ruby",
    php: "php", css: "css", scss: "css", html: "markup", json: "json",
    yaml: "yaml", yml: "yaml", md: "markdown", sql: "sql",
    sh: "bash", bash: "bash", vue: "markup", svelte: "markup",
    toml: "toml", xml: "markup",
  };
  return map[ext] ?? "typescript";
}

export default function FileSidebar({
  selectedNode,
  fileData,
  isLoadingFile,
  onViewFile,
  onClose,
  owner,
  repo,
  style,
}: FileSidebarProps) {
  const language = useMemo(
    () => (fileData ? getLanguage(fileData.node.path) : "typescript"),
    [fileData]
  );

  // Nothing selected
  if (!selectedNode && !fileData) {
    return (
      <aside
        className="border-l border-zinc-200 bg-white flex items-center justify-center p-8 flex-shrink-0 overflow-hidden"
        style={style}
      >
        <div className="text-center space-y-2">
          <FileCode className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm text-zinc-400">
            Click any node to inspect and view details
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="border-l border-zinc-200 bg-white flex flex-col overflow-hidden flex-shrink-0"
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 min-w-0">
          {isImageFile(fileData?.node.path ?? selectedNode?.path ?? "")
            ? <ImageIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            : <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          }
          <span className="text-sm font-medium text-black truncate">
            {fileData?.node.name ?? selectedNode?.name}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-black transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta info (when node is selected but no file loaded) */}
      {selectedNode && !fileData && (
        <div className="p-4 space-y-3">
          <div className="text-xs text-zinc-500 font-mono break-all">
            {selectedNode.path}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
              style={{
                borderColor: MODULE_COLORS[selectedNode.moduleType] ?? "#d4d4d8",
                color: MODULE_COLORS[selectedNode.moduleType] ?? "#71717a",
              }}
            >
              {selectedNode.moduleType}
            </span>
            {selectedNode.size != null && (
              <span className="text-[10px] text-zinc-400">
                {(selectedNode.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          {selectedNode.type === "file" && (
            <button
              onClick={() => onViewFile(selectedNode)}
              className="w-full flex items-center justify-center gap-1.5 rounded-md bg-[#ADE8F4] px-3 py-2.5 text-xs font-medium text-black hover:bg-[#90ddf0] transition-colors cursor-pointer"
            >
              {isImageFile(selectedNode.path) ? (
                <><ImageIcon className="w-3.5 h-3.5" /> Preview Image</>
              ) : (
                <><Eye className="w-3.5 h-3.5" /> View File</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoadingFile && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading file…</span>
          </div>
        </div>
      )}

      {/* File content */}
      {fileData && !isLoadingFile && (
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
          {/* Image preview or syntax-highlighted code */}
          {isImageFile(fileData.node.path) ? (
            <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 bg-[#fafafa]">
              <div className="space-y-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${fileData.node.path}`}
                  alt={fileData.node.name}
                  className="max-w-full max-h-[60vh] rounded-lg border border-zinc-200 shadow-sm object-contain mx-auto"
                />
                <p className="text-[10px] text-zinc-400">
                  {fileData.node.name}
                  {fileData.node.size != null && (
                    <> · {(fileData.node.size / 1024).toFixed(1)} KB</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <Highlight
                theme={themes.github}
                code={(fileData.content ?? "").slice(0, 10000)}
                language={language}
              >
                {({ style: preStyle, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    style={{
                      ...preStyle,
                      margin: 0,
                      padding: "1rem",
                      fontSize: "11px",
                      lineHeight: "1.6",
                      background: "#fff",
                    }}
                  >
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        <span className="inline-block w-8 text-right mr-3 text-zinc-300 select-none text-[10px]">
                          {i + 1}
                        </span>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
