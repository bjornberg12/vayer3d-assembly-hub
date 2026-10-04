/**
 * Three-phase power transformer (oil-immersed distribution type).
 * HV pins H1 H2 H3 HN on one side, LV pins X1 X2 X3 XN PE on the other.
 * Model-specific values live in the object's property values (keys in TRANSFORMER_PARAMS).
 * Cables and lines attach to the whole side via the terminal ends "<id>#hv" / "<id>#lv".
 */
import { Part } from "@/components/PartLabel";
import type { PinDef } from "../car-components/EVComponents";

export type VectorGroup = "Dyn11" | "YNyn0";

export type TransformerParam = { key: string; label: string; unit: string; min: number; max: number; step: number };

export const TRANSFORMER_PARAMS: TransformerParam[] = [
  { key: "tfPrimaryV", label: "Primary voltage (L-L)", unit: "V", min: 1, max: 400000, step: 100 },
  { key: "tfSecondaryV", label: "Secondary voltage (L-L)", unit: "V", min: 1, max: 400000, step: 10 },
  { key: "tfRatedKVA", label: "Rated power", unit: "kVA", min: 1, max: 100000, step: 10 },
  { key: "tfUk", label: "Short-circuit impedance uk", unit: "%", min: 0.5, max: 20, step: 0.1 },
  { key: "tfTap", label: "Tap position", unit: "%", min: -10, max: 10, step: 2.5 },
];

export function transformerDefaults(): Record<string, string | number> {
  return {
    tfPrimaryV: 10000, tfSecondaryV: 400, tfRatedKVA: 630, tfUk: 4, tfTap: 0, tfVector: "Dyn11",
    modelId: "TMG-630/10", mass: 2100, material: "Steel / oil / copper", height: 1.6, width: 1.5, depth: 0.95,
    nominalVoltage: 10000, voltageKind: "AC", ratedPower: 630, frequency: 50, phases: 3,
  };
}

/** Per-phase solver data for one transformer. */
export function transformerModel(v: Record<string, string | number | undefined>) {
  const vp = Math.max(Number(v.tfPrimaryV ?? 10000), 1);
  const vs = Math.max(Number(v.tfSecondaryV ?? 400), 1);
  const s = Math.max(Number(v.tfRatedKVA ?? 630), 0.1) * 1000;
  const uk = Math.max(Number(v.tfUk ?? 4), 0.01) / 100;
  const tap = Number(v.tfTap ?? 0) / 100;
  const vector = (String(v.tfVector ?? "Dyn11") as VectorGroup);
  // Dyn11: HV winding is line-to-line, LV winding line-to-neutral.
  const hvWinding = vp * (1 + tap);
  const lvWinding = vs / Math.sqrt(3);
  const ratio = vector === "Dyn11" ? hvWinding / lvWinding : hvWinding / vs;
  const rSec = (uk * vs * vs) / s; // per-phase series impedance on the LV side (treated as resistive)
  return { ratio, rSec, vector, ratedVA: s, vp, vs };
}

export const TF_HV_PINS = ["h1", "h2", "h3"] as const;
export const TF_LV_PINS = ["x1", "x2", "x3"] as const;

export function transformerPins(): PinDef[] {
  const hv: [string, string, PinDef["role"]][] = [["h1", "HV H1", "L1"], ["h2", "HV H2", "L2"], ["h3", "HV H3", "L3"], ["hn", "HV N", "N"]];
  const lv: [string, string, PinDef["role"]][] = [["x1", "LV X1", "L1"], ["x2", "LV X2", "L2"], ["x3", "LV X3", "L3"], ["xn", "LV N", "N"], ["pe", "PE", "PE"]];
  return [
    ...hv.map(([id, label, role], i) => ({ id, label, role, local: [(i - 1.5) * 0.32, id === "hn" ? 1.2 : 1.98, -0.22] as [number, number, number] })),
    ...lv.map(([id, label, role], i) => ({ id, label, role, local: [(i - 2) * 0.26, id === "pe" ? 0.4 : 1.68, 0.3] as [number, number, number] })),
  ];
}

/** Attachment points for 3-phase cables/lines on each side (HV or LV bushing tops). */
export function transformerTerminalLocals(side: "hv" | "lv"): [number, number, number][] {
  const ids = side === "hv" ? TF_HV_PINS : TF_LV_PINS;
  const pins = transformerPins();
  return ids.map((id) => pins.find((p) => p.id === id)!.local);
}

export function TransformerModel() {
  const tank = "#5b6b5a";
  return (
    <Part name="Power transformer">
      {/* base skid */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.95]} />
        <meshStandardMaterial color="#2f3532" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* tank */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 0.6]} />
        <meshStandardMaterial color={tank} metalness={0.4} roughness={0.55} />
      </mesh>
      {/* radiator fins */}
      {Array.from({ length: 9 }).map((_, i) => (
        <group key={i}>
          <mesh position={[-0.48 + i * 0.12, 0.7, 0.4]} castShadow>
            <boxGeometry args={[0.03, 0.95, 0.2]} />
            <meshStandardMaterial color={tank} metalness={0.4} roughness={0.55} />
          </mesh>
          <mesh position={[-0.48 + i * 0.12, 0.7, -0.4]} castShadow>
            <boxGeometry args={[0.03, 0.95, 0.2]} />
            <meshStandardMaterial color={tank} metalness={0.4} roughness={0.55} />
          </mesh>
        </group>
      ))}
      {/* lid + conservator */}
      <mesh position={[0, 1.34, 0]}>
        <boxGeometry args={[1.26, 0.04, 0.66]} />
        <meshStandardMaterial color="#4a5749" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.45, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 20]} />
        <meshStandardMaterial color={tank} metalness={0.4} roughness={0.55} />
      </mesh>
      {/* nameplate */}
      <mesh position={[0, 0.9, 0.302]}>
        <planeGeometry args={[0.3, 0.16]} />
        <meshStandardMaterial color="#d4d4d4" metalness={0.6} />
      </mesh>
      {/* bushings */}
      {transformerPins().filter((p) => p.id !== "pe" && p.id !== "hn").map((p) => {
        const hv = p.id.startsWith("h");
        const h = p.local[1] - 1.36;
        return (
          <group key={p.id} position={[p.local[0], 1.36, p.local[2]]}>
            <mesh position={[0, h / 2, 0]}>
              <cylinderGeometry args={[hv ? 0.045 : 0.035, hv ? 0.07 : 0.05, h, 14]} />
              <meshStandardMaterial color={hv ? "#7a3b1d" : "#e8e4d8"} roughness={0.35} />
            </mesh>
            {hv && [0.12, 0.24, 0.36, 0.48].map((y) => (
              <mesh key={y} position={[0, y, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
                <meshStandardMaterial color="#7a3b1d" roughness={0.35} />
              </mesh>
            ))}
          </group>
        );
      })}
    </Part>
  );
}
