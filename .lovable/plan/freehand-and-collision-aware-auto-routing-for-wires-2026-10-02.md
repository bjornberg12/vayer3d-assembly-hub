# Freehand and collision-aware auto-routing for wires

## What established BIM and electrical design tools do
The useful common patterns are:

- **Revit MEP** uses click-to-click routing, automatically inserts bends, and lets the user set bend radius before drawing.
- **AutoCAD Electrical** defaults to orthogonal wire runs and offers automatic connections between selected connection points.
- **EPLAN Pro Panel** separates the logical pin-to-pin connection from its calculated 3D route, then finds an efficient path through available routing space.
- **SolidWorks Electrical Routing** derives wire diameter and bend behavior from the selected wire type, and keeps routes associated with real connector points.

This app will combine those proven ideas without adding the heavier schematic or cable-duct systems yet: real pin endpoints, a clear routing-mode choice, a live preview, collision-aware calculation, wire-type-driven geometry, and editable results.

Sources:
- [Revit: Draw Cable Tray](https://help.autodesk.com/cloudhelp/2026/ENU/Revit-MEPEng/files/GUID-5A0D6294-C1A0-47EE-BD2E-6C7E198DDEBA.htm)
- [AutoCAD Electrical: Insert Wire](https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-Electrical/files/GUID-1D0BB2B5-FFD7-4F1F-AC00-0CCA4EC19389.htm)
- [EPLAN: Routing connections](https://www.eplan.help/en-us/Infoportal/Content/Plattform/2026/Content/htm/routinggui_h_verlegen.htm)
- [SolidWorks: Routing options](https://help.solidworks.com/2021/English/SolidWorks/sldpiping/HIDD_OPTIONS_ROUTING.htm)

## Remove the remaining large orange connectors
Remove every remaining decorative single orange block from the electric-car models:

- Traction motor
- HV junction box (PDU)
- 12 V auxiliary battery

The small colour-coded real pins remain. Orange HV wire insulation also remains because it represents the cable itself, not a generic connector.

## Two routing modes for Wires
Add a compact two-option selector inside **Wiring → Wires**:

- **Free hand** — preserves the current workflow: select the first pin, place route corners manually, then select the destination pin.
- **Auto route** — select the first and destination pins; the app calculates the route immediately.

The choice applies only to **Wires**. Underground Cables and aerial Lines remain unchanged.

## Auto-route behavior
- Show the existing dashed nearest-pin preview while choosing the destination.
- On destination selection, create a shortest practical orthogonal route in the ground-plane view using only X and Z segments.
- Add short straight leads away from both pins before turning, avoiding sharp bends directly at a connector.
- Treat every electric-car component footprint as an obstacle, expanded by a small clearance based on the chosen wire thickness.
- Find a collision-free Manhattan-style path around those obstacles, remove redundant points, and prefer fewer turns when routes have similar length.
- Render each nominal 90° corner with a small rounded bend rather than a mathematically sharp kink. The stored path remains orthogonal, so resistance and length calculations use the actual routed geometry.
- If no clear route exists, keep both selected pins, show a clear warning, and let the user switch to Free hand rather than drawing through a component.

## Editing and saved wire behavior
- Store the routing mode with each new wire so its geometry is stable and identifiable later.
- Auto-routed corners remain visible in the existing route editor and can be moved, inserted, or removed like freehand corners.
- Manually changing an auto-routed corner changes that wire to **Free hand**, preventing later automatic recalculation from overwriting the edit.
- Existing wires without routing-mode data continue to behave as Free hand wires.
- Wire Properties show **Routing: Free hand** or **Routing: Auto route**, plus the existing endpoints, length, resistance, type, and compatibility warning.

## Technical details
- Add a wire-only routing-mode state and segmented control beside the wire-type controls.
- Add `routingMode?: "freehand" | "auto"` to the wire record; default missing values to `freehand`.
- Define model footprint bounds with the car-component definitions so routing uses model-owned dimensions rather than UI-specific guesses.
- Implement the orthogonal pathfinder as a rectilinear visibility graph around clearance-expanded component bounds, using path length plus a small turn penalty to select a clean route.
- Add a rounded-orthogonal wire curve helper shared by preview, final rendering, route length, and resistance calculations.
- Keep pin-only start/end validation and nearest-pin snapping unchanged in both modes.

## Verification
- Confirm no large single orange block remains on any electric-car part.
- Create a Free hand wire with manually placed corners and confirm its current behavior is preserved.
- Create an Auto route wire between pins with another component in the direct path; confirm the route goes around it with orthogonal segments and rounded corners.
- Move an auto-route corner and confirm the wire changes to Free hand without losing its endpoints.
- Check desktop and the current narrow viewport for non-overlapping routing controls, then confirm a clean build and no runtime errors.
