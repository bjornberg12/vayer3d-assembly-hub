/** Ground-mounted three-phase house-service kiosk with main switch and balanced load. */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import type { SolverLoad, SolverWire } from "../sources/solver";
import { CableSocket, EquipmentBolt, EquipmentBox, StatusLed } from "../common/EquipmentDetails";

export const HOUSE_PARAMS = [
  { key: "houseLoadKw", label: "Balanced house load", unit: "kW", min: 0, max: 1000, step: 0.5 },
  { key: "houseMainA", label: "Main breaker rating", unit: "A", min: 6, max: 630, step: 1 },
] as const;

export function houseDefaults(): Record<string, string | number> {
  return {
    houseClosed: 1,
    houseLoadKw: 12,
    houseMainA: 63,
    modelId: "HCK-400-63",
    manufacturer: "Generic IEC",
    mass: 145,
    material: "Painted galvanized steel / copper",
    height: 1.8,
    width: 0.9,
    depth: 0.55,
    nominalVoltage: 400,
    voltageKind: "AC",
    ratedCurrent: 63,
    maxCurrent: 63,
    ratedPower: 12,
    frequency: 50,
    phases: 3,
  };
}

export const houseConducts = (v: Record<string, string | number | undefined>) =>
  Number(v.houseClosed ?? 1) !== 0;

export function houseTerminalLocals(side: "in" | "out"): [number, number, number][] {
  const z = side === "in" ? -0.26 : 0.32;
  return [-0.18, -0.06, 0.06, 0.18].map((x) => [x, 0.25, z] as [number, number, number]);
}

/** Three switched phase poles and a continuous neutral link. */
export function houseWires(
  id: string,
  v: Record<string, string | number | undefined>,
): SolverWire[] {
  const out: SolverWire[] = [];
  for (let phase = 0; phase < 4; phase++) {
    if (phase < 3 && !houseConducts(v)) continue;
    out.push({
      id: `${id}~main~${phase}`,
      a: `${id}#in@${phase}`,
      b: `${id}#out@${phase}`,
      r: 0.00015,
    });
  }
  return out;
}

/** Three equal phase-to-neutral resistances representing the editable balanced load. */
export function houseLoads(
  id: string,
  v: Record<string, string | number | undefined>,
): SolverLoad[] {
  const kw = Math.max(Number(v.houseLoadKw ?? 12), 0);
  if (kw <= 0) return [];
  const perPhaseW = (kw * 1000) / 3;
  return [0, 1, 2].map((phase) => ({
    owner: id,
    a: `${id}#out@${phase}`,
    b: `${id}#out@3`,
    r: (230 * 230) / perPhaseW,
    ratedV: 230,
  }));
}

export function HouseConnectionModel({
  values,
  powered,
}: {
  values: Record<string, string | number>;
  powered: boolean;
}) {
  const closed = houseConducts(values);
  return (
    <Part name={`House connection kiosk · ${closed ? "Main breaker closed" : "Main breaker open"}`}>
      <group>
        <EquipmentBox
          position={[0, 0.09, 0]}
          size={[0.98, 0.18, 0.64]}
          color="#777e7e"
          metalness={0.35}
        />
        <EquipmentBox
          position={[0, 0.88, 0]}
          size={[0.86, 1.48, 0.52]}
          color="#c5cbc8"
          metalness={0.5}
        />
        <EquipmentBox
          position={[0, 1.66, 0]}
          size={[0.96, 0.1, 0.62]}
          color="#707b80"
          metalness={0.65}
        />
        <EquipmentBox
          position={[0, 0.95, 0.275]}
          size={[0.75, 1.25, 0.025]}
          color="#dce0dd"
          metalness={0.35}
        />
        <EquipmentBox
          position={[0, 0.95, 0.292]}
          size={[0.012, 1.18, 0.012]}
          color="#9ba3a2"
          metalness={0.55}
        />
        <EquipmentBox
          position={[-0.18, 1.25, 0.3]}
          size={[0.28, 0.3, 0.025]}
          color="#26343b"
          metalness={0.25}
        />
        <Text position={[-0.18, 1.27, 0.318]} fontSize={0.038} color="#a7f3d0" anchorX="center">
          kWh
        </Text>
        <EquipmentBox position={[0.2, 1.22, 0.305]} size={[0.15, 0.34, 0.035]} color="#f3f4f1" />
        <mesh position={[0.2, 1.22, 0.335]} rotation={[closed ? -0.35 : 0.35, 0, 0]}>
          <boxGeometry args={[0.07, 0.14, 0.035]} />
          <meshStandardMaterial color={closed ? "#dc2626" : "#16a34a"} />
        </mesh>
        <Text position={[0, 1.5, 0.3]} fontSize={0.048} color="#1f2937" anchorX="center">
          HOUSE SERVICE
        </Text>
        <StatusLed position={[0.28, 1.39, 0.31]} on={powered} color="#22c55e" size={0.02} />
        {[-0.31, 0.31].flatMap((x) =>
          [0.48, 1.45].map((y) => (
            <EquipmentBolt key={`${x}-${y}`} position={[x, y, 0.305]} size={0.014} />
          )),
        )}
        {Array.from({ length: 6 }, (_, k) => (
          <EquipmentBox
            key={k}
            position={[0, 0.37 + k * 0.055, 0.302]}
            size={[0.48, 0.015, 0.018]}
            color="#69747a"
            metalness={0.65}
          />
        ))}
        {(["in", "out"] as const).map((side) =>
          houseTerminalLocals(side).map((p, phase) => (
            <CableSocket
              key={`${side}-${phase}`}
              position={p}
              color={phase === 3 ? "#2563eb" : "#b45309"}
              size={0.025}
            />
          )),
        )}
      </group>
    </Part>
  );
}
