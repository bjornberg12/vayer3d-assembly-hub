# Model Library + unified properties

## Goal
1. All 3D models and their parameters live in one `ModelLibrary` folder, grouped by category, so new models are easy to add.
2. Every model (posts, panels, substation, car parts, and anything added later) shares the same set of property categories. Each model decides which properties are switched on by default; the rest can be switched on in the Properties panel.

## Folder layout

```text
src/ModelLibrary/
  index.ts                  one registry listing every model
  properties.ts             the shared property catalog + helpers
  electrical-posts/
    WoodenPost1kV.tsx       (was ElectricalPost)
    WoodenMast20kV.tsx
  distribution/
    DistributionPanel.tsx
    PanelFeeders.tsx
  substations/
    KioskSubstation.tsx     (was Substation)
  cables/
    UndergroundCable.tsx
  car-components/
    Battery.tsx, Motor.tsx, Inverter.tsx, OnboardCharger.tsx, DcDc.tsx,
    JunctionBox.tsx, ChargePort.tsx, Aux12V.tsx, Bms.tsx, Heater.tsx,
    Compressor.tsx, ChassisGhost.tsx, EVWire.tsx
```

Each model file exports its 3D model plus a small "card": name, subtitle, category, assembly steps (if any), and its property defaults.

## Shared property categories
The same categories for every model:

Every model, existing and future, automatically gets these basic properties:

- Name, Model ID, Manufacturer
- Mass (kg), Material, Height, Width, Depth (m)
- Nominal voltage (with an AC / DC choice), Rated current (A), Max current (A), Rated power (kW), Frequency (Hz), Phases

Models keep the properties they already have, for example the car parts' capacity, torque, efficiency, cell count and fuse. Those appear under a "Model-specific" section below the basic properties.

Each model chooses which basic properties are on by default. Examples:
- Wooden post 1 kV: Name, Model ID, Mass, Material (wood), Height are on. Nominal voltage is available but off.
- Distribution panel: Name, Model ID, Mass, Material, dimensions, Nominal voltage are on.
- Traction battery: Name, Mass, Nominal voltage (DC), Rated/Max current are on, plus its existing capacity and max discharge.

## Properties panel
- Two sections: Basic properties and Model-specific. Only properties that are switched on are shown.
- An "Add property" picker turns on any inactive basic property. Each basic property has a small button to switch it off again.
- Numbers use a slider or number field with units. Text properties (name, model ID, manufacturer, material) use a text field. AC/DC is a toggle.
- Values are stored per placed object. Fixed scene models get their own values too.
- The existing Show assembly, Delete, Rotation and Wire buttons stay where they are.

## Behaviour kept the same
Scenes, assembly steps, the Add/Cables menus, wiring, feeders, Move and Reset all keep working as they do now. This is a reorganisation with a new properties system, not a redesign.

## Technical details
- `properties.ts`: `BASE_PROPERTIES` holds the 13 basic properties (id, label, type number|text|acdc, unit, min/max/step). `ModelPropertyDefaults = { activeBase: string[]; values: Record<string, number|string> }`. A `registerModel()` helper always merges the basic properties into a card, so new models get them automatically.
- `index.ts`: `MODEL_REGISTRY: Record<ModelId, ModelCard>`, where `ModelCard = { id, name, subtitle, group, Component, steps?, baseDefaults, specificParams, lowVoltage?, terminalY? }`. The Add menu, `stepsForType`, SCENES names and EV_DEFS all read from the registry.
- The viewer keeps one state `objectProps: Record<ownerId | "scene:<id>", { activeBase: string[]; values }>`. Placed objects start from their card defaults. Reset and delete clear the entry.
- The car parts' existing parameters become `specificParams`. Their voltage moves to the basic Nominal voltage (DC) so it isn't duplicated.
- Old `src/components/*` model files are moved with `mv` and imports are updated. `DraggablePanel`, `PartLabel` and `Weather` stay in `components/`.
- Record the folder rule in `AGENTS.md`: every new 3D model goes in `src/ModelLibrary/<group>/` and must register a card with property defaults.
- Properties stay in the browser session for now. Saving them permanently would need Lovable Cloud and can come later.
