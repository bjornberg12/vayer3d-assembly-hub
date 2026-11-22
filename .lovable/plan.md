# Downloadable offline HTML version

## Goal
One self-contained `vayer3d.html` file in Files that opens by double-click in any modern browser, with no internet and no server: full 3D scene, Add menu, wiring, simulations, Grid design studies, properties, and scene save/load (as JSON file download/upload).

## Approach
- Build a separate browser-only bundle of the existing app (same source, no changes to the live app) that mounts the main 3D viewer directly, without the server parts of the framework.
- Inline all JavaScript, CSS, fonts and images into the single HTML file so it works from the local disk.
- Text labels in 3D use a font that is embedded into the file so they render offline.

## Steps
1. Add a small standalone entry file and a standalone build config used only for this export (does not affect the published site).
2. Build in a temporary folder, inline everything into one HTML file.
3. Open the file from disk with a headless browser: check the scene renders, add an object, open Grid design studies, confirm no errors.
4. Save as `vayer3d.html` in Files (and optionally a ZIP copy).

## Limitations
- File will be large (roughly 3–6 MB) due to the 3D engine.
- Uploaded custom ground images still work; anything that needs an online service would not (currently none).
- The HTML is a snapshot; future app changes require a new export.

## Technical details
- Entry `src/standalone.tsx` renders `Scene3D` with React DOM `createRoot`; config `vite.standalone.config.ts` using `@vitejs/plugin-react`, Tailwind v4 plugin, tsconfig paths and `vite-plugin-singlefile` (dev dependency), `assetsInlineLimit` max, output to `/tmp/standalone`.
- troika text fonts and any `/__l5e/assets` URLs are converted to data URIs at build time.
- Verification via Playwright on `file://`.
