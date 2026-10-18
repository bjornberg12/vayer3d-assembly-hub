import type { PinDef } from "./EVComponents";

export type InverterPin = PinDef & { rotation: [number, number, number]; kind: "power" | "control" | "ground" };

/** Generic automotive layout, not a replica of a particular manufacturer's unit.
 * Coordinates are the exposed contact faces used by rendering AND routing.
 * IDs remain stable so existing circuits follow relocated connectors. */
export const INVERTER_PINS: InverterPin[] = [
  { id: "dcp", label: "DC+", role: "dc+", local: [-0.28, 0.648, 0.176], rotation: [Math.PI / 2, 0, 0], kind: "power" },
  { id: "dcn", label: "DC−", role: "dc-", local: [-0.22, 0.648, 0.176], rotation: [Math.PI / 2, 0, 0], kind: "power" },
  { id: "u", label: "U", role: "U", local: [-0.22, 0.648, -0.176], rotation: [-Math.PI / 2, 0, 0], kind: "power" },
  { id: "v", label: "V", role: "V", local: [-0.15, 0.648, -0.176], rotation: [-Math.PI / 2, 0, 0], kind: "power" },
  { id: "w", label: "W", role: "W", local: [-0.08, 0.648, -0.176], rotation: [-Math.PI / 2, 0, 0], kind: "power" },
  { id: "gnd", label: "Ground", role: "PE", local: [0.014, 0.728, 0.09], rotation: [0, 0, 0], kind: "ground" },
  { id: "ctl", label: "Resolver / control", role: "sig", local: [0.079, 0.644, 0.035], rotation: [0, 0, -Math.PI / 2], kind: "control" },
];