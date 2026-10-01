/**
 * Basic properties shared by EVERY model in the library.
 * Each model chooses which are active by default; the rest can be switched on
 * in the Properties panel. Model-specific parameters live on the model card.
 */
export type BasePropType = "text" | "number" | "acdc";

export type BasePropDef = {
  id: BasePropId;
  label: string;
  type: BasePropType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
};

export type BasePropId =
  | "name"
  | "modelId"
  | "manufacturer"
  | "mass"
  | "material"
  | "height"
  | "width"
  | "depth"
  | "nominalVoltage"
  | "ratedCurrent"
  | "maxCurrent"
  | "ratedPower"
  | "frequency"
  | "phases";

export const BASE_PROPERTIES: BasePropDef[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "modelId", label: "Model ID", type: "text" },
  { id: "manufacturer", label: "Manufacturer", type: "text" },
  { id: "mass", label: "Mass", type: "number", unit: "kg", min: 0, step: 0.1 },
  { id: "material", label: "Material", type: "text" },
  { id: "height", label: "Height", type: "number", unit: "m", min: 0, step: 0.01 },
  { id: "width", label: "Width", type: "number", unit: "m", min: 0, step: 0.01 },
  { id: "depth", label: "Depth", type: "number", unit: "m", min: 0, step: 0.01 },
  { id: "nominalVoltage", label: "Nominal voltage", type: "number", unit: "V", min: 0, step: 1 },
  { id: "ratedCurrent", label: "Rated current", type: "number", unit: "A", min: 0, step: 1 },
  { id: "maxCurrent", label: "Max current", type: "number", unit: "A", min: 0, step: 1 },
  { id: "ratedPower", label: "Rated power", type: "number", unit: "kW", min: 0, step: 0.1 },
  { id: "frequency", label: "Frequency", type: "number", unit: "Hz", min: 0, step: 1 },
  { id: "phases", label: "Phases", type: "number", min: 1, max: 3, step: 1 },
];

/** Extra companion value stored with nominal voltage. */
export const VOLTAGE_KIND_KEY = "voltageKind"; // "AC" | "DC"

export type PropValues = Record<string, string | number>;

export type BaseDefaults = {
  /** Base properties switched on by default. */
  active: BasePropId[];
  /** Starting values (any base property, active or not). */
  values: Partial<Record<BasePropId | typeof VOLTAGE_KIND_KEY, string | number>>;
};

export type ObjectProps = { active: BasePropId[]; values: PropValues };

const BLANK: Record<BasePropId, string | number> = {
  name: "",
  modelId: "",
  manufacturer: "",
  mass: 0,
  material: "",
  height: 0,
  width: 0,
  depth: 0,
  nominalVoltage: 0,
  ratedCurrent: 0,
  maxCurrent: 0,
  ratedPower: 0,
  frequency: 50,
  phases: 3,
};

/** Builds a fresh property set: every base property is present, only some active. */
export function initObjectProps(d: BaseDefaults, fallbackName: string): ObjectProps {
  const active = Array.from(new Set<BasePropId>(["name", ...d.active]));
  return {
    active,
    values: { ...BLANK, [VOLTAGE_KIND_KEY]: "AC", name: fallbackName, ...d.values } as PropValues,
  };
}
