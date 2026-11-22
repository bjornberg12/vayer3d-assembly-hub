/** Utility grid infeed with a three-phase MV termination and source impedance. */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import { PinTerminal, type PinDef } from "../car-components/EVComponents";
import type { SolverSource } from "./solver";
import { EquipmentBolt, EquipmentBox, StatusLed } from "../common/EquipmentDetails";

export const GRID_INFEED_PARAMS = [
  { key: "srcVoltage", label: "Grid voltage (L-L)", unit: "V", min: 400, max: 400000, step: 100 },
  { key: "gridFaultMVA", label: "Short-circuit power", unit: "MVA", min: 1, max: 10000, step: 10 },
  { key: "gridXR", label: "Source X / R ratio", unit: "", min: 0, max: 50, step: 0.5 },
] as const;

export function gridInfeedDefaults(): Record<string, string | number> {
  return {
    sourceKind: "AC",
    srcVoltage: 20000,
    gridFaultMVA: 500,
    gridXR: 10,
    modelId: "GRID-20KV-500MVA",
    manufacturer: "Utility supply",
    mass: 1450,
    material: "Galvanized steel / porcelain",
    height: 3.2,
    width: 2.4,
    depth: 1.4,
    nominalVoltage: 20000,
    voltageKind: "AC",
    ratedCurrent: 630,
    frequency: 50,
    phases: 3,
  };
}

/** Equivalent per-phase R and X from three-phase short-circuit power. */
export function gridInfeedImpedance(v: Record<string, string | number | undefined>) {
  const voltage = Math.max(Number(v.srcVoltage ?? 20000), 1);
  const faultVA = Math.max(Number(v.gridFaultMVA ?? 500), 0.001) * 1e6;
  const xr = Math.max(Number(v.gridXR ?? 10), 0);
  const z = (voltage * voltage) / faultVA;
  const r = z / Math.sqrt(1 + xr * xr);
  return { z, r, x: r * xr, faultA: faultVA / (Math.sqrt(3) * voltage) };
}

export function gridInfeedSource(
  id: string,
  v: Record<string, string | number | undefined>,
): SolverSource {
  return {
    id,
    kind: "AC",
    voltage: Math.max(Number(v.srcVoltage ?? 20000), 0),
    internalR: gridInfeedImpedance(v).r,
  };
}

export function gridInfeedPins(): PinDef[] {
  const roles = ["L1", "L2", "L3", "N", "PE"] as const;
  return roles.map((role, k) => ({
    id: k < 3 ? `l${k + 1}` : role.toLowerCase(),
    label: k < 3 ? `Grid ${role}` : role,
    role,
    local: [(k - 2) * 0.28, k < 3 ? 2.5 : 0.48, k < 3 ? 0.18 : 0.42],
  }));
}

export function gridInfeedTerminalLocals(): [number, number, number][] {
  return gridInfeedPins()
    .slice(0, 3)
    .map((p) => p.local);
}

export function GridInfeedModel({ energised = false }: { energised?: boolean }) {
  return (
    <Part name="Utility grid infeed · 20 kV class">
      <group>
        <EquipmentBox
          position={[0, 0.08, 0]}
          size={[2.4, 0.16, 1.4]}
          color="#737b80"
          metalness={0.55}
        />
        {[-0.85, 0.85].map((x) => (
          <group key={x}>
            <EquipmentBox
              position={[x, 1.35, -0.15]}
              size={[0.1, 2.55, 0.1]}
              color="#69747a"
              metalness={0.8}
            />
            <EquipmentBox
              position={[x, 0.25, -0.15]}
              size={[0.28, 0.34, 0.28]}
              color="#8b9296"
              metalness={0.35}
            />
          </group>
        ))}
        <EquipmentBox
          position={[0, 2.52, -0.15]}
          size={[2.0, 0.12, 0.12]}
          color="#69747a"
          metalness={0.8}
        />
        {gridInfeedPins()
          .slice(0, 3)
          .map((p) => (
            <group key={p.id} position={[p.local[0], 0, 0]}>
              <mesh position={[0, 2.05, 0.02]} castShadow>
                <cylinderGeometry args={[0.055, 0.085, 0.72, 16]} />
                <meshStandardMaterial color="#8c4b2d" roughness={0.42} />
              </mesh>
              {[1.78, 1.92, 2.06, 2.2, 2.34].map((y) => (
                <mesh key={y} position={[0, y, 0.02]}>
                  <cylinderGeometry args={[0.105, 0.105, 0.025, 18]} />
                  <meshStandardMaterial color="#9b5738" roughness={0.4} />
                </mesh>
              ))}
              <mesh position={[0, 2.43, 0.1]} rotation={[Math.PI / 3, 0, 0]}>
                <cylinderGeometry args={[0.018, 0.018, 0.32, 10]} />
                <meshStandardMaterial color="#b87333" metalness={0.85} roughness={0.3} />
              </mesh>
            </group>
          ))}
        <EquipmentBox
          position={[0, 0.55, 0.28]}
          size={[0.9, 0.9, 0.42]}
          color="#c4c9c8"
          metalness={0.45}
        />
        <EquipmentBox
          position={[0, 0.58, 0.495]}
          size={[0.78, 0.72, 0.018]}
          color="#d7dbd9"
          metalness={0.35}
        />
        <Text position={[0, 0.82, 0.508]} fontSize={0.065} color="#1f2937" anchorX="center">
          GRID INFEED
        </Text>
        <StatusLed position={[0.25, 0.63, 0.515]} on={energised} color="#22c55e" size={0.025} />
        {[-0.32, 0.32].flatMap((x) =>
          [0.3, 0.85].map((y) => (
            <EquipmentBolt key={`${x}-${y}`} position={[x, y, 0.515]} size={0.018} />
          )),
        )}
        {gridInfeedPins().map((p) => (
          <PinTerminal key={p.id} role={p.role} position={p.local} size={0.035} />
        ))}
      </group>
    </Part>
  );
}
