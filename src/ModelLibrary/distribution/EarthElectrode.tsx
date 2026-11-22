/** Earth electrode (rods + ring) used by the earthing study; no solver nodes. */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import { meshResistance, rodResistance, rodsParallel } from "../grid/earthing";
import { EquipmentBox } from "../common/EquipmentDetails";

export const ELECTRODE_PARAMS = [
  { key: "soilRho", label: "Soil resistivity ρ", unit: "Ωm", min: 1, max: 10000, step: 1 },
  { key: "rodCount", label: "Number of rods", unit: "", min: 0, max: 50, step: 1 },
  { key: "rodLength", label: "Rod length", unit: "m", min: 0.5, max: 30, step: 0.5 },
  { key: "ringSide", label: "Ring / mesh side", unit: "m", min: 0, max: 200, step: 0.5 },
  { key: "ringConductorM", label: "Mesh conductor length", unit: "m", min: 0, max: 5000, step: 1 },
] as const;

export function electrodeDefaults(): Record<string, string | number> {
  return {
    soilRho: 100, rodCount: 4, rodLength: 3, ringSide: 6, ringConductorM: 24,
    modelId: "ER-CU-16", manufacturer: "Generic IEC", mass: 25, material: "Copper-bonded steel",
    height: 3, width: 6, depth: 6, nominalVoltage: 0, voltageKind: "AC", frequency: 50, phases: 1,
  };
}

/** Combined electrode resistance: rods ∥ mesh (simple parallel, conservative). */
export function electrodeResistance(v: Record<string, string | number | undefined>) {
  const rho = Number(v.soilRho ?? 100), n = Number(v.rodCount ?? 0), L = Number(v.rodLength ?? 3);
  const side = Number(v.ringSide ?? 0), lm = Number(v.ringConductorM ?? 0);
  const parts: number[] = [];
  if (n > 0) parts.push(rodsParallel(rodResistance(rho, L), n, n > 1 ? 0.8 : 1));
  if (side > 0 && lm > 0) parts.push(meshResistance(rho, side * side, lm));
  if (!parts.length) return Infinity;
  return 1 / parts.reduce((s, r) => s + 1 / r, 0);
}

export function EarthElectrodeModel({ values }: { values: Record<string, string | number> }) {
  const n = Math.min(Number(values.rodCount ?? 4), 12), side = Math.min(Number(values.ringSide ?? 6), 12) || 2;
  const r = electrodeResistance(values);
  return (
    <Part name={`Earth electrode · RE ≈ ${Number.isFinite(r) ? r.toFixed(2) : "∞"} Ω`}>
      <group>
        {[0, 1, 2, 3].map((k) => {
          const h = k % 2 === 0;
          return <EquipmentBox key={k} position={h ? [0, 0.01, (k === 0 ? -1 : 1) * side / 2] : [(k === 1 ? 1 : -1) * side / 2, 0.01, 0]} size={h ? [side, 0.02, 0.03] : [0.03, 0.02, side]} color="#b87333" metalness={0.7} />;
        })}
        {Array.from({ length: n }, (_, k) => {
          const a = (k / Math.max(n, 1)) * Math.PI * 2;
          return <EquipmentBox key={k} position={[Math.cos(a) * side / 2, 0.15, Math.sin(a) * side / 2]} size={[0.04, 0.3, 0.04]} color="#c2763b" metalness={0.7} />;
        })}
        <EquipmentBox position={[0, 0.06, 0]} size={[0.3, 0.12, 0.3]} color="#4b5563" />
        <Text position={[0, 0.4, 0]} fontSize={0.12} color="#16a34a" anchorX="center">PE</Text>
      </group>
    </Part>
  );
}
