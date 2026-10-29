import type { PinDef } from "./EVComponents";

export type BMSPin = PinDef & { rotation: [number, number, number]; kind: "power" | "sense" | "can" };

/** Stable logical endpoints on the sealed ECU's forward connector faces.
 * Sense and CAN represent harness connectors, not individual cell/CAN conductors.
 */
export const BMS_PINS: BMSPin[] = [
  { id: "vp", label: "12 V +", role: "12+", local: [-0.076, 0.472, 0.106], rotation: [Math.PI / 2, 0, 0], kind: "power" },
  { id: "vn", label: "12 V −", role: "12-", local: [-0.056, 0.472, 0.106], rotation: [Math.PI / 2, 0, 0], kind: "power" },
  { id: "sense", label: "Cell sense", role: "sig", local: [0.013, 0.472, 0.106], rotation: [Math.PI / 2, 0, 0], kind: "sense" },
  { id: "can", label: "CAN", role: "sig", local: [0.082, 0.472, 0.106], rotation: [Math.PI / 2, 0, 0], kind: "can" },
];