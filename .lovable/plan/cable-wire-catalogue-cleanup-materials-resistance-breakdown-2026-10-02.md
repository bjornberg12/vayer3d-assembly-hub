# Cable/wire catalogue cleanup, materials, resistance breakdown, object avoidance

## What changes
1. **3G/5G installation cables move to Wiring → Cables.** They show as a separate group "Installation cables (3G1.5, 3G2.5, 5G2.5, 5G6)" under the underground cables. Picking one there uses the same pin-to-pin routing as wires: Free hand or Auto route, nearest-pin preview. Wires you already drew with these types keep working.
2. **Wires are just "Wire".** The "DC" label goes away. The sizes are 0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70 and 95 mm². The labels read "Wire 1.5 mm²", and the section hint becomes "Single-core wires".
3. **Material.** Wires and installation cables are copper by default. In the menu and in each wire's Properties you can switch to aluminium. Resistance uses copper ρ = 0.0175 or aluminium ρ = 0.0282 Ω·mm²/m at 20 °C.
4. **Resistance shows how it was calculated**, for example:
   `R = ρ·L/A = 0.0175 Ω·mm²/m × 3.42 m / 2.5 mm² = 23.94 mΩ (copper, 20 °C)`
5. **Wires go around objects in both modes.**
   - Auto route: the route now accounts for every object in the scene: car parts, chargers, panels, substations and posts. Wires also rise and fall within clearance of the pins, so they don't pass through the part a pin belongs to.
   - Free hand: if a straight section between your corners would pass through an object, it bends around it orthogonally. Your corners stay the same.
   - If no route around an object exists, the section stays straight and you get a warning.

## Technical details
- `catalog.ts`:
  - Split `WIRE_TYPES` into `INSTALL_CABLE_TYPES` (3G/5G) and single-core `WIRE_TYPES` (ids `w-0.5`…`w-95`). Keep legacy `dc-*` ids resolvable through `wireTypeOf`.
  - Add `WIRE_MATERIALS` ({ copper: 0.0175, aluminium: 0.0282 }).
  - Change to `wireResistance(L, A, material)` plus a `resistanceFormula()` helper that returns the formula string.
- `EVWireRecord` gains `material?: "copper" | "aluminium"`, defaulting to copper.
- Obstacles: generalise the footprint list into `routingObstacles()`, built from EV_DEFS footprints and placed items' base width/depth. Use it both for auto-route and for the per-segment detour in free hand (the existing rectilinear pathfinder runs for each blocked segment). The vertical profile keeps the wire above the obstacle's top within clearance of the pins.
- The Cables section UI gets the installation-cable group, which sets `wireType` and starts wire routing. The Wires section gets the new size buttons and a Copper/Aluminium toggle.
- Verify in the browser: an installation cable from the Cables section, a free hand wire drawn straight through a part going around it, an aluminium switch changing the resistance and its formula, and no overlapping controls at a narrow width.
