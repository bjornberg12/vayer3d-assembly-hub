/**
 * Voltage source — ideal AC (3-phase + N + PE) or DC (+/−) supply that powers wires.
 * Model-specific values live in the object's property values (keys from SOURCE_PARAMS).
 */
import { Part } from "@/components/PartLabel";
import type { PinDef } from "../car-components/EVComponents";

export type SourceKind = "AC" | "DC";

export type SourceParam = { key: string; label: string; unit: string; min: number; max: number; step: number; dcOnly?: boolean };

export const SOURCE_PARAMS: SourceParam[] = [
  { key: "srcVoltage", label: "Voltage", unit: "V", min: 0, max: 100000, step: 1 },
  { key: "internalR", label: "Internal resistance", unit: "Ω", min: 0, max: 100, step: 0.001, dcOnly: true },
  { key: "capacityAh", label: "Capacity", unit: "Ah", min: 0, max: 10000, step: 1, dcOnly: true },
];

export function sourceDefaults(kind: SourceKind): Record<string, string | number> {
  return kind === "DC"
    ? { sourceKind: "DC", srcVoltage: 400, internalR: 0.05, capacityAh: 200, voltageKind: "DC", nominalVoltage: 400, frequency: 0, phases: 1, modelId: "VS-DC", mass: 20, height: 0.5, width: 0.6, depth: 0.4, material: "Steel" }
    : { sourceKind: "AC", srcVoltage: 400, internalR: 0, capacityAh: 0, voltageKind: "AC", nominalVoltage: 400, frequency: 50, phases: 3, modelId: "VS-AC3", mass: 20, height: 0.5, width: 0.6, depth: 0.4, material: "Steel" };
}

/** AC: srcVoltage is line-to-line; phase-to-neutral = V/√3 with 0°, −120°, +120° offsets. */
export const PHASE_ANGLES: Record<string, number> = { l1: 0, l2: -120, l3: 120 };

export function sourcePins(kind: string): PinDef[] {
  const y = 0.52, z = 0.12;
  const list: [string, string, PinDef["role"]][] =
    kind === "DC"
      ? [["dcp", "DC+", "dc+"], ["dcn", "DC−", "dc-"]]
      : [["l1", "L1", "L1"], ["l2", "L2", "L2"], ["l3", "L3", "L3"], ["n", "N", "N"], ["pe", "PE", "PE"]];
  const S = 0.09;
  return list.map(([id, label, role], i) => ({ id, label, role, local: [(i - (list.length - 1) / 2) * S, y, z] }));
}

export function VoltageSource({ kind }: { kind: string }) {
  const dc = kind === "DC";
  return (
    <Part name={dc ? "DC voltage source" : "AC 3-phase voltage source"}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.4]} />
        <meshStandardMaterial color={dc ? "#3a4a5c" : "#4a5c3a"} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.3, 0.201]}>
        <planeGeometry args={[0.4, 0.18]} />
        <meshStandardMaterial color="#f5c518" />
      </mesh>
      {sourcePins(kind).map((p) => (
        <mesh key={p.id} position={[p.local[0], 0.505, p.local[2]]}>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </Part>
  );
}
