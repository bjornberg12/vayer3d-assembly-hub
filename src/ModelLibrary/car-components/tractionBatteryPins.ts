import type { PinDef } from "./EVComponents";

export type TractionBatteryPin = PinDef & { rotation: [number, number, number]; kind: "hv" | "ground" | "signal" };

/** Stable electrical endpoints on the forward pack bulkhead and chassis bonding boss. */
export const TRACTION_BATTERY_PINS: TractionBatteryPin[] = [
  { id: "dcp", label: "DC+", role: "dc+", local: [-0.18, 0.405, 1.093], rotation: [Math.PI / 2, 0, 0], kind: "hv" },
  { id: "dcn", label: "DC−", role: "dc-", local: [0.18, 0.405, 1.093], rotation: [Math.PI / 2, 0, 0], kind: "hv" },
  { id: "gnd", label: "Chassis ground", role: "PE", local: [-0.58, 0.479, 0.89], rotation: [0, 0, 0], kind: "ground" },
  { id: "bms", label: "BMS signal", role: "sig", local: [0.43, 0.405, 1.086], rotation: [Math.PI / 2, 0, 0], kind: "signal" },
  { id: "hvil", label: "HVIL interlock", role: "sig", local: [0.53, 0.405, 1.086], rotation: [Math.PI / 2, 0, 0], kind: "signal" },
];