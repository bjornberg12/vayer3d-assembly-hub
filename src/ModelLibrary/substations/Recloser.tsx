/** Pole-mounted three-phase MV auto-recloser with live solver switching. */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import type { SolverWire } from "../sources/solver";
import { CableSocket, EquipmentBox, StatusLed } from "../common/EquipmentDetails";

export const RECLOSER_PARAMS = [
  { key: "recTripA", label: "Overcurrent pickup I>", unit: "A", min: 10, max: 2000, step: 10 },
] as const;

export function recloserDefaults(): Record<string, string | number> {
  return {
    recClosed: 1,
    recTripA: 400,
    recAuto: 1,
    recTripped: "",
    recAttempts: 0,
    modelId: "REC-24-630",
    manufacturer: "Generic IEC",
    mass: 185,
    material: "Porcelain / galvanized steel",
    height: 5.2,
    width: 1.1,
    depth: 0.8,
    nominalVoltage: 20000,
    voltageKind: "AC",
    ratedCurrent: 630,
    maxCurrent: 800,
    frequency: 50,
    phases: 3,
  };
}

export const recloserConducts = (v: Record<string, string | number | undefined>) =>
  Number(v.recClosed ?? 1) !== 0 && !String(v.recTripped ?? "");

export function recloserWires(
  id: string,
  v: Record<string, string | number | undefined>,
): SolverWire[] {
  if (!recloserConducts(v)) return [];
  return [0, 1, 2].map((phase) => ({
    id: `${id}~recloser~${phase}`,
    a: `${id}#in@${phase}`,
    b: `${id}#out@${phase}`,
    r: 0.0002,
  }));
}

export function recloserTerminalLocals(side: "in" | "out"): [number, number, number][] {
  const z = side === "in" ? -0.34 : 0.34;
  return [-0.26, 0, 0.26].map((x) => [x, 4.05, z] as [number, number, number]);
}

export function RecloserModel({ values }: { values: Record<string, string | number> }) {
  const tripped = String(values.recTripped ?? "");
  const on = recloserConducts(values);
  return (
    <Part name={`Auto-recloser · ${tripped ? "TRIPPED" : on ? "Closed" : "Open"}`}>
      <group>
        <mesh position={[0, 2.35, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.16, 4.7, 18]} />
          <meshStandardMaterial color="#765b3d" roughness={0.9} />
        </mesh>
        <EquipmentBox
          position={[0, 3.65, 0]}
          size={[0.95, 0.09, 0.09]}
          color="#657178"
          metalness={0.8}
        />
        {[-0.26, 0, 0.26].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 3.88, 0]} castShadow>
              <cylinderGeometry args={[0.075, 0.09, 0.55, 16]} />
              <meshStandardMaterial color="#8b4d31" roughness={0.45} />
            </mesh>
            {[3.68, 3.8, 3.92, 4.04].map((y) => (
              <mesh key={y} position={[0, y, 0]}>
                <cylinderGeometry args={[0.115, 0.115, 0.025, 18]} />
                <meshStandardMaterial color="#9c593b" roughness={0.42} />
              </mesh>
            ))}
            {(["in", "out"] as const).map((side) => {
              const p = recloserTerminalLocals(side)[x === 0 ? 1 : x < 0 ? 0 : 2]!;
              return <CableSocket key={side} position={[0, p[1], p[2]]} size={0.035} />;
            })}
          </group>
        ))}
        <EquipmentBox
          position={[0.35, 2.95, 0]}
          size={[0.42, 0.58, 0.34]}
          color="#c5ccca"
          metalness={0.45}
        />
        <EquipmentBox
          position={[0.35, 3.02, 0.18]}
          size={[0.32, 0.25, 0.02]}
          color="#26343b"
          metalness={0.3}
        />
        <Text
          position={[0.35, 3.05, 0.195]}
          fontSize={0.035}
          color={tripped ? "#fdba74" : "#a7f3d0"}
          anchorX="center"
        >
          {tripped ? "TRIP" : on ? "CLOSED" : "OPEN"}
        </Text>
        <StatusLed position={[0.47, 2.82, 0.19]} on={on} color="#ef4444" size={0.018} />
        <StatusLed
          position={[0.28, 2.82, 0.19]}
          on={!on && !tripped}
          color="#22c55e"
          size={0.018}
        />
        <StatusLed position={[0.35, 2.75, 0.19]} on={!!tripped} color="#f97316" size={0.018} />
      </group>
    </Part>
  );
}
