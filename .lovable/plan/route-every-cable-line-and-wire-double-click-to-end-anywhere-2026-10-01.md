# Route every cable, line and wire; double-click to end anywhere

## What you will be able to do
1. **One routing method for all three types** in the Wiring menu: underground Cables, aerial Lines and small Wires.
   - Click a start object (or double-check: any spot on the ground, see 2), then single-click the ground to drop corner points. A dashed preview follows the cursor.
   - Click an object to finish there, or **double-click anywhere to end the cable at that spot**, even if nothing is there.
   - Esc cancels, Backspace removes the last corner, Enter finishes at the last corner.
2. **Loose ends** — a cable can also *start* on empty ground. A free end shows a small end-cap marker that you can drag later. Loose ends carry no current or power data until they reach an object; length still shows.
3. **Editing works the same for all types** — select a cable, line or wire to see its corner handles. Drag a corner to move it, drag the "+" midpoint handle to add a corner, and right-click a corner to remove it. "Reset route" goes back to a straight route.
4. **Heights**
   - Underground cables run at trench depth, as they do today.
   - Aerial lines keep the height of their posts, and the height blends between the ends. Corners act like extra support points, and the line sags between them. A loose line end stays at 8 m.
   - Wires run just above the ground, at 1.2 m by objects and 0.1 m at loose ends, with a slight sag between corners.

## Technical details
- Shared endpoint model: `End = { id: string } | { point: [x, y, z] }`. Cable, connection and EV-wire records get `a`/`b` as `End`, and lines and wires gain optional `waypoints: Waypoint[]`. Old string ids are normalised on read.
- Generalise `CableRouter` to take a `kind` ("cable" | "line" | "wire"). Handle `dblclick` on the canvas with a ground raycast: it finishes with a point end, and the duplicate single-click waypoint from the double-click is dropped. Ground clicks before a start object is picked become a point start.
- Generalise `CableRouteEditor` to all three record kinds via an adapter (get/set waypoints, resolve ends). Free ends get draggable handles.
- Rendering:
  - Lines: Catmull-Rom through the ends plus waypoints at interpolated height, with a sag per span.
  - Wires: a smooth tube through the waypoints.
  - Length helpers accept waypoints.
- Feeders and branch joints only apply to object ends. Electrical calculations are skipped while an end is loose.
- AGENTS.md: replace the cable-routing rule with "all connection kinds share one End type plus ground waypoints, routed and edited by one router/editor".
