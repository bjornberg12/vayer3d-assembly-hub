# Project rules

- Every 3D model lives in `src/ModelLibrary/<group>/` and is registered in `src/ModelLibrary/index.ts` (MODEL_REGISTRY, or EV_DEFS for car components) with basic-property defaults — keeps models, parameters and properties in one place.
- All models share the basic properties in `src/ModelLibrary/properties.ts`; models only choose which are active by default and add model-specific params on top — gives every object a uniform Properties panel.
- Three.js code renders client-only (lazy + ClientOnly, troika without worker) — SSR/worker crashes otherwise.
- Wheel zoom travels along the cursor ray toward the raycast hit (min step, view direction preserved, pivot moved onto the view axis at hit depth) and middle-drag pan is custom grab-point panning; OrbitControls only rotates — distance-based dolly stalls and off-axis pivots swing the view.
- All connection tools (underground cables, aerial lines, small wires) live in the Wiring menu; line and wire type catalogues live in `src/ModelLibrary/cables/catalog.ts` — one place to pick and extend cable types.
