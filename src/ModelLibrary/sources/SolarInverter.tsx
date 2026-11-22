/** Photovoltaic array and three-phase inverter with editable yield parameters. */
import { Text } from "@react-three/drei";
import { Part } from "@/components/PartLabel";
import { PinTerminal, type PinDef } from "../car-components/EVComponents";
import type { SolverSource } from "./solver";
import { EquipmentBox, StatusLed } from "../common/EquipmentDetails";

export const SOLAR_PARAMS = [
  { key: "pvDcKw", label: "PV array nameplate", unit: "kWp", min: 0.1, max: 10000, step: 1 },
  { key: "pvIrradiance", label: "Irradiance", unit: "W/m²", min: 0, max: 1400, step: 25 },
  { key: "pvCellTemp", label: "Cell temperature", unit: "°C", min: -40, max: 90, step: 1 },
  {
    key: "pvTempCoeff",
    label: "Power temperature coefficient",
    unit: "%/°C",
    min: -1,
    max: 0,
    step: 0.01,
  },
  { key: "pvEfficiency", label: "Inverter efficiency", unit: "%", min: 80, max: 99.5, step: 0.1 },
  { key: "pvVoltage", label: "AC output voltage (L-L)", unit: "V", min: 100, max: 1000, step: 10 },
] as const;

export function solarDefaults(): Record<string, string | number> {
  return {
    pvDcKw: 30,
    pvIrradiance: 1000,
    pvCellTemp: 25,
    pvTempCoeff: -0.35,
    pvEfficiency: 97,
    pvVoltage: 400,
    modelId: "PV-30K-400",
    manufacturer: "Generic IEC",
    mass: 510,
    material: "Glass / aluminium / silicon",
    height: 2.4,
    width: 4.2,
    depth: 2.6,
    nominalVoltage: 400,
    voltageKind: "AC",
    ratedPower: 30,
    frequency: 50,
    phases: 3,
  };
}

/** Available AC power after irradiance, cell-temperature and inverter losses. */
export function solarAvailableKw(v: Record<string, string | number | undefined>) {
  const nameplate = Math.max(Number(v.pvDcKw ?? 30), 0);
  const irradiance = Math.max(Number(v.pvIrradiance ?? 1000), 0) / 1000;
  const temp = Number(v.pvCellTemp ?? 25);
  const coeff = Number(v.pvTempCoeff ?? -0.35) / 100;
  const temperatureFactor = Math.max(0, 1 + coeff * (temp - 25));
  const efficiency = Math.min(Math.max(Number(v.pvEfficiency ?? 97) / 100, 0), 1);
  return nameplate * irradiance * temperatureFactor * efficiency;
}

export function solarSource(
  id: string,
  v: Record<string, string | number | undefined>,
): SolverSource | null {
  if (solarAvailableKw(v) <= 0) return null;
  return { id, kind: "AC", voltage: Math.max(Number(v.pvVoltage ?? 400), 1), internalR: 0.02 };
}

export function solarPins(): PinDef[] {
  const roles = ["L1", "L2", "L3", "N", "PE"] as const;
  return roles.map((role, k) => ({
    id: k < 3 ? `l${k + 1}` : role.toLowerCase(),
    label: `Inverter ${role}`,
    role,
    local: [1.35 + (k - 2) * 0.07, 0.64, 0.32],
  }));
}

export function solarTerminalLocals(): [number, number, number][] {
  return solarPins()
    .slice(0, 3)
    .map((p) => p.local);
}

export function SolarInverterModel({
  availableKw,
  energised,
}: {
  availableKw: number;
  energised: boolean;
}) {
  return (
    <Part name={`Solar array + inverter · ${availableKw.toFixed(1)} kW available`}>
      <group>
        {[-1.25, 0.1].map((x) => (
          <group key={x} position={[x, 1.55, -0.35]} rotation={[-0.42, 0, 0]}>
            <EquipmentBox
              position={[0, 0, 0]}
              size={[1.25, 0.055, 1.75]}
              color="#28343e"
              metalness={0.65}
              roughness={0.35}
            />
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: 4 }, (_, col) => (
                <EquipmentBox
                  key={`${row}-${col}`}
                  position={[-0.45 + col * 0.3, 0.032, -0.69 + row * 0.275]}
                  size={[0.275, 0.008, 0.25]}
                  color="#173c63"
                  metalness={0.45}
                  roughness={0.25}
                />
              )),
            )}
          </group>
        ))}
        {[-1.65, -0.55, 0.55].map((x) => (
          <group key={x}>
            <EquipmentBox
              position={[x, 0.72, -0.4]}
              size={[0.055, 1.4, 0.055]}
              color="#8c969c"
              metalness={0.8}
            />
            <EquipmentBox position={[x, 0.08, -0.4]} size={[0.32, 0.16, 0.32]} color="#8d9290" />
          </group>
        ))}
        <EquipmentBox
          position={[1.35, 0.85, 0]}
          size={[0.62, 1.15, 0.5]}
          color="#d6d9d7"
          metalness={0.45}
        />
        <EquipmentBox
          position={[1.35, 0.94, 0.258]}
          size={[0.48, 0.55, 0.025]}
          color="#374151"
          metalness={0.35}
        />
        {Array.from({ length: 9 }, (_, k) => (
          <EquipmentBox
            key={k}
            position={[1.68, 0.55 + k * 0.07, 0]}
            size={[0.08, 0.018, 0.44]}
            color="#707a80"
            metalness={0.75}
          />
        ))}
        <Text position={[1.35, 1.25, 0.275]} fontSize={0.07} color="#1f2937" anchorX="center">
          PV INVERTER
        </Text>
        <Text position={[1.35, 1.02, 0.277]} fontSize={0.055} color="#a7f3d0" anchorX="center">
          {availableKw.toFixed(1)} kW
        </Text>
        <StatusLed position={[1.51, 0.83, 0.28]} on={energised} size={0.022} />
        {solarPins().map((p) => (
          <PinTerminal key={p.id} role={p.role} position={p.local} size={0.018} />
        ))}
      </group>
    </Part>
  );
}
