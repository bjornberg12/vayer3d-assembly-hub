/**
 * Wiring catalogues — aerial line types and small wire types.
 * Underground cable sizes live in UndergroundCable.tsx (CABLE_SIZES).
 */

export type LineType = {
  id: string;
  label: string;
  group: "LV aerial bundled (AMKA)" | "20 kV bare conductor";
  crossSection: number; // phase conductor mm²
  voltage: number; // V
  color: string;
  lineWidth: number; // screen px
};

export const LINE_TYPES: LineType[] = [
  { id: "amka-25", label: "AMKA 3×25+54.6", group: "LV aerial bundled (AMKA)", crossSection: 25, voltage: 400, color: "#1a1a1a", lineWidth: 2 },
  { id: "amka-50", label: "AMKA 3×50+54.6", group: "LV aerial bundled (AMKA)", crossSection: 50, voltage: 400, color: "#1a1a1a", lineWidth: 2.4 },
  { id: "amka-70", label: "AMKA 3×70+95", group: "LV aerial bundled (AMKA)", crossSection: 70, voltage: 400, color: "#1a1a1a", lineWidth: 2.8 },
  { id: "amka-120", label: "AMKA 3×120+95", group: "LV aerial bundled (AMKA)", crossSection: 120, voltage: 400, color: "#111111", lineWidth: 3.4 },
  { id: "ac-35", label: "AC-35", group: "20 kV bare conductor", crossSection: 35, voltage: 20000, color: "#9ca3af", lineWidth: 1.6 },
  { id: "ac-50", label: "AC-50", group: "20 kV bare conductor", crossSection: 50, voltage: 20000, color: "#9ca3af", lineWidth: 1.9 },
  { id: "ac-70", label: "AC-70", group: "20 kV bare conductor", crossSection: 70, voltage: 20000, color: "#a1a1aa", lineWidth: 2.2 },
];
export const DEFAULT_LINE_TYPE = "amka-70";
export const lineTypeOf = (id?: string) => LINE_TYPES.find((t) => t.id === id) ?? LINE_TYPES.find((t) => t.id === DEFAULT_LINE_TYPE)!;

export type WireType = {
  id: string;
  label: string;
  group: "Installation cable" | "Wire";
  crossSection: number; // mm² per core
  cores: number;
  color: string;
  colorName: string;
};

/** Multi-core installation cables (shown in Wiring → Cables, routed pin-to-pin). */
export const INSTALL_CABLE_TYPES: WireType[] = [
  { id: "3g1.5", label: "3G1.5", group: "Installation cable", crossSection: 1.5, cores: 3, color: "#e5e7eb", colorName: "White" },
  { id: "3g2.5", label: "3G2.5", group: "Installation cable", crossSection: 2.5, cores: 3, color: "#e5e7eb", colorName: "White" },
  { id: "5g2.5", label: "5G2.5", group: "Installation cable", crossSection: 2.5, cores: 5, color: "#d1d5db", colorName: "Grey" },
  { id: "5g6", label: "5G6", group: "Installation cable", crossSection: 6, cores: 5, color: "#9ca3af", colorName: "Grey" },
];

/** Single-core wires, usable for AC or DC. */
export const WIRE_TYPES: WireType[] = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95].map((s) => ({
  id: `w-${s}`, label: `Wire ${s} mm²`, group: "Wire" as const, crossSection: s, cores: 1,
  color: s >= 35 ? "#f07a1a" : "#b91c1c", colorName: s >= 35 ? "Orange" : "Red",
}));
export const DEFAULT_WIRE_TYPE = "w-2.5";
export const ALL_WIRE_TYPES = [...INSTALL_CABLE_TYPES, ...WIRE_TYPES];
export const wireTypeOf = (id?: string) => {
  if (id?.startsWith("dc-")) id = `w-${id.slice(3)}`; // legacy DC ids
  return ALL_WIRE_TYPES.find((t) => t.id === id);
};

export type WireMaterial = "copper" | "aluminium";
/** Resistivity at 20 °C in Ω·mm²/m. */
export const WIRE_MATERIALS: Record<WireMaterial, { label: string; rho: number }> = {
  copper: { label: "Copper", rho: 0.0175 },
  aluminium: { label: "Aluminium", rho: 0.0282 },
};

/** Conductor resistance at 20 °C (Ω) for one core. */
export const wireResistance = (lengthM: number, mm2: number, material: WireMaterial = "copper") =>
  (WIRE_MATERIALS[material].rho * lengthM) / Math.max(mm2, 0.01);

export const resistanceFormula = (lengthM: number, mm2: number, material: WireMaterial = "copper") => {
  const rho = WIRE_MATERIALS[material].rho;
  const r = wireResistance(lengthM, mm2, material) * 1000;
  return `R = ρ·L/A = ${rho} Ω·mm²/m × ${lengthM.toFixed(2)} m / ${mm2} mm² = ${r.toFixed(2)} mΩ`;
};
