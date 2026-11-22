/** Battery energy-storage cabinet with PCS and three-phase AC output. */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import { PinTerminal, type PinDef } from "../car-components/EVComponents";
import type { SolverSource } from "./solver";
import { EquipmentBox, StatusLed } from "../common/EquipmentDetails";

export const STORAGE_PARAMS = [
  {
    key: "storageCapacityKwh",
    label: "Usable capacity",
    unit: "kWh",
    min: 1,
    max: 100000,
    step: 5,
  },
  { key: "storageSoc", label: "State of charge", unit: "%", min: 0, max: 100, step: 1 },
  { key: "storageMaxKw", label: "PCS power limit", unit: "kW", min: 1, max: 50000, step: 5 },
  {
    key: "storageVoltage",
    label: "AC output voltage (L-L)",
    unit: "V",
    min: 100,
    max: 1000,
    step: 10,
  },
  {
    key: "storageInternalR",
    label: "PCS equivalent resistance",
    unit: "Ω",
    min: 0,
    max: 10,
    step: 0.005,
  },
] as const;

export function storageDefaults(): Record<string, string | number> {
  return {
    storageMode: "discharge",
    storageCapacityKwh: 100,
    storageSoc: 80,
    storageMaxKw: 50,
    storageVoltage: 400,
    storageInternalR: 0.02,
    modelId: "BESS-100KWH-50KW",
    manufacturer: "Generic IEC",
    mass: 1250,
    material: "LFP modules / painted steel",
    height: 2.1,
    width: 1.5,
    depth: 0.8,
    nominalVoltage: 400,
    voltageKind: "AC",
    ratedPower: 50,
    frequency: 50,
    phases: 3,
  };
}

export function storageEnergyKwh(v: Record<string, string | number | undefined>) {
  const capacity = Math.max(Number(v.storageCapacityKwh ?? 100), 0);
  const soc = Math.min(Math.max(Number(v.storageSoc ?? 80), 0), 100);
  return (capacity * soc) / 100;
}

export function storageSource(
  id: string,
  v: Record<string, string | number | undefined>,
): SolverSource | null {
  if (String(v.storageMode ?? "discharge") === "idle" || storageEnergyKwh(v) <= 0) return null;
  return {
    id,
    kind: "AC",
    voltage: Math.max(Number(v.storageVoltage ?? 400), 1),
    internalR: Math.max(Number(v.storageInternalR ?? 0.02), 0),
  };
}

export function storagePins(): PinDef[] {
  const roles = ["L1", "L2", "L3", "N", "PE"] as const;
  return roles.map((role, k) => ({
    id: k < 3 ? `l${k + 1}` : role.toLowerCase(),
    label: `PCS ${role}`,
    role,
    local: [-0.35 + k * 0.17, 0.25, 0.44],
  }));
}

export function storageTerminalLocals(): [number, number, number][] {
  return storagePins()
    .slice(0, 3)
    .map((p) => p.local);
}

export function BatteryStorageModel({
  energyKwh,
  discharging,
}: {
  energyKwh: number;
  discharging: boolean;
}) {
  return (
    <Part name={`Battery storage + PCS · ${energyKwh.toFixed(1)} kWh available`}>
      <group>
        <EquipmentBox
          position={[0, 0.08, 0]}
          size={[1.55, 0.16, 0.85]}
          color="#555e63"
          metalness={0.55}
        />
        <EquipmentBox
          position={[-0.35, 1.1, 0]}
          size={[0.75, 1.9, 0.72]}
          color="#c7cdcb"
          metalness={0.45}
        />
        <EquipmentBox
          position={[0.48, 1.1, 0]}
          size={[0.72, 1.9, 0.72]}
          color="#d5d9d7"
          metalness={0.45}
        />
        {Array.from({ length: 8 }, (_, k) => (
          <group key={k}>
            <EquipmentBox
              position={[-0.35, 0.35 + k * 0.19, 0.37]}
              size={[0.62, 0.14, 0.035]}
              color="#3f4b52"
              metalness={0.35}
            />
            <StatusLed
              position={[-0.1, 0.35 + k * 0.19, 0.395]}
              on={energyKwh > 0}
              color="#38bdf8"
              size={0.009}
            />
          </group>
        ))}
        <EquipmentBox
          position={[0.48, 1.45, 0.375]}
          size={[0.52, 0.46, 0.025]}
          color="#27343b"
          metalness={0.3}
        />
        <Text position={[0.48, 1.52, 0.392]} fontSize={0.06} color="#a7f3d0" anchorX="center">
          {energyKwh.toFixed(0)} kWh
        </Text>
        <Text position={[0.48, 1.37, 0.392]} fontSize={0.04} color="#d1d5db" anchorX="center">
          {discharging ? "DISCHARGING" : "IDLE"}
        </Text>
        {Array.from({ length: 8 }, (_, k) => (
          <EquipmentBox
            key={k}
            position={[0.48, 0.35 + k * 0.07, 0.375]}
            size={[0.5, 0.018, 0.025]}
            color="#69747a"
            metalness={0.65}
          />
        ))}
        <StatusLed position={[0.69, 1.82, 0.39]} on={discharging} color="#22c55e" size={0.025} />
        <mesh position={[0.25, 1.82, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.035, 18]} />
          <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.25} />
        </mesh>
        {storagePins().map((p) => (
          <PinTerminal key={p.id} role={p.role} position={p.local} size={0.023} />
        ))}
      </group>
    </Part>
  );
}
