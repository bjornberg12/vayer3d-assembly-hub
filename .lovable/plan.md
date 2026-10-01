# Fix zoom, rotation radius and middle-button pan

## What is wrong now
On each wheel step the rotation centre is pushed to an invented point along the cursor line, not onto the part you are pointing at. The camera then turns to look at that new centre, so the view swings sideways instead of zooming straight in. Panning also uses that invented centre, so its speed feels wrong.

## What you will get
- **Zoom straight into the part under the cursor.** The spot under the cursor stays under the cursor; the view never swings or turns while zooming.
- **Never slows down.** Each wheel notch moves a fixed share of the way to the part, with a minimum step so you keep moving at very close range and can push through a surface to whatever is behind it.
- **Rotation radius follows what you look at.** After zooming, the rotation centre sits at the depth of the part under the cursor: far away = wide orbit, close up = tight orbit around that detail.
- **Hold the scroll wheel and drag = slide the view (pan).** The point you grabbed sticks to the cursor, at any zoom level, without rotating.
- Left-drag rotate, right-drag zoom, and the bottom-right reset button keep working.

## Technical details
File: `src/components/Scene3DViewer.tsx`.

1. Replace `ContinuousCursorZoom` logic:
   - On wheel, raycast the scene from the cursor (skip helpers, grid, labels, weather particles); fall back to the ground plane y=0, then to the current orbit depth.
   - Step = `max(hitDistance * (1 - exp(-|dy| * 0.0025)), 0.002 * notches)` along the cursor ray; zoom-out uses the inverse factor with no cap.
   - Pivot = camera + forward * (hit point projected onto the view direction). Move camera and target by the same vector, so `lookAt` direction is unchanged (no swing). Keep exponential frame damping.
   - If the step passes the hit point, keep going (next wheel event raycasts the next surface).
2. Middle-button pan: own pointer handler (OrbitControls `MIDDLE` set to none). On press, raycast to get the grab depth; on move, translate camera and target in the camera plane at that depth so the grabbed point stays under the cursor. Disable OrbitControls while dragging; restore on release/pointer leave.
3. Keep `enableZoom={false}`, reset nonce behaviour and camera near/far. Update the zoom rule in `AGENTS.md` (cursor-hit pivot, view-preserving travel, custom middle pan).
4. Verify in the browser: deep zoom into a mast isolator without swinging, tight orbit after zoom, middle-drag pan, reset.
