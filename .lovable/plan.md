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

- **General**: name/tag, manufacturer, model number, year installed
- **Physical**: mass (kg), material, height, width, depth, colour
- **Electrical**: nominal voltage, rated current, rated power, frequency, phases, IP rating
- **Mechanical**: max load, wind load, foundation depth
- **Performance**: efficiency, capacity, torque, max speed
- **Environment**: operating temperature range, insulation class

Each model lists which properties are on by default and their starting values. Examples:
- Wooden post 1 kV: mass, material (wood), height on. Nominal voltage is available but off.
- Distribution panel: mass, material, dimensions, IP rating on.
- Traction battery: mass, nominal voltage, capacity, max power on.

## Properties panel
- Shows the categories as sections. Only active properties are displayed.
- An "Add property" picker per category switches on any inactive property. Each active property has a small remove button.
- Number properties use a slider or number field with units. Text properties (material, manufacturer) use a text field or dropdown.
- Values are stored per placed object. Fixed scene models get their own value set too.
- The existing Show assembly, Delete, Rotation and Wire buttons stay where they are.

## Behaviour kept the same
Scenes, assembly steps, the Add/Cables menus, wiring, feeders, Move and Reset all keep working as they do now. This is a reorganisation with a new properties system, not a redesign.

## Technical details
- `properties.ts`: `PROPERTY_CATALOG` (id, category, label, type number|text|select, unit, min/max/step, options) and `ModelPropertyDefaults = { active: string[]; values: Record<string, number|string> }`.
- `index.ts`: `MODEL_REGISTRY: Record<ModelId, ModelCard>`, where `ModelCard = { id, name, subtitle, group, Component, steps?, properties, lowVoltage?, terminalY? }`. The Add menu, `stepsForType`, SCENES names and EV_DEFS all read from the registry, which removes the hard-coded switch statements.
- The viewer keeps one state `objectProps: Record<ownerId | "scene:<id>", { active: string[]; values }>`. Placed objects start from their card defaults when added. Reset and delete clear the entry.
- EV parameters migrate into the shared catalog (voltage → electrical.nominalVoltage, capacity → performance.capacity, and so on).
- Old `src/components/*` model files are moved with `mv` and imports are updated. `DraggablePanel`, `PartLabel` and `Weather` stay in `components/`.
- Record the folder rule in `AGENTS.md`: every new 3D model goes in `src/ModelLibrary/<group>/` and must register a card with property defaults.
- Properties stay in the browser session for now. Saving them permanently would need Lovable Cloud and can come later.
