import type { PinDef } from "./EVComponents";

export type ConverterPin = PinDef & { rotation: [number, number, number]; kind: "hv" | "lv" | "control" };

/** Generic automotive layout: sealed HV inlet, high-current LV studs, separate control socket.
 * Stable IDs preserve existing wires; coordinates are the exposed contact faces. */
export const CONVERTER_PINS: ConverterPin[] = [
  { id: "hvp", label: "HV DC+", role: "dc+", local: [-0.025, 0.446, 0.111], rotation: [Math.PI / 2, 0, 0], kind: "hv" },
  { id: "hvn", label: "HV DC−", role: "dc-", local: [0.025, 0.446, 0.111], rotation: [Math.PI / 2, 0, 0], kind: "hv" },
  { id: "lvp", label: "12 V +", role: "12+", local: [0.133, 0.448, -0.026], rotation: [0, 0, -Math.PI / 2], kind: "lv" },
  { id: "lvn", label: "12 V −", role: "12-", local: [0.133, 0.448, 0.026], rotation: [0, 0, -Math.PI / 2], kind: "lv" },
  { id: "en", label: "Enable", role: "sig", local: [-0.128, 0.449, 0.016], rotation: [0, 0, Math.PI / 2], kind: "control" },
];