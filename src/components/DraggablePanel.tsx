import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface DraggablePanelProps {
  initialX: number;
  initialY: number;
  title: string;
  width?: number;
  /** Called when the cursor leaves the panel boundaries. */
  onClose?: () => void;
  children: ReactNode;
}

export function DraggablePanel({
  initialX,
  initialY,
  title,
  width = 288,
  onClose,
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

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  const cancelClose = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const scheduleClose = () => {
    if (!onClose || dragging.current) return;
    cancelClose();
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      if (!dragging.current) onClose();
    }, 260);
  };

  return (
    <div
      className="fixed z-20 flex max-h-[50dvh] flex-col overflow-hidden rounded-xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md"
      style={{ left: pos.x, top: pos.y, width }}
      onPointerEnter={cancelClose}
      onPointerLeave={scheduleClose}
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
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500" aria-hidden="true">⋮⋮</span>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-neutral-600 transition hover:bg-white/60 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
