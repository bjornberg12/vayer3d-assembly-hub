# Project rules

- Every 3D model lives in `src/ModelLibrary/<group>/` and is registered in `src/ModelLibrary/index.ts` (MODEL_REGISTRY, or EV_DEFS for car components) with basic-property defaults — keeps models, parameters and properties in one place.
- All models share the basic properties in `src/ModelLibrary/properties.ts`; models only choose which are active by default and add model-specific params on top — gives every object a uniform Properties panel.
- Three.js code renders client-only (lazy + ClientOnly, troika without worker) — SSR/worker crashes otherwise.
- Wheel and trackpad zoom use continuous cursor-ray camera travel while OrbitControls handles rotation and pan — distance-based dolly stalls at close range.
