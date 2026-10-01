# Hand-routed underground cables with editable corner points

## What you will be able to do
1. **Route a cable yourself** — in Wiring > Cables, press "Lay cable", click the start object, then click on the ground as many times as you like to drop corner points, and finish by clicking the end object. A dashed preview follows the cursor while routing.
   - Esc cancels, Backspace removes the last corner, Enter or clicking the end object finishes.
2. **Edit existing cables** — select a cable (click it) and tick "Edit route" in the Cable data panel. Every corner shows a round handle on the ground.
   - Drag a handle to move that corner.
   - Small "+" handles sit at the middle of each section — drag one to create a new corner there.
   - Right-click (or Alt+click) a corner to remove it.
   - "Reset route" returns to the automatic straight route.
3. Cable length, current and other data update live as you edit. Corners stay smoothly rounded (no sharp 90° bends), and the cable keeps its trench depth with gradual dips down from and up to the objects.
4. Cables without hand-placed corners keep working exactly like today.

## Technical details
- `CableRecord` gains optional `waypoints: [x, z][]` (ground-plane positions at trench depth).
- `routePoints(from, to, depth, waypoints?)` in UndergroundCable.tsx: corners = start, diagonal descent toward first waypoint, waypoints at `-depth`, ascent to end; then existing `filletPolyline` with radius clamped per corner to `min(depth*0.6, 0.4*shorter adjacent segment)`. `cableRouteLength` and `UndergroundCable` accept and pass waypoints.
- Routing in Scene3DViewer.tsx: `handleCableClick` keeps `cableFirst`, plus `cableDraft: [x,z][]`; ground clicks while `cableFirst` is set append to the draft (raycast y=0 plane); hover point stored in a ref for the preview line; keyboard handlers for Esc/Backspace/Enter.
- New `CableRouteEditor` component: renders corner and midpoint handles for the selected cable; pointer-drag projects onto the y=0 plane, updates `waypoints` via `updateCable`, disables OrbitControls during drag (same pattern as DragProxy).
- Branch joints keep their position on the parent cable by re-evaluating on the updated curve.
- AGENTS.md: add rule that cable routes are stored as ground waypoints and filleted at render time.
