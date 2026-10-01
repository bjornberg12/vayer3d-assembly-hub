# EV charger model

## What you will get
A new **EV charger** in the Add menu (works in every scene). Place it, move it, delete it, and open its Properties to change its settings. Underground cables can run to it from a substation or distribution panel, and wires can connect it to the car's charge port.

## Charger parameters (Model-specific section)
- Charger type: AC wallbox / AC pedestal / DC fast charger (changes the 3D look: wall box, post, or tall cabinet)
- Connector: Type 2, CCS2, CHAdeMO, Type 2 + CCS2 (combo)
- Number of outlets: 1 or 2
- Max output power (kW): AC 3.7–22, DC 50–350
- Output voltage range (V), max output current (A) per outlet
- Input supply: 230 V 1-phase / 400 V 3-phase, input current (A)
- Efficiency (%), power factor (cos φ)
- Cable: tethered or socket, cable length (m)
- Protection: RCD type (Type A / Type B / 6 mA DC detection), overcurrent breaker (A)
- Load management: on/off, current limit (A)
- Communication: OCPP 1.6 / 2.0.1, payment (RFID / app / card)
- IP rating, IK rating, operating temperature range

Basic properties are on by default: Name, Model ID, Mass, Height/Width/Depth, Nominal voltage (AC), Rated power, Phases. Values change automatically with the charger type (e.g. DC fast is 400 V 3-phase, 150 kW) but stay editable.

## Ready for the long-term plan
- The charger counts as a cable end, so an underground cable from a substation or distribution panel can feed it (and a panel feeder can be assigned to it).
- Clicking the charger shows "Supply: connected / not connected" and the input power it draws (output ÷ efficiency), with a warning if the feeding cable or breaker is too small.
- The car's charge port can be wired to the charger. Actual battery charging (state of charge over time) comes in a later step.

## Technical details
- New `src/ModelLibrary/chargers/EVCharger.tsx`: 3D model per charger type, `CHARGER_PARAMS` spec, `chargerDefaults(type)`; registered in `MODEL_REGISTRY` as `evcharger` (group `chargers`) with base defaults.
- `Scene3DViewer.tsx`: add `evcharger` to `AddableType` and the Add list, add it to `CABLE_ENDPOINT_TYPES`, store specific params in `objectProps` values, render the Model-specific editor (selects, numbers, toggles), compute supply status from cables ending at the charger.
- AGENTS.md: chargers live in `ModelLibrary/chargers` and are cable endpoints.
- Browser check: add a charger, change type and power, route a cable from a panel to it.
