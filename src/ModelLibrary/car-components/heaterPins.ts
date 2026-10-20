import type { PinDef } from "./EVComponents";

export type HeaterPin = PinDef & { rotation: [number, number, number]; kind: "hv" | "ground" | "control" };

/** Generic liquid-heater connector layout. IDs stay stable; local coordinates are contact faces. */
export const HEATER_PINS: HeaterPin[] = [
  { id: "dcp", label: "DC+", role: "dc+", local: [-0.065, 0.753, -0.089], rotation: [-Math.PI / 2, 0, 0], kind: "hv" },
  { id: "dcn", label: "DC−", role: "dc-", local: [-0.025, 0.753, -0.089], rotation: [-Math.PI / 2, 0, 0], kind: "hv" },
  { id: "gnd", label: "Ground", role: "PE", local: [0.09, 0.815, 0.016], rotation: [0, 0, 0], kind: "ground" },
  { id: "ctl", label: "12 V control / CAN", role: "sig", local: [0.068, 0.753, -0.082], rotation: [-Math.PI / 2, 0, 0], kind: "control" },
];