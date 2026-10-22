import type { PinDef } from "./EVComponents";

export type MotorPin = PinDef & { rotation: [number, number, number]; kind: "phase" | "ground" | "sensor" };

/**
 * Traction motor connector layout. IDs and contact faces stay stable: the three
 * phase lugs stand on the orange HV terminal pad, the ground stud sits on its
 * machined boss and the resolver plug on the small control box (all at y = 0.58).
 */
export const MOTOR_PINS: MotorPin[] = [
  { id: "u", label: "U", role: "U", local: [0.21, 0.58, 0], rotation: [0, 0, 0], kind: "phase" },
  { id: "v", label: "V", role: "V", local: [0.255, 0.58, 0], rotation: [0, 0, 0], kind: "phase" },
  { id: "w", label: "W", role: "W", local: [0.3, 0.58, 0], rotation: [0, 0, 0], kind: "phase" },
  { id: "gnd", label: "Ground", role: "PE", local: [0.345, 0.58, 0], rotation: [0, 0, 0], kind: "ground" },
  { id: "sens", label: "Resolver / temp", role: "sig", local: [0.39, 0.58, 0], rotation: [0, 0, 0], kind: "sensor" },
];
