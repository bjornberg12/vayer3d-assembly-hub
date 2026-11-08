# What a real grid designer would miss

Below is what the app does not have yet, grouped by how much it matters. You can approve all of it as a roadmap, or tell me which items to build first.

## 1. Calculations designers rely on (most important)
- **Load flow with real loads**: today devices act as fixed resistors. Designers need constant-power loads (P, Q, power factor), so voltage sag changes current, and the solver repeats until results settle.
- **Reactance, not just resistance**: cables, lines and transformers need R + jX (and line capacitance), so the app can show voltage drop, reactive power and losses correctly.
- **Short-circuit calculation (IEC 60909)**: 3-phase, phase-to-phase and earth faults at any point, showing Ik", ip and Ik1. This sets breaker ratings and protection settings.
- **Network source**: an "external grid" source with short-circuit power (MVA) and X/R ratio, instead of only an ideal generator.
- **Earthing systems**: TN-C, TN-S, TN-C-S, TT and IT, plus earth-fault loop impedance (Zs) and automatic-disconnection checks (IEC 60364-4-41).
- **Temperature effects**: conductor resistance at operating temperature (70/90 °C), and ambient temperature from the weather settings.

## 2. Cable and line sizing
- **Current-carrying capacity (IEC 60364-5-52)**: laying method, soil thermal resistivity, depth, grouping and ambient correction factors, with overload warnings.
- **Voltage-drop limits**: % drop per feeder against a chosen limit (for example 3 % lighting, 5 % other), with a warning.
- **Real catalogue data**: R, X, C, Ampacity and thermal short-circuit withstand (I²t) per type, including overhead conductors (AMKA, AS/ACSR) with span, sag and tension.
- **Losses and cost**: kW losses per element and annual energy loss.

## 3. Protection
- **Time-current curves**: B/C/D MCB curves, fuses (gG), MCCB/relay settings (IDMT IEC curves, definite time, earth fault).
- **Selectivity check**: plot upstream and downstream curves together and flag overlaps.
- **RCDs** (type A/B, 30 mA) and fuses as placeable devices.
- **Breaking-capacity check**: Icu/Ics against the calculated fault current.

## 4. Missing equipment
- MV/LV fuses, load-break switches, reclosers and sectionalisers on poles.
- Generic loads: houses, apartment blocks, industry, street lighting, with demand and simultaneity factors.
- Distributed generation: PV inverters, wind, battery storage, and reverse power flow.
- Capacitor banks and reactive compensation.
- Meters and measurement points (CT/VT were removed at your request; simple meters could replace them).
- Busbar/cable-joint and cable cabinet objects.

## 5. Time and scenarios
- **Load profiles over 24 hours / a year** (time slider) and peak versus minimum cases.
- **Switching scenarios**: save named states (normal, N-1 outage) and compare results.
- **Fault simulation**: click a point, apply a fault, watch protection trip in order.
- **Harmonics and unbalance** (later, advanced).

## 6. Designer tools and output
- **Single-line diagram view** generated from the 3D scene.
- **Results table/report**: every bus voltage, branch current, loading %, losses and fault levels, exportable as CSV/PDF.
- **Map-based placement**: real coordinates (for example Estonian L-EST97) and importing a background map offline.
- **Bill of materials**: cable lengths per type, devices and poles.
- **Design-rule checker**: one list of all violations (overload, voltage drop, Zs, selectivity, breaking capacity).
- Undo/redo, copy/paste and multi-select for large networks.

## Suggested order
1. Reactance + external grid source + constant-power loads (makes all numbers realistic).
2. Short-circuit calculation + protection curves + breaking-capacity check.
3. Cable ampacity and voltage-drop limits with the design-rule checker.
4. Generic loads, PV/storage and fuses.
5. Results report, single-line diagram and bill of materials.
6. Time profiles and scenarios.

## Technical details
- Extend `solver.ts` branches from real `r` to complex impedance, and add a Newton-Raphson or fixed-point iteration for PQ loads; keep DC/AC superposition.
- Add a separate `shortCircuit.ts` using the IEC 60909 equivalent voltage source method (c-factor) with sequence impedances for earth faults.
- Extend `cables/catalog.ts` entries with x, c, ampacity and k (I²t) values; correction factor tables in a new module.
- New protection curve module shared by LV panel, switchgear and GIS trip logic.
- Every new persistent state goes through `sceneSave.ts`; each rule gets a unit test with values from the standards.
