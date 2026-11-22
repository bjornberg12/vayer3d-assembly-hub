/**
 * Model Library — every 3D model in the app is registered here.
 * New models: add a file under a group folder, then add a card to MODEL_REGISTRY
 * (or EV_DEFS for car components). Basic properties are added automatically.
 */
import { ASSEMBLY_STEPS } from "./electrical-posts/WoodenPost1kV";
import { MAST_20KV_STEPS } from "./electrical-posts/WoodenMast20kV";
import { PANEL_STEPS } from "./distribution/DistributionPanel";
import { SUBSTATION_STEPS } from "./substations/KioskSubstation";
import { EV_DEFS, type EVType } from "./car-components/EVComponents";
import { chargerDefaults } from "./chargers/EVCharger";
import { sourceDefaults } from "./sources/VoltageSource";
import { transformerDefaults } from "./transformers/Transformer";
import { gridInfeedDefaults } from "./sources/GridInfeed";
import { solarDefaults } from "./sources/SolarInverter";
import { storageDefaults } from "./sources/BatteryStorage";
import { rmuDefaults } from "./substations/RingMainUnit";
import { recloserDefaults } from "./substations/Recloser";
import { houseDefaults } from "./distribution/HouseConnection";
import { initObjectProps, type BaseDefaults, type ObjectProps } from "./properties";

export * from "./properties";
export * from "./electrical-posts/WoodenPost1kV";
export * from "./electrical-posts/WoodenMast20kV";
export * from "./distribution/DistributionPanel";
export * from "./distribution/PanelFeeders";
export * from "./substations/KioskSubstation";
export * from "./cables/UndergroundCable";
export * from "./cables/catalog";
export * from "./car-components/EVComponents";
export * from "./chargers/EVCharger";

export type ModelGroup =
  | "electrical-posts"
  | "distribution"
  | "substations"
  | "chargers"
  | "sources"
  | "transformers"
  | "car-components";

export type ModelCard = {
  id: string;
  name: string;
  subtitle: string;
  group: ModelGroup;
  steps?: string[];
  base: BaseDefaults;
};

export const MODEL_REGISTRY: Record<
  | "puitmast"
  | "puitmast20"
  | "jaotuskilp"
  | "alajaam"
  | "evcharger"
  | "vsource"
  | "transformer"
  | "gis"
  | "lvpanel"
  | "gridinfeed"
  | "rmu"
  | "recloser"
  | "solar"
  | "storage"
  | "house",
  ModelCard
