import type { PinDef } from "./EVComponents";

export type ChargePortPin = PinDef & { rotation: [number, number, number]; kind: "ac" | "dc" | "signal" };

/**
 * CCS2 inlet contact layout. IDs and roles stay stable so existing wires follow;
 * local coordinates are the contact faces of the socket wells on the inlet face
 * (upper Type 2 section: five AC power wells + CP/PP signal wells; lower DC
 * section: two DC tubes). All contacts face +Z out of the socket.
 */
export const CHARGEPORT_PINS: ChargePortPin[] = [
  { id: "l1", label: "L1", role: "L1", local: [-0.026, 0.812, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "ac" },
  { id: "l2", label: "L2", role: "L2", local: [-0.013, 0.834, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "ac" },
  { id: "l3", label: "L3", role: "L3", local: [0.013, 0.834, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "ac" },
  { id: "n", label: "N", role: "N", local: [0.026, 0.812, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "ac" },
  { id: "pe", label: "PE", role: "PE", local: [0, 0.808, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "ac" },
  { id: "dcp", label: "DC+", role: "dc+", local: [-0.026, 0.762, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "dc" },
  { id: "dcn", label: "DC−", role: "dc-", local: [0.026, 0.762, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "dc" },
  { id: "cp", label: "CP (control pilot)", role: "sig", local: [-0.02, 0.845, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "signal" },
  { id: "pp", label: "PP (proximity)", role: "sig", local: [0.02, 0.845, 0.064], rotation: [Math.PI / 2, 0, 0], kind: "signal" },
];
