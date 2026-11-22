# Vayer3D: from concept to buildable grid design — master roadmap

## Honest assessment of where we are

What already works well:
- 3D scene with poles (0.4 kV, 20 kV), kiosk substation + GIS, MV switchgear, LV panel with DIN devices, transformer (Dyn11/YNyn0, taps, uk%), generator/DC source, EV charger, detailed EV parts.
- One wiring model (cables, aerial lines, small wires) with routing, catalogue of LV/MV cable types, Cu/Al resistance.
- Complex MNA solver (DC + AC phasors), breaker/relay trips from simulated currents, electron-flow visuals.
- IEC 60909 short-circuit helpers (radial), grounding study, versioned scene save files.

What stops it being a real design tool today:
1. The solver is a "circuit" solver, not a power-flow solver: loads are fixed resistors, no PQ loads, no load profiles, no generators with voltage control, no unbalance study.
2. Cables carry resistance only in most paths — reactance, ampacity, installation derating, thermal short-circuit withstand are missing or partial.
3. Protection is simple I>/I>> trips; no time–current curves, no selectivity/coordination, no earth-fault, no fuses with real gG curves, no auto-reclose.
4. Short-circuit is radial only and not wired into the scene as a study.
5. No real geography: distances, terrain, span sag, clearances, road crossings are not checked.
6. No design rule checks ("this cable is overloaded", "voltage drop 7 % > 5 %", "breaker cannot break the fault").
7. No outputs a builder can use: single-line diagram, bill of materials, cable schedule, protection settings sheet, report.

## Target: a design is "buildable" when it passes

```text
Load flow OK  ->  voltage limits (EN 50160 ±10 %), cable/line/transformer loading <= 100 %
Short circuit ->  Ik3 max / Ik1 min at every node, device breaking capacity >= Ik max
Protection    ->  every fault cleared in time (disconnection times IEC 60364-4-41), selective
Thermal       ->  cable I²t withstand >= fault energy
Earthing      ->  touch/step voltage, earth resistance targets
Mechanical    ->  line spans, sag, clearances to ground/roads
Documentation ->  SLD, BOM, cable schedule, settings sheet exported
```

## Phased roadmap

### Phase 1 — Correct engineering data (foundation)
- Full conductor catalogue: R20, R at 70/90 °C, X (Ω/km), C, ampacity per installation method (in ground, in air, in duct), max short-circuit temperature, weight, outer diameter, price field.
- Add missing standard types: AMKA/ABC, AXPK, AXMK, NAYY, N2XSY, AHXAMK-W more sizes, ACSR/AAAC bare lines, SAX/PAS covered MV lines.
- Transformer: rated losses (P0, Pk), no-load current, vector groups (Dyn5, Yzn11), standard ratings 50–2500 kVA.
- Derating factors: soil temperature, thermal resistivity, grouping, depth (IEC 60287 simplified / IEC 60364-5-52 tables).

### Phase 2 — Real power-flow engine
- Upgrade solver to Newton-Raphson (or backward/forward sweep for radial) load flow with PQ loads, PV generators, slack grid infeed.
- Load models: constant P/Q, cos φ, coincidence/simultaneity factor (Velander for households), EV charger as controllable load.
- Unbalanced 3-phase (per-phase) results, neutral current, losses per element.
- Time-series mode: 24 h load profiles, PV production, EV charging schedules.
- Keep electron-flow visuals driven by the new results.

### Phase 3 — Short circuit and protection (relay automation)
- Meshed IEC 60909: 3-phase, 2-phase, 1-phase-to-earth, Ik max/min, ip, Ith, at any clicked node.
- Device library with real curves: gG fuses, MCB B/C/D, MCCB/ACB with LSI, MV relays (IEC inverse curves: SI, VI, EI; definite time), earth-fault I0>, directional, recloser.
- Time–current curve (TCC) viewer for selectivity between upstream/downstream devices.
- Automation: auto-reclose sequences, transfer switch, interlocks, FLISR (fault locate/isolate/restore) on ring networks with remote-controlled switches.
- Fault simulation in 3D: click a point, place fault, watch which device trips and when.

### Phase 4 — Design rule checks (the "is it buildable" engine)
- Live checks panel with red/amber/green per element:
  voltage drop, loading, breaking capacity, disconnection time / loop impedance, cable thermal withstand, selectivity, earthing, transformer overload.
- Click a violation -> camera flies to it, suggestion shown ("use 3×1×150 instead of 95").
- Auto-sizing assistant: pick smallest cable meeting Iz, ΔU, Ik and I²t.

### Phase 5 — Geography and mechanical
- Real-scale map base (OpenStreetMap tiles / imported coordinates), terrain heights.
- Overhead line mechanics: span length, sag/tension at temperature and ice/wind, ground clearance check, pole strength class.
- Underground: trench depth, crossings, cable joints every max drum length.

### Phase 6 — New models
- Grid infeed (110/20 kV, Sk", X/R), MV/LV pole-mounted transformer, ring main unit, recloser, sectionaliser, load-break switch on pole, surge arresters, earthing rods/grids.
- Customer connection: house connection box, meter cabinet, street cabinet (distribution cabinet), PV inverter, battery storage, heat pump, apartment building loads.
- Street lighting circuit, capacitor bank, voltage regulator.

### Phase 7 — Deliverables
- Auto-generated single-line diagram (2D view synced with 3D).
- Bill of materials and cable schedule (CSV/XLSX).
- Protection settings sheet and calculation report (PDF) with all checks, assumptions and standard references.
- Clear disclaimer: design aid, engineer of record signs off.

### Phase 8 — Collaboration (optional, needs Cloud)
- User accounts, project storage, versions, comments, share read-only link with builders.

## Recommended execution order

```text
1 Data  ->  2 Load flow  ->  4 Rule checks (basic)  ->  3 Protection  ->  7 Reports  ->  6 Models  ->  5 Geography  ->  8 Cloud
```
Each phase ships in small steps with tests asserting concrete standard values (e.g. Ik for a known 630 kVA transformer, ampacity of 4×185 Al in ground).

## Feedback / risks
- Biggest gap is phase 2: without real load flow, everything else is approximate.
- Standards differ by country — pick a target (suggest IEC + Estonian/Elektrilevi practice) and keep catalogue values editable.
- 3D performance with large networks: need instancing and a 2D/SLD mode for big grids.
- Results must show formulas and assumptions so an engineer can verify them.

## Technical details
- New modules: `src/ModelLibrary/grid/loadflow.ts`, `grid/protection/curves.ts`, `grid/checks.ts`, `grid/reports/`, catalogue extensions in `cables/catalog.ts` and a new `devices/catalog.ts`.
- Extend `sceneSave.ts` for load profiles, device settings, study results config.
- Reuse existing `shortCircuit.ts`, `grounding.ts`, MNA solver as base; keep live trips separate from studies.
- First implementation step after approval: Phase 1 catalogue + Phase 2 radial load flow with PQ loads and a "Studies" panel.
