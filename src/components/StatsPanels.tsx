"use client";

import type { ModuleAnalysis } from "@/lib/types";
import { MODULE_COLORS } from "@/lib/utils";
import { FolderTree, Boxes } from "lucide-react";

interface StatsPanelsProps {
  stats: {
    totalFiles: number;
    totalFolders: number;
    languages: Record<string, number>;
  } | null;
  modules: ModuleAnalysis[];
  highlightModule: string | null;
  onHighlightModule: (mod: string | null) => void;
  style?: React.CSSProperties;
}

export default function StatsPanels({
  stats,
  modules,
  highlightModule,
  onHighlightModule,
  style,
}: StatsPanelsProps) {
  return (
    <aside
      className="border-r border-zinc-200 bg-white flex flex-col overflow-y-auto overflow-x-hidden flex-shrink-0"
      style={style}
    >
      {/* ── Stats ─────────────────────────────────────────────────── */}
      {stats && (
        <div className="p-4 border-b border-zinc-100 space-y-3">
          <h2 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5" />
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-zinc-100 p-2.5 text-center">
              <div className="text-lg font-bold text-black">{stats.totalFiles}</div>
              <div className="text-[10px] text-zinc-400 uppercase">Files</div>
            </div>
            <div className="rounded-lg border border-zinc-100 p-2.5 text-center">
              <div className="text-lg font-bold text-black">{stats.totalFolders}</div>
              <div className="text-[10px] text-zinc-400 uppercase">Folders</div>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Languages
            </div>
            {Object.entries(stats.languages)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([lang, count]) => {
                const pct = Math.round((count / stats.totalFiles) * 100);
                return (
                  <div key={lang} className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-600 font-mono w-12">.{lang}</span>
                    <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: "#ADE8F4",
                        }}
                      />
                    </div>
                    <span className="text-zinc-400 w-6 text-right">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Modules ───────────────────────────────────────────────── */}
      <div className="p-4 space-y-1.5">
        <h2 className="text-xs font-semibold text-black uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Boxes className="w-3.5 h-3.5" />
          Modules
        </h2>

        <button
          onClick={() => onHighlightModule(null)}
          className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
            highlightModule === null
              ? "bg-[#ADE8F4]/20 text-black font-medium"
              : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          All Modules
        </button>

        {modules.map((mod) => (
          <button
            key={mod.type}
            onClick={() =>
              onHighlightModule(highlightModule === mod.type ? null : mod.type)
            }
            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2 cursor-pointer ${
              highlightModule === mod.type
                ? "bg-[#ADE8F4]/20 text-black font-medium"
                : "text-zinc-500 hover:bg-zinc-50"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: MODULE_COLORS[mod.type] }}
            />
            <span className="flex-1">{mod.name}</span>
            <span className="text-zinc-300 text-[10px]">{mod.files.length}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
