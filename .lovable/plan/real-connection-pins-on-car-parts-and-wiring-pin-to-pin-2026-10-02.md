# Real connection pins on car parts (and wiring pin to pin)

## What you will get
Every electric car part gets its real-world terminals as small, colour-coded pins on the 3D model. When wiring, you click a **pin** (not the whole part) and route the wire to another pin. Each wire knows exactly which pins it joins, which prepares the later step of calculating current, voltage and resistance across the circuit.

## Pins per part (based on typical real devices)
| Part | Pins |
|---|---|
| HV traction battery | HV DC+, HV DC−, chassis ground, BMS signal connector, interlock (HVIL) |
| HV junction box (PDU) | Battery DC+/DC−, inverter DC+/DC−, OBC DC+/DC−, DC-DC DC+/DC−, heater DC+/DC−, compressor DC+/DC−, charge port DC+/DC−, ground |
| Traction inverter | DC+, DC−, U, V, W, ground, resolver/control connector |
| Traction motor | U, V, W, ground, resolver/temp sensor |
| On-board charger | AC in: L1, L2, L3, N, PE; DC out: DC+, DC−; CAN/control |
| DC-DC converter | HV DC+, HV DC−, 12 V +, 12 V −, enable signal |
| Charge port (CCS2) | AC: L1, L2, L3, N, PE; DC+, DC−; CP (control pilot), PP (proximity) |
| 12 V battery | + , − |
| BMS | 12 V supply +/−, cell-sense connector, CAN |
| PTC heater, A/C compressor | DC+, DC−, ground, 12 V control/CAN |
| EV charger (outside the car) | AC out: L1, L2, L3, N, PE (AC types) or DC+, DC− (DC type); CP, PP; supply in: L1, L2, L3, N, PE |

Pin colours follow common practice: DC+ red, DC− black, L1 brown, L2 black, L3 grey, N blue, PE green-yellow, signal/aux purple.

## Wiring
- In Wiring → Wires, pins light up when you start wiring. Hovering a pin shows its name (e.g. "Inverter · DC+").
- Click pin, place corners as today, click another pin (or double-click to end loosely).
- A warning appears if you join clearly incompatible pins (e.g. DC+ to DC−, or AC phase to DC); it still lets you do it.
- The default car layout is rewired pin-to-pin (battery DC+ → PDU battery DC+, inverter U/V/W → motor U/V/W, etc.), so each old single wire becomes the proper set of wires.
- A part's Properties list its pins and what each is connected to.
- Wires connected to a whole part (old style) keep working.

## Ready for the circuit calculations later
Each wire stores its length and cross-section, and gets a **Resistance** value shown in its Properties (copper, R = ρ·L/A, at 20 °C). Pins carry a role (DC+, DC−, phase, N, PE, signal), which the future solver will use.

## Technical details
- `EVComponents.tsx`: add `pins: { id, label, role, local: [x,y,z] }[]` to each `EV_DEFS` entry; `pinWorld(part, pinId)` applies the part rotation; small `Pin` meshes rendered per part with role colours; models slightly refined so pins sit on visible connector housings.
- Wire end ids gain a pin form `"<ownerId>#<pinId>"` alongside object ids and `"pt:x,z"`; `wireEnd()` in `Scene3DViewer.tsx` resolves pins first. Pin meshes are clickable only in wire mode and call `handleEVWireClick("<id>#<pin>")`.
- Charger pins defined in `EVCharger.tsx` by charger kind.
- `defaultEVLayout()` rewritten with pin-to-pin wires.
- `wireResistance(lengthM, mm2)` helper in `cables/catalog.ts` (ρ = 0.0175 Ω·mm²/m).
- AGENTS.md: wire ends may reference a pin as `owner#pin`; pin definitions live with the model.
- Browser check: start wiring, click battery DC+ then PDU DC+, confirm the wire attaches to the pins and shows resistance.