> = {
  puitmast: {
    id: "puitmast",
    name: "Puitmast - 1kV",
    subtitle: "Wooden pole",
    group: "electrical-posts",
    steps: ASSEMBLY_STEPS,
    base: {
      active: ["modelId"],
      values: {
        modelId: "PM-1KV-10",
        mass: 380,
        material: "Wood (pine, impregnated)",
        height: 10,
        width: 0.26,
        depth: 0.26,
        nominalVoltage: 400,
        voltageKind: "AC",
        frequency: 50,
        phases: 3,
      },
    },
  },
  puitmast20: {
    id: "puitmast20",
    name: "Puitmast - 20kV",
    subtitle: "20 kV mast",
    group: "electrical-posts",
    steps: MAST_20KV_STEPS,
    base: {
      active: ["modelId"],
      values: {
        modelId: "PM-20KV-11",
        mass: 450,
        material: "Wood (pine, impregnated)",
        height: 11,
        width: 0.28,
        depth: 0.28,
        nominalVoltage: 20000,
        voltageKind: "AC",
        frequency: 50,
        phases: 3,
      },
    },
  },
  jaotuskilp: {
    id: "jaotuskilp",
    name: "Jaotuskilp",
    subtitle: "Distribution panel",
    group: "distribution",
    steps: PANEL_STEPS,
    base: {
      active: ["modelId", "nominalVoltage"],
      values: {
        modelId: "JK-400",
        mass: 85,
        material: "Painted steel",
        height: 1.2,
        width: 0.8,
        depth: 0.35,
        nominalVoltage: 400,
        voltageKind: "AC",
        ratedCurrent: 250,
        maxCurrent: 400,
        frequency: 50,
        phases: 3,
      },
    },
  },
  alajaam: {
    id: "alajaam",
    name: "Alajaam 10kV/0,4kV",
    subtitle: "Substation",
    group: "substations",
    steps: SUBSTATION_STEPS,
    base: {
      active: ["modelId", "nominalVoltage", "ratedPower"],
      values: {
        modelId: "KAJ-10/0.4",
        mass: 9500,
        material: "Concrete / steel",
        height: 2.5,
        width: 3.5,
        depth: 2.2,
        nominalVoltage: 10000,
        voltageKind: "AC",
        ratedPower: 630,
        frequency: 50,
        phases: 3,
      },
    },
  },
  lvpanel: {
    id: "lvpanel",
    name: "LV panel 0.4 kV",
    subtitle: "Low-voltage distribution panel",
    group: "distribution",
    base: {
      active: ["modelId", "nominalVoltage", "ratedCurrent"],
      values: {
        modelId: "LVP-400-250",
        mass: 60,
        material: "Painted steel",
        height: 1.6,
        width: 0.8,
        depth: 0.25,
        nominalVoltage: 400,
        voltageKind: "AC",
        ratedCurrent: 250,
        frequency: 50,
        phases: 3,
      },
    },
  },
  gis: {
    id: "gis",
    name: "MV GIS + automation",
    subtitle: "Gas-insulated switchgear",
    group: "substations",
    base: {
      active: ["modelId", "nominalVoltage", "ratedCurrent"],
      values: {
        modelId: "GIS-24-630",
        mass: 1800,
        material: "Steel / SF6",
        height: 3.0,
        width: 2.4,
        depth: 1.0,
        nominalVoltage: 20000,
        voltageKind: "AC",
        ratedCurrent: 630,
        frequency: 50,
        phases: 3,
      },
    },
  },
  evcharger: {
    id: "evcharger",
    name: "EV charger",
    subtitle: "Electric car charger",
    group: "chargers",
    base: {
      active: ["modelId", "nominalVoltage", "ratedPower", "phases"],
      values: chargerDefaults("ac-wall") as BaseDefaults["values"],
    },
  },
  vsource: {
    id: "vsource",
    name: "Voltage source",
    subtitle: "AC 3-phase or DC supply",
    group: "sources",
    base: {
      active: ["modelId", "nominalVoltage", "frequency", "phases"],
      values: sourceDefaults("AC") as BaseDefaults["values"],
    },
  },
  transformer: {
    id: "transformer",
    name: "Transformer",
    subtitle: "3-phase power transformer",
    group: "transformers",
    base: {
      active: ["modelId", "ratedPower", "frequency"],
      values: transformerDefaults() as BaseDefaults["values"],
    },
  },
  gridinfeed: {
    id: "gridinfeed",
    name: "Utility grid infeed",
    subtitle: "MV supply with short-circuit impedance",
    group: "sources",
    base: {
      active: ["modelId", "nominalVoltage", "ratedCurrent", "frequency"],
      values: gridInfeedDefaults() as BaseDefaults["values"],
    },
  },
  rmu: {
    id: "rmu",
    name: "Ring main unit 24 kV",
    subtitle: "Two ring switches + protected feeder",
    group: "substations",
    base: {
      active: ["modelId", "nominalVoltage", "ratedCurrent"],
      values: rmuDefaults() as BaseDefaults["values"],
    },
  },
  recloser: {
    id: "recloser",
    name: "MV auto-recloser",
    subtitle: "Pole-mounted protection and reclosing",
    group: "substations",
    base: {
      active: ["modelId", "nominalVoltage", "ratedCurrent"],
      values: recloserDefaults() as BaseDefaults["values"],
    },
  },
  solar: {
    id: "solar",
    name: "Solar array + inverter",
    subtitle: "Three-phase PV source",
    group: "sources",
    base: {
      active: ["modelId", "nominalVoltage", "ratedPower", "frequency"],
      values: solarDefaults() as BaseDefaults["values"],
    },
  },
  storage: {
    id: "storage",
    name: "Battery storage + PCS",
    subtitle: "Three-phase energy storage",
    group: "sources",
    base: {
      active: ["modelId", "nominalVoltage", "ratedPower", "frequency"],
      values: storageDefaults() as BaseDefaults["values"],
    },
  },
  house: {
    id: "house",
    name: "House connection",
    subtitle: "Service cabinet, main breaker and load",
    group: "distribution",
    base: {
      active: ["modelId", "nominalVoltage", "ratedCurrent", "ratedPower"],
      values: houseDefaults() as BaseDefaults["values"],
    },
  },
};

/** Fresh basic-property set for any model id (scene model or car component). */
export function initPropsFor(modelId: string): ObjectProps {
  const card = (MODEL_REGISTRY as Record<string, ModelCard>)[modelId];
  if (card) return initObjectProps(card.base, card.name);
  const ev = (EV_DEFS as Record<string, (typeof EV_DEFS)[EVType]>)[modelId];
  if (ev) return initObjectProps(ev.base, ev.name);
  return initObjectProps({ active: [], values: {} }, "Object");
}
export * from "./sources/VoltageSource";
export * from "./sources/solver";
export * from "./sources/ElectronFlow";
export * from "./transformers/Transformer";
export * from "./substations/Switchgear";
export * from "./distribution/LVPanel";
export * from "./sources/GridInfeed";
export * from "./sources/SolarInverter";
export * from "./sources/BatteryStorage";
export * from "./substations/RingMainUnit";
export * from "./substations/Recloser";
export * from "./distribution/HouseConnection";
