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

/** AC mode: compact diesel generator set (skid, engine, alternator, terminal box with pins on top). */
function Generator() {
  return (
    <Part name="AC 3-phase generator">
      {/* skid base */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.62, 0.06, 0.42]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* engine block */}
      <mesh position={[-0.13, 0.2, -0.04]} castShadow>
        <boxGeometry args={[0.3, 0.28, 0.3]} />
        <meshStandardMaterial color="#d9a21b" metalness={0.3} roughness={0.55} />
      </mesh>
      {/* radiator */}
      <mesh position={[-0.29, 0.22, -0.04]} castShadow>
        <boxGeometry args={[0.03, 0.3, 0.32]} />
        <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* exhaust */}
      <mesh position={[-0.08, 0.4, -0.13]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
        <meshStandardMaterial color="#777" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* alternator (cylinder along x) */}
      <mesh position={[0.15, 0.17, -0.04]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.24, 24]} />
        <meshStandardMaterial color="#3a5a8a" metalness={0.5} roughness={0.4} />
      </mesh>
      {[-0.05, 0.05, 0.15].map((x) => (
        <mesh key={x} position={[0.15 + x - 0.05, 0.17, -0.04]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.122, 0.006, 6, 24]} />
          <meshStandardMaterial color="#223" />
        </mesh>
      ))}
      {/* terminal box carrying the pins at y≈0.5 */}
      <mesh position={[0, 0.45, 0.12]} castShadow>
        <boxGeometry args={[0.5, 0.1, 0.14]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.33, 0.12]}>
        <boxGeometry args={[0.06, 0.16, 0.06]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      {/* control panel */}
      <mesh position={[0.15, 0.32, 0.191]}>
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial color="#111" emissive="#2a6" emissiveIntensity={0.4} />
      </mesh>
      {sourcePins("AC").map((p) => (
        <mesh key={p.id} position={[p.local[0], 0.505, p.local[2]]}>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </Part>
  );
}

export function VoltageSource({ kind }: { kind: string }) {
  const dc = kind === "DC";
  if (!dc) return <Generator />;
  return (
    <Part name="DC voltage source">
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
