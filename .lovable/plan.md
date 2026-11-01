# Faster simulation and trimming unused properties

## Findings
1. **The whole circuit is recalculated on every screen update.** Moving the mouse over a pin, opening a menu, dragging an object or typing in a field all redo the full electrical calculation (plus every cable/line length and path) even when nothing electrical changed. This is the biggest waste, and it grows with every model added.
2. **Many properties are shown but never used in any calculation:**
   - Basic properties: Mass, Material, Manufacturer, Height, Width, Depth (pure information; sizes are fixed by the 3D model, not these numbers).
   - Rated current / Max current on car parts (the simulation uses voltage and power only).
   - Frequency and Phases on car parts (the simulation uses the source's settings).
   - EV charger: IP rating, RCD type, efficiency, connector type, tethered, cable length, outlet count, min/max output voltage, load limit, input supply text, breaker, input/output current. The charger is currently not a load in the circuit at all, so none of these affect results.
   - DC source "capacity" only gives a runtime estimate, not current or voltage (worth keeping).

## Changes
1. **Recalculate only when something electrical changes:** objects, wires, cables, lines, their settings, or breaker positions. Hovering, menus, camera moves and selection no longer trigger it. Dragging recalculates once when you let go (lengths update when you drop).
2. **Cache cable/line lengths and paths** so they are computed once per change, not on every frame.
3. **Hide the unused properties by default** (switched off, not deleted): Mass, Material, Manufacturer, Height/Width/Depth, and Rated/Max current, Frequency, Phases on car parts. They stay available to turn on for documentation, and old save files still open.
4. **EV charger:** keep power, voltage, phases and current; remove IP rating, RCD type, tethered, cable length, connector and input-supply text from the panel.
5. Show a small "info only, not used in calculation" hint next to any remaining informational field.

## Technical details
- Wrap the solver input building + `solveCircuits` in `Scene3DViewer` in `useMemo` keyed on `addedItems, evWires, cables, connections, objectProps` (electrical keys only); memoize `cableLengthOf`/`linePaths`/auto-routes by record.
- During drag, use the last committed positions for the solver; commit on pointer-up.
- Adjust default `active` lists in `EV_DEFS`, model registry and `chargerDefaults`; save format unchanged (values remain readable).
- Verify: existing tests pass; Playwright check that a powered part still shows "on" and that hovering no longer re-solves (count solver calls in dev).
