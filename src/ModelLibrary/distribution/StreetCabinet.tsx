/** LV street distribution cabinet: incoming busbar with fused outgoing feeder (gG fuse links). */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import type { SolverWire } from "../sources/solver";
import { CableSocket, EquipmentBolt, EquipmentBox, StatusLed } from "../common/EquipmentDetails";

export const CABINET_PARAMS = [
  { key: "cabFuseA", label: "Feeder fuse rating (gG)", unit: "A", min: 16, max: 630, step: 1 },
  { key: "cabBusA", label: "Busbar rating", unit: "A", min: 100, max: 1600, step: 10 },
] as const;

export function cabinetDefaults(): Record<string, string | number> {
  return {
    cabClosed: 1, cabFuseA: 160, cabBusA: 630,
    modelId: "SDC-400-630", manufacturer: "Generic IEC", mass: 95,
    material: "Glass-fibre reinforced polyester / copper", height: 1.3, width: 1.1, depth: 0.35,
    nominalVoltage: 400, voltageKind: "AC", ratedCurrent: 630, maxCurrent: 630, frequency: 50, phases: 3,
  };
}

export const cabinetConducts = (v: Record<string, string | number | undefined>) => Number(v.cabClosed ?? 1) !== 0;

export function cabinetTerminalLocals(side: "in" | "out"): [number, number, number][] {
  const x0 = side === "in" ? -0.42 : 0.12;
  return [0, 1, 2, 3].map((k) => [x0 + k * 0.1, 0.12, 0.05] as [number, number, number]);
}

export function cabinetWires(id: string, v: Record<string, string | number | undefined>): SolverWire[] {
  const out: SolverWire[] = [];
  for (let p = 0; p < 4; p++) {
    if (p < 3 && !cabinetConducts(v)) continue;
    out.push({ id: `${id}~fuse~${p}`, a: `${id}#in@${p}`, b: `${id}#out@${p}`, r: 0.0003 });
  }
  return out;
}

export function StreetCabinetModel({ values, powered }: { values: Record<string, string | number>; powered: boolean }) {
  const closed = cabinetConducts(values);
  return (
    <Part name={`LV street cabinet · ${closed ? "Fuses inserted" : "Fuses removed"}`}>
      <group>
        <EquipmentBox position={[0, 0.05, 0]} size={[1.14, 0.1, 0.38]} color="#5f6668" />
        <EquipmentBox position={[0, 0.68, 0]} size={[1.08, 1.16, 0.32]} color="#8a9a86" metalness={0.15} />
        <EquipmentBox position={[0, 1.29, 0]} size={[1.14, 0.06, 0.38]} color="#6f7d6c" />
        {[-0.27, 0.27].map((x) => (
          <EquipmentBox key={x} position={[x, 0.7, 0.165]} size={[0.5, 1.05, 0.015]} color="#93a48f" metalness={0.1} />
        ))}
        <Text position={[0, 1.12, 0.18]} fontSize={0.05} color="#1f2937" anchorX="center">0.4 kV</Text>
        {[0, 1, 2].map((k) => (
          <EquipmentBox key={k} position={[0.17 + k * 0.1, 0.75, 0.18]} size={[0.06, 0.18, 0.03]} color={closed ? "#e5e7eb" : "#374151"} />
        ))}
        <StatusLed position={[-0.4, 1.0, 0.18]} on={powered} color="#22c55e" size={0.018} />
        {[-0.5, 0.5].map((x) => <EquipmentBolt key={x} position={[x, 1.2, 0.17]} size={0.012} />)}
        {(["in", "out"] as const).map((side) =>
          cabinetTerminalLocals(side).map((p, k) => (
            <CableSocket key={`${side}${k}`} position={p} color={k === 3 ? "#2563eb" : "#b45309"} size={0.025} />
          )),
        )}
      </group>
    </Part>
  );
}
