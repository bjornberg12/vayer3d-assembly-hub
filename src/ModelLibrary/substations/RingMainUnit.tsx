/** Three-panel 24 kV ring main unit: two ring switches and a protected feeder. */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import { cubicleConducts, makeCubicle, type Cubicle } from "./Switchgear";
import { CableSocket, EquipmentBolt, EquipmentBox, StatusLed } from "../common/EquipmentDetails";

export function defaultRMU(): Cubicle[] {
  return [
    { ...makeCubicle("lbs", 1), id: "r1", label: "Ring A" },
    { ...makeCubicle("lbs", 2), id: "r2", label: "Ring B" },
    { ...makeCubicle("cb", 1), id: "r3", label: "Transformer feeder", pickupA: 80, scA: 800 },
  ];
}

export function parseRMU(value: unknown): Cubicle[] {
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length === 3) return parsed as Cubicle[];
    } catch {
      /* use the complete default unit */
    }
  }
  return defaultRMU();
}

export function rmuDefaults(): Record<string, string | number> {
  return {
    swg: JSON.stringify(defaultRMU()),
    modelId: "RMU-24-630",
    manufacturer: "Generic IEC",
    mass: 780,
    material: "Painted steel / SF6-free insulation",
    height: 1.9,
    width: 1.65,
    depth: 0.85,
    nominalVoltage: 20000,
    voltageKind: "AC",
    ratedCurrent: 630,
    maxCurrent: 630,
    frequency: 50,
    phases: 3,
  };
}

export function rmuTerminalLocals(k: number): [number, number, number][] {
  const x = (k - 1) * 0.52;
  return [-0.13, 0, 0.13].map((dx) => [x + dx, 0.23, 0.49] as [number, number, number]);
}

export function RingMainUnitModel({ cubicles }: { cubicles: Cubicle[] }) {
  return (
    <group>
      <EquipmentBox
        position={[0, 0.07, 0]}
        size={[1.7, 0.14, 0.9]}
        color="#555f64"
        metalness={0.55}
      />
      {cubicles.map((c, k) => {
        const x = (k - 1) * 0.52;
        const on = cubicleConducts(c);
        return (
          <Part
            key={c.id}
            name={`RMU · ${c.label} · ${c.tripped ? "TRIPPED" : on ? "Closed" : "Open"}`}
          >
            <group position={[x, 0, 0]}>
              <EquipmentBox
                position={[0, 1.0, 0]}
                size={[0.5, 1.75, 0.78]}
                color="#c5cbc9"
                metalness={0.45}
              />
              <EquipmentBox
                position={[0, 1.13, 0.4]}
                size={[0.43, 1.15, 0.025]}
                color="#d9dddb"
                metalness={0.3}
              />
              <EquipmentBox
                position={[0, 1.42, 0.42]}
                size={[0.3, 0.25, 0.035]}
                color="#26343b"
                metalness={0.35}
              />
              <Text position={[0, 1.68, 0.425]} fontSize={0.045} color="#1f2937" anchorX="center">
                {c.label}
              </Text>
              <Text
                position={[0, 1.44, 0.445]}
                fontSize={0.035}
                color={c.tripped ? "#fdba74" : "#a7f3d0"}
                anchorX="center"
              >
                {c.tripped ? "TRIP" : on ? "I  CLOSED" : "O  OPEN"}
              </Text>
              <EquipmentBox
                position={[0, 1.05, 0.425]}
                size={[0.018, 0.35, 0.012]}
                color="#374151"
              />
              <mesh position={[0, 1.08, 0.445]} rotation={[0, 0, on ? 0 : Math.PI / 2]}>
                <boxGeometry args={[0.035, 0.17, 0.025]} />
                <meshStandardMaterial color={on ? "#dc2626" : "#16a34a"} />
              </mesh>
              <StatusLed
                position={[0.15, 1.23, 0.45]}
                on={on}
                color={c.tripped ? "#f97316" : "#ef4444"}
                size={0.018}
              />
              <StatusLed
                position={[0.15, 1.16, 0.45]}
                on={!on && !c.tripped}
                color="#22c55e"
                size={0.018}
              />
              <mesh position={[-0.15, 1.23, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.025, 20]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.4} />
              </mesh>
              <EquipmentBox
                position={[0, 0.4, 0.405]}
                size={[0.42, 0.38, 0.03]}
                color="#667178"
                metalness={0.45}
              />
              {rmuTerminalLocals(k).map((p, phase) => (
                <CableSocket key={phase} position={[p[0] - x, p[1], p[2]]} size={0.032} />
              ))}
              {[-0.18, 0.18].flatMap((bx) =>
                [0.62, 1.58].map((by) => (
                  <EquipmentBolt key={`${bx}-${by}`} position={[bx, by, 0.43]} size={0.012} />
                )),
              )}
            </group>
          </Part>
        );
      })}
    </group>
  );
}
