# 3D cable route controls

## Goal
Make every route-adjustment ball half its current size and let each cable, line, or wire corner move freely in 3D.

## Changes
- Reduce the diameter of orange corner balls, white add-corner balls, and red loose-end handles by 50% while keeping them easy to select with a larger invisible hit area.
- Select a routing ball with one click and show a standard 3D transform gizmo at that point:
  - red X arrow
  - green Y arrow
  - blue Z arrow
  - XY, XZ, and YZ plane handles
- Drag an arrow to constrain movement to one axis, or drag a plane handle to move within that plane.
- Temporarily disable camera rotation and panning while manipulating the gizmo so movement remains predictable.
- Apply the same editor to underground cables, aerial lines, and small wires, including loose unconnected ends.
- Store route points as full X/Y/Z coordinates. Existing two-coordinate points remain compatible and receive their cable type’s current default height.
- Update each renderer and length calculation so vertical route changes are reflected in the visible path and measured length.
- Keep current route behavior unchanged when adding a route: new points begin at the existing default height and can then be adjusted in 3D.

## Validation
- Verify axis-only and plane-constrained dragging from angled, front, and top views.
- Verify all three connection types follow vertically moved points and loose ends.
- Confirm the smaller visible balls remain selectable, camera controls resume after dragging, measured lengths update, and the scene has no errors.

## Technical details
Use Three.js/R3F transform controls attached to a selected route-point anchor. Normalize legacy `[x, z]` waypoints into world-space `[x, y, z]` points at render/edit boundaries, then keep the shared route editor and each connection renderer aligned to that format.
