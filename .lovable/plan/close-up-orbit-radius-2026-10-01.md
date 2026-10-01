# Close-up orbit radius

## Goal
Keep rotation tight and controllable after zooming close to a component, instead of orbiting around a distant point with a huge radius.

## Changes
- Update the continuous cursor-focused zoom so zooming inward also advances the OrbitControls focus point toward the detail under the cursor.
- Reduce the camera-to-focus distance progressively during close-up zoom, while retaining a small safe minimum for stable rotation.
- Keep zoom-out behavior smooth and prevent abrupt focus jumps when reversing direction.
- Preserve the existing fast continuous zoom, cursor targeting, pan, viewpoints, and bottom-right camera reset.

## Validation
- Zoom from the default view into a small component and confirm dragging rotates tightly around the close-up detail.
- Zoom farther inward and verify the orbit radius continues shrinking without stalling or jumping.
- Zoom back out, pan, rotate, and reset the camera to confirm those controls still behave normally.
- Test near the center and edges of the 3D view and confirm there are no page errors.

## Technical details
Adjust the camera and `OrbitControls.target` by different cursor-ray amounts during wheel zoom rather than translating both equally. Use damped accumulated camera and target motion, clamp only the minimum orbit radius needed for numerical stability, and clear both motion accumulators on camera reset.
