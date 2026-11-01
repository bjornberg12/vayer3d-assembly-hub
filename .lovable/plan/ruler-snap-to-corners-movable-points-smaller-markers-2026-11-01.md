# Ruler: snap to corners, movable points, smaller markers

## What changes
1. **Snap suggestion while hovering:** with the ruler on, a small square preview follows the cursor. When the cursor is near a corner of an object (within ~12 screen pixels), it locks onto that corner and turns highlighted; if no corner is close it snaps to the nearest edge, otherwise it stays on the surface under the cursor. Clicking places the point where the preview is.
2. **Override the snap:** hold **Alt** while placing to ignore snapping and put the point exactly under the cursor.
3. **Move placed points:** drag either measuring point to a new spot; it snaps the same way while dragging, and the distance updates live.
4. **Look:** point markers become small squares (about a third of the current ball size, always facing the camera, same size on screen at any zoom); the measuring line becomes thin (1 px instead of 3).

## Technical details
- In `Ruler` (Scene3DViewer.tsx): on pointermove, raycast (excluding ruler objects); for the hit mesh take the hit face's three vertices in world space, project to screen, pick the closest within 12 px (corner). Else project the closest point on the face's edges (edge snap within 8 px). Else use the hit point. Alt bypasses.
- Render preview + points as `Html`-free screen-sized squares: a billboarded `planeGeometry` scaled by camera distance, `depthTest=false`, distinct colour when snapped.
- Dragging: pointerdown near an existing point (screen distance < 10 px) starts a drag; OrbitControls already disabled while the ruler is active. New prop `onMovePoint(index, p)` updates `rulerPoints`.
- `Line` lineWidth 1.
- Verify with Playwright: place two points on a model corner, confirm the snap, drag one, distance changes, no errors.
