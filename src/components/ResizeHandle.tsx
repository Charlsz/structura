"use client";

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 * useResizable – headless hook for drag-to-resize with pointer capture
 * ────────────────────────────────────────────────────────────────── */

interface UseResizableOptions {
  side: "left" | "right";
  initial: number;
  min: number;
  max: number;
}

export function useResizable({ side, initial, min, max }: UseResizableOptions) {
  const [width, setWidth] = useState(initial);
  const [collapsed, setCollapsed] = useState(false);
  const dragging = useRef(false);
  const origin = useRef({ x: 0, w: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragging.current = true;
      origin.current = { x: e.clientX, w: width };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - origin.current.x;
      const next =
        side === "left"
          ? origin.current.w + delta
          : origin.current.w - delta;
      setWidth(Math.max(min, Math.min(max, next)));
    },
    [side, min, max]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return {
    width: collapsed ? 0 : width,
    collapsed,
    toggle,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}

/* ──────────────────────────────────────────────────────────────────
 * ResizablePanel – panel + drag gutter as one unit
 * ────────────────────────────────────────────────────────────────── */

interface ResizablePanelProps {
  side: "left" | "right";
  width: number;
  collapsed: boolean;
  onToggle: () => void;
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
  children: ReactNode;
}

export function ResizablePanel({
  side,
  width,
  collapsed,
  onToggle,
  handlers,
  children,
}: ResizablePanelProps) {
  const CollapseIcon =
    side === "left"
      ? collapsed ? PanelLeftOpen : PanelLeftClose
      : collapsed ? PanelRightOpen : PanelRightClose;

  const gutter = (
    <div className="relative flex-shrink-0 group" style={{ width: 8 }}>
      {/* Wide pointer-capture hit area */}
      <div
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        className="absolute inset-y-0 z-30 cursor-col-resize touch-none"
        style={{ left: -4, right: -4 }}
      />
      {/* Visible bar */}
      <div className="absolute inset-y-0 left-[3px] w-[2px] bg-zinc-200 group-hover:bg-[#ADE8F4] transition-colors" />
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 z-40 w-5 h-8 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center justify-center hover:border-[#ADE8F4] hover:bg-[#ADE8F4]/10 transition-colors cursor-pointer"
        style={{ left: -6 }}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <CollapseIcon className="w-3 h-3 text-zinc-400" />
      </button>
    </div>
  );

  return (
    <div
      className="flex flex-shrink-0 h-full"
      style={{ flexDirection: side === "left" ? "row" : "row-reverse" }}
    >
      {!collapsed && (
        <div className="overflow-y-auto overflow-x-hidden h-full" style={{ width }}>
          {children}
        </div>
      )}
      {gutter}
    </div>
  );
}
