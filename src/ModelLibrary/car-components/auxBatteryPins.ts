import type { PinDef } from "./EVComponents";

/** SAE-style posts at opposite corners of the lid; IDs stay compatible with existing wires.
 * Coordinates are the exposed top faces, shared by rendering and routing. */
export const AUX_BATTERY_PINS: (PinDef & { postRadius: number })[] = [
  { id: "p", label: "12 V +", role: "12+", local: [-0.084, 0.735, -0.047], postRadius: 0.00975 },
  { id: "n", label: "12 V −", role: "12-", local: [0.084, 0.735, -0.047], postRadius: 0.00875 },
];