import { useEffect, useRef, useState, type ReactNode } from "react";

interface DraggablePanelProps {
  initialX: number;
  initialY: number;
  title: string;
  width?: number;
  children: ReactNode;
}

export function DraggablePanel({
  initialX,
  initialY,
  title,
  width = 288,
  children,
}: DraggablePanelProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const x = Math.max(
        0,
        Math.min(window.innerWidth - 40, e.clientX - dragging.current.dx),
      );
      const y = Math.max(
        0,
        Math.min(window.innerHeight - 40, e.clientY - dragging.current.dy),
      );
      setPos({ x, y });
    };
    const up = () => {
      dragging.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div
      className="fixed z-20 overflow-hidden rounded-xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md"
      style={{ left: pos.x, top: pos.y, width }}
    >
      <div
        onPointerDown={(e) => {
          dragging.current = {
            dx: e.clientX - pos.x,
            dy: e.clientY - pos.y,
          };
          document.body.style.userSelect = "none";
        }}
        className="flex cursor-grab items-center justify-between border-b border-white/30 bg-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-neutral-700 select-none active:cursor-grabbing"
        title="Drag to move"
      >
        <span>{title}</span>
        <span className="text-neutral-500">⋮⋮</span>
      </div>
      {children}
    </div>
  );
}
