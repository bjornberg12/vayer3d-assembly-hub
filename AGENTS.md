# Project rules

- Every 3D model lives in `src/ModelLibrary/<group>/` and is registered in `src/ModelLibrary/index.ts` (MODEL_REGISTRY, or EV_DEFS for car components) with basic-property defaults — keeps models, parameters and properties in one place.
- All models share the basic properties in `src/ModelLibrary/properties.ts`; models only choose which are active by default and add model-specific params on top — gives every object a uniform Properties panel.
- Three.js code renders client-only (lazy + ClientOnly, troika without worker) — SSR/worker crashes otherwise.
- Wheel zoom travels along the cursor ray toward the raycast hit (min step, view direction preserved, pivot moved onto the view axis at hit depth) and middle-drag pan is custom grab-point panning; OrbitControls only rotates — distance-based dolly stalls and off-axis pivots swing the view.
- All connection tools (underground cables, aerial lines, small wires) live in the Wiring menu; line and wire type catalogues live in `src/ModelLibrary/cables/catalog.ts` — one place to pick and extend cable types.

- All connection kinds share one router and route editor with optional ground waypoints; new small wires require `owner#pin` endpoints, while cables/lines allow object or loose `pt:x,z` ends and legacy wire ends remain readable — preserves routed editing without creating electrically ambiguous wires.
- EV chargers live in `src/ModelLibrary/chargers/`, store their model-specific values in the object's property values, and are underground-cable endpoints — keeps supply from substations/panels on one connection model.
- Wire ends may reference a device pin as `owner#pin`; pin definitions (id, label, role, local position) live with the model (EV_DEFS pins, chargerPins) — one source for wiring and the future circuit solver.
- Small wires support freehand waypoints or collision-aware orthogonal auto-routes; component footprint bounds live with EV_DEFS and manual route edits convert auto-routes to freehand — routing stays model-aware and user edits remain authoritative.
- Voltage sources live in `src/ModelLibrary/sources/`; `solver.ts` computes wire currents from source pin loops (I = V/R, AC phasors) and calculated currents override manual wire current — one place to grow the circuit solver.
