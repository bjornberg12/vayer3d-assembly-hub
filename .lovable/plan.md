# Fix: 3D viewer doesn't load when opening the project

## What's happening

In the published/preview build the page loads but the 3D scene never appears, and the browser reports `Uncaught ReferenceError: u is not defined` from the bundled JavaScript. Running the same page locally in dev mode renders the scene fine (verified: canvas mounts, mast and ground visible), so this is not a modelling or state bug — it's the 3D scene being rendered on the server during page generation.

Confirmed from the code: `src/routes/index.tsx` renders `Scene3D`, and `src/components/Scene3D.tsx` imports `three`, `@react-three/fiber` and `@react-three/drei` at the top level with no client-only gating. Those libraries need a real browser (WebGL, canvas, window) and must not be part of the server render.

## The fix

1. Split the 3D part out so it is only ever imported in the browser:
   - Move the current `Scene3D` implementation into a viewer module that is loaded lazily.
   - Create a thin `Scene3D` wrapper that renders the viewer through `React.lazy` inside TanStack's `<ClientOnly>`, so the server never evaluates three.js.
2. Show a lightweight "Loading 3D viewer…" placeholder while the bundle loads, styled with existing design tokens so there is no blank screen.
3. Keep `src/routes/index.tsx` unchanged apart from still importing the wrapper — the header and layout continue to render server-side.

## Verification

- Load the page in the sandbox browser and confirm the canvas mounts with no page errors.
- Run a production build and check that the built bundle no longer throws on first paint.

## Technical notes

- Gating must be at the import boundary, not just at render: `<ClientOnly>` alone does not stop SSR from evaluating a statically imported three.js module, hence the lazy dynamic import.
- No changes to scene content, assembly steps, menus, or state logic.
