import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface DraggablePanelProps {
  initialX: number;
  initialY: number;
  title: string;
  width?: number;
  /** Called when the user closes the panel via the X button. */
  onClose?: () => void;
  /** When true, the panel also closes shortly after the cursor leaves it. */
  closeOnLeave?: boolean;
  children: ReactNode;
}

export function DraggablePanel({
  initialX,
  initialY,
  title,
  width = 288,
  onClose,
  closeOnLeave = false,
  children,
}: DraggablePanelProps) {
  const clampedPosition = (x: number, y: number) => ({
    x: Math.max(8, Math.min(window.innerWidth - Math.min(width, window.innerWidth - 16) - 8, x)),
    y: Math.max(8, Math.min(window.innerHeight - 48, y)),
  });
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const clamp = () => setPos((current) => clampedPosition(current.x, current.y));
    clamp();
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      setPos(clampedPosition(e.clientX - dragging.current.dx, e.clientY - dragging.current.dy));
    };
    const up = () => {
      dragging.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("resize", clamp);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("resize", clamp);
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
    if (!closeOnLeave || !onClose || dragging.current) return;
    cancelClose();
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      if (!dragging.current) onClose();
    }, 260);
  };

  return (
    <div
      className="fixed z-20 flex max-h-[50dvh] flex-col overflow-hidden rounded-xl border border-white/40 bg-white/40 shadow-xl backdrop-blur-md"
      style={{ left: pos.x, top: pos.y, width: `min(${width}px, calc(100vw - 16px))` }}
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
