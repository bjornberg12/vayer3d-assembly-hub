# Continuous infinite zoom

## Goal
Make wheel and trackpad zoom continue smoothly through very small distances without slowing to a stop, while keeping the point beneath the cursor as the zoom focus.

## Changes
- Replace the built-in wheel dolly with a dedicated cursor-directed zoom controller.
- Normalize mouse-wheel and trackpad input so both produce smooth, predictable movement.
- Accumulate wheel input into damped camera motion rather than applying abrupt jumps.
- Move the camera toward the cursor ray with a minimum useful movement rate, then carry the focus point forward as the camera reaches it. This removes the current asymptotic slowdown and allows zooming continuously past the old target.
- Keep orbit, middle-button pan, right-button dolly, scene viewpoints, and the bottom-right zoom/pan reset control working as they do now.
- Retain the wide camera depth range and verify close-up rendering remains stable.

## Validation
- Repeatedly zoom into a small model detail and confirm motion stays smooth instead of stalling.
- Continue through the previous focus point, zoom back out, pan, orbit, and reset the camera.
- Test mouse-wheel and trackpad-style deltas, including cursor-targeted zoom near screen edges.
- Confirm the page does not scroll or browser-zoom while the pointer is over the 3D view.

## Technical details
Use a native non-passive wheel listener on the WebGL canvas, normalized `deltaMode`, frame-based damping, and refs for current motion state. Disable OrbitControls' wheel handling to avoid double input while leaving its rotation, pan, and pointer-dolly behavior enabled.
