"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GraphData, GraphNode } from "@/lib/types";
import { MODULE_COLORS } from "@/lib/utils";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
});

interface StructuraGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  highlightModule?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type FGRef = any;

export default function StructuraGraph({
  data,
  onNodeClick,
  highlightModule,
}: StructuraGraphProps) {
  const fgRef = useRef<FGRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  // ── Responsive sizing via ResizeObserver ─────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Graph data transform ────────────────────────────────────
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({
        ...n,
        val: n.type === "folder" ? 3 : Math.max(1, Math.log10((n.size ?? 100) + 1)),
      })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data]
  );

  // ── Click handler — fires immediately, no delay ─────────────
  const handleClick = useCallback(
    (node: any) => {
      const id = String(node.id);
      const gn = data.nodes.find((n) => n.id === id);
      if (gn) onNodeClick?.(gn);

      // Camera zoom
      if (fgRef.current) {
        const d = 120;
        const dist = Math.hypot(node.x ?? 0, node.y ?? 0, node.z ?? 0) || 1;
        const r = 1 + d / dist;
        fgRef.current.cameraPosition(
          { x: (node.x ?? 0) * r, y: (node.y ?? 0) * r, z: (node.z ?? 0) * r },
          node,
          800
        );
      }
    },
    [data.nodes, onNodeClick]
  );

  // ── Visual callbacks ────────────────────────────────────────
  const nodeColor = useCallback(
    (node: any) => {
      if (hoverNode === node.id) return "#ADE8F4";
      if (highlightModule && node.moduleType !== highlightModule) return "#d4d4d8";
      return node.color ?? MODULE_COLORS[node.moduleType as string] ?? "#a1a1aa";
    },
    [hoverNode, highlightModule]
  );

  const nodeLabel = useCallback(
    (node: any) =>
      `<div style="background:#fff;color:#000;padding:6px 10px;border-radius:6px;font-size:12px;max-width:280px;border:1px solid #e4e4e7;box-shadow:0 2px 8px rgba(0,0,0,.08);pointer-events:none">
        <strong>${node.name}</strong><br/>
        <span style="color:#71717a;font-size:11px">${node.path}</span><br/>
        <span style="color:${MODULE_COLORS[node.moduleType as string] ?? "#71717a"};font-size:11px">${node.moduleType}</span>
        ${node.size ? `<br/><span style="color:#a1a1aa;font-size:11px">${(node.size / 1024).toFixed(1)} KB</span>` : ""}
      </div>`,
    []
  );

  const linkColor = useCallback(
    (link: any) =>
      link.type === "dependency" ? "rgba(173,232,244,0.6)" : "rgba(161,161,170,0.18)",
    []
  );

  const linkWidth = useCallback(
    (link: any) => (link.type === "dependency" ? 1.5 : 0.3),
    []
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: "#f8fafc" }}
    >
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        width={dims.w}
        height={dims.h}
        backgroundColor="#f8fafc"
        nodeColor={nodeColor}
        nodeLabel={nodeLabel}
        nodeRelSize={4}
        nodeOpacity={0.92}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={0.6}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={0.5}
        onNodeClick={handleClick}
        onNodeHover={(node: any) =>
          setHoverNode(node?.id?.toString() ?? null)
        }
        enableNodeDrag
        enableNavigationControls
        showNavInfo={false}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        cooldownTicks={100}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 text-xs text-zinc-600 space-y-1 border border-zinc-200 shadow-sm">
        <div className="font-semibold text-black mb-2">Module Types</div>
        {Object.entries(MODULE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize">{type}</span>
          </div>
        ))}
        <div className="border-t border-zinc-200 mt-2 pt-2 text-zinc-400">
          Click to inspect &amp; view details
        </div>
      </div>
    </div>
  );
}
