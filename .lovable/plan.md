# Pin-only wiring with nearest-pin preview

## What will change
- Remove the large orange generic connector/terminal from every electric-car component model. The smaller, colour-coded real-world pins remain visible.
- In **Wiring → Wires**, disable whole-object and loose-ground endpoints for new wires. A new wire must start on a connection pin and finish on another connection pin.
- Keep manual routing: after choosing the first pin, ground clicks continue to add movable corner points.
- While routing, continuously find the connector pin nearest to the cursor and snap the dashed preview to that pin. Clearly highlight the proposed destination pin.
- Clicking the highlighted pin finishes the wire. Clicking empty ground adds a route corner instead; double-clicking empty ground will no longer finish a small wire.
- Keep existing previously-created whole-object or loose-ended wires readable and editable so old scene data does not disappear, while preventing creation of new ones.
- Update the wiring guidance text to describe pin-to-pin selection and route corners.

## Interaction details
1. Turn on **Wiring → Wires**.
2. Move near a pin; the nearest eligible pin highlights.
3. Click it to start.
4. Click the ground as needed to place route corners.
5. Move near the destination component; the dashed preview snaps to its nearest pin.
6. Click that pin to complete the wire.

The starting pin itself will not be offered as the destination. Existing incompatible-pin warnings remain active.

## Technical details
- Remove the shared decorative `Terminal` meshes from the electric-car model geometry without removing actual `PinDef` meshes.
- Separate move-mode hit areas from wire-mode selection so car-part and general object proxies cannot call the wire endpoint handler.
- Restrict new small-wire endpoint IDs to `owner#pin` values from car components and EV chargers.
- Extend the shared wire router with screen-space nearest-pin tracking and a pin-height dashed preview endpoint, while retaining ground waypoint placement.
- Verify in the browser that whole-part clicks cannot start or finish wires, corner routing still works, preview snapping follows the closest pin, and a completed wire stores both pin IDs.
