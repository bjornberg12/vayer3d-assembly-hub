import { useState } from "react";
import { X } from "lucide-react";
import {
  BASE_PROPERTIES,
  VOLTAGE_KIND_KEY,
  type BasePropId,
  type ObjectProps,
} from "@/ModelLibrary";

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
    <div className="space-y-1.5">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">
        Basic properties
      </div>
      {BASE_PROPERTIES.filter((d) => props.active.includes(d.id)).map((d) => (
        <div key={d.id} className="flex items-center gap-1.5 text-xs text-neutral-800">
          <span className="w-24 shrink-0 truncate">{d.label}</span>
          {d.type === "text" ? (
            <input
              value={String(props.values[d.id] ?? "")}
              onChange={(e) => set(d.id, e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-white/60 bg-white/60 px-1.5 py-0.5"
            />
          ) : (
            <input
              type="number"
              min={d.min}
              max={d.max}
              step={d.step}
              value={Number(props.values[d.id] ?? 0)}
              onChange={(e) => set(d.id, Number(e.target.value))}
              className="min-w-0 flex-1 rounded-md border border-white/60 bg-white/60 px-1.5 py-0.5 font-mono"
            />
          )}
          {d.unit && <span className="w-6 text-[10px] text-neutral-500">{d.unit}</span>}
          {d.id === "nominalVoltage" && (
            <button
              onClick={() =>
                set(VOLTAGE_KIND_KEY, props.values[VOLTAGE_KIND_KEY] === "DC" ? "AC" : "DC")
              }
              className="rounded-md border border-white/60 bg-amber-400/70 px-1.5 py-0.5 text-[10px] font-bold"
              title="Toggle AC / DC"
            >
              {props.values[VOLTAGE_KIND_KEY] === "DC" ? "DC" : "AC"}
            </button>
          )}
          {d.id !== "name" && (
            <button
              onClick={() => toggle(d.id, false)}
              aria-label={`Hide ${d.label}`}
              className="rounded p-0.5 text-neutral-500 hover:bg-black/10"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {inactive.length > 0 &&
        (picking ? (
          <div className="flex flex-wrap gap-1 rounded-lg border border-white/50 bg-white/40 p-1.5">
            {inactive.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  toggle(d.id, true);
                  if (inactive.length === 1) setPicking(false);
                }}
                className="rounded-md border border-white/60 bg-white/60 px-1.5 py-0.5 text-[11px] hover:bg-amber-300/70"
              >
                + {d.label}
              </button>
            ))}
            <button onClick={() => setPicking(false)} className="px-1 text-[11px] text-neutral-500">
              Done
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPicking(true)}
            className="w-full rounded-lg border border-dashed border-neutral-400/70 px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-white/40"
          >
            + Add property
          </button>
        ))}
    </div>
  );
}
