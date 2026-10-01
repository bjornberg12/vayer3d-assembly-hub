import { useState } from "react";
import { X } from "lucide-react";
import {
  BASE_PROPERTIES,
  VOLTAGE_KIND_KEY,
  type BasePropId,
  type ObjectProps,
} from "@/ModelLibrary";

const INPUT_CLASS =
  "w-full min-w-0 rounded-lg border border-white/70 bg-white/65 px-2 py-1 text-xs text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/30";

/** Editor for the shared basic properties every model has. */
export function BasePropsEditor({
  props,
  onChange,
}: {
  props: ObjectProps;
  onChange: (next: ObjectProps) => void;
}) {
  const [picking, setPicking] = useState(false);
  const inactive = BASE_PROPERTIES.filter((d) => !props.active.includes(d.id));
  const set = (key: string, v: string | number) =>
    onChange({ ...props, values: { ...props.values, [key]: v } });
  const toggle = (id: BasePropId, on: boolean) =>
    onChange({
      ...props,
      active: on ? [...props.active, id] : props.active.filter((a) => a !== id),
    });

  return (
    <div className="space-y-2">
      <div className="border-b border-white/40 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
        Basic properties
      </div>
      {BASE_PROPERTIES.filter((d) => props.active.includes(d.id)).map((d) => (
        <div
          key={d.id}
          className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-2 text-xs text-neutral-800"
        >
          <span className="truncate text-[11px]" title={d.label}>
            {d.label}
          </span>
          {d.type === "text" ? (
            <input
              value={String(props.values[d.id] ?? "")}
              onChange={(e) => set(d.id, e.target.value)}
              className={INPUT_CLASS}
            />
          ) : (
            <input
              type="number"
              min={d.min}
              max={d.max}
              step={d.step}
              value={Number(props.values[d.id] ?? 0)}
              onChange={(e) => set(d.id, Number(e.target.value))}
              className={`${INPUT_CLASS} font-mono`}
            />
          )}
          <span className="flex items-center justify-end gap-1">
            {d.unit && (
              <span className="text-[10px] text-neutral-500">{d.unit}</span>
            )}
            {d.id === "nominalVoltage" && (
              <span className="flex overflow-hidden rounded-md border border-white/60 shadow-sm">
                {(["AC", "DC"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => set(VOLTAGE_KIND_KEY, k)}
                    className={`px-1.5 py-0.5 text-[9px] font-bold transition ${
                      props.values[VOLTAGE_KIND_KEY] === k
                        ? "bg-amber-400/80 text-neutral-900"
                        : "bg-white/55 text-neutral-500 hover:bg-white/80"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </span>
            )}
            {d.id !== "name" && (
              <button
                onClick={() => toggle(d.id, false)}
                aria-label={`Hide ${d.label}`}
                title={`Hide ${d.label}`}
                className="grid h-4 w-4 place-items-center rounded-full text-neutral-500 transition hover:bg-black/10 hover:text-neutral-900"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        </div>
      ))}
      {inactive.length > 0 &&
        (picking ? (
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-white/50 bg-white/40 p-2">
            {inactive.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  toggle(d.id, true);
                  if (inactive.length === 1) setPicking(false);
                }}
                className="rounded-lg border border-white/60 bg-white/60 px-2 py-1 text-[11px] font-medium text-neutral-800 shadow-sm transition hover:bg-amber-300/60"
              >
                + {d.label}
              </button>
            ))}
            <button
              onClick={() => setPicking(false)}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-neutral-600 underline-offset-2 hover:underline"
            >
              Done
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPicking(true)}
            className="w-full rounded-lg border border-dashed border-neutral-400/70 bg-white/25 px-2 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:bg-white/45"
          >
            + Add property
          </button>
        ))}
    </div>
  );
}
