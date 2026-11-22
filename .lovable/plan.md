# Gap analysis and next features for buildable grid design

## Already in place
Conductor catalogue and derating, radial load flow, design rule checks, meshed short circuit (all fault types), four-group IEC relays with live trips and reclosing, line sag/clearance, cable schedule/BOM, new grid models (infeed, RMU, recloser, PV, storage, kiosk), scene saves.

## What is still missing (priority order)

### 1. Meshed load flow (high)
Current load flow is radial only. Add Newton-Raphson power flow for rings/meshed grids, with transformer tap changers, PV/storage as P/Q-controlled generators, reactive power limits and losses per branch.

### 2. Earthing and touch/step voltage (high)
Earth electrode design (rods, rings, mesh), soil resistivity, earth potential rise, touch and step voltage per IEC 50522 style screening, neutral earthing choice (solid, resistance, Petersen coil, isolated) feeding into earth fault currents.

### 3. Protection completion (high)
- Directional overcurrent and directional earth fault for rings and DG feeders
- Line differential and distance protection (zones) for MV lines
- Transformer differential and restricted earth fault
- Automatic coordination: suggest pickup/time multiplier settings from fault study
- Event recorder / fault record view after each live trip

### 4. Distributed generation studies (medium)
Hosting capacity, voltage rise from PV, reverse power flow, anti-islanding (frequency/ROCOF/vector shift), inverter Q(U) and P(f) curves.

### 5. Time-series and planning (medium)
24 h / yearly load and PV profiles, EV charging profiles, peak loading, energy losses per year, growth scenarios.

### 6. Power quality (medium)
Harmonics from inverters/chargers (THD), flicker, voltage unbalance from single-phase loads.

### 7. Cable thermal details (medium)
Laying conditions per IEC 60364-5-52 / 60287 (depth, grouping, soil thermal resistivity), short-circuit withstand per cable screen, cable joint/termination models.

### 8. Single-line diagram and reports (high, already on roadmap)
Auto-generated single-line diagram synced with the 3D scene, PDF report: load flow, faults, relay settings tables, TCC curves, BOM, check results with pass/fail.

### 9. Geography (medium, already on roadmap)
Map/terrain base layer, real distances, crossing/road clearances, line profile view.

### 10. New models (lower)
LV street cabinet, pole-mounted transformer, MV fuse/load-break switch, capacitor bank, voltage regulator, surge arrester on poles, current/voltage transformers as explicit relay inputs, earthing rods, cable joints.

### 11. Usability (lower)
Undo/redo, copy/paste groups, templates (typical 10/0.4 kV substation, LV feeder), project-level parameters (nominal voltages, standards set), validation warnings list with click-to-locate.

### 12. Collaboration (needs your decision)
Cloud saving, sharing and review comments — requires enabling Lovable Cloud.

## Proposed execution order
1. Meshed load flow + DG generator modelling
2. Neutral earthing + earthing/touch voltage study
3. Directional, distance and differential protection + auto-coordination + fault records
4. Single-line diagram and PDF report
5. Time-series profiles and hosting capacity
6. Cable laying conditions, power quality
7. Map/terrain, remaining models, usability items

## Technical details
- New pure modules in `src/ModelLibrary/grid/`: `powerflow.ts` (NR), `earthing.ts`, `directional.ts`, `distance.ts`, `differential.ts`, `coordination.ts`, `profiles.ts`, `harmonics.ts`, `cableThermal.ts`, each with vitest tests using concrete reference values.
- Relay additions extend `relay.ts` setting groups with IEC names only; live trips keep reading the active group.
- New persistent state (profiles, earthing grids, SLD layout) added to `src/lib/sceneSave.ts`.
- SLD as a 2D SVG view generated from the solver graph; PDF via client-side generation.
