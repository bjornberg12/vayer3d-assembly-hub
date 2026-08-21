# Fix the blank production 3D viewer

## Confirmed diagnosis

The remaining crash is different from the earlier server-rendering issue. The page and controls load, but the canvas fails after a `ReferenceError: u is not defined` inside a generated `blob:` script.

The scene uses Drei's `<Text>` throughout `src/components/Scene3DViewer.tsx`. Drei renders that text through `troika-three-text`, which serializes minified functions into a browser worker created from a blob. The installed Troika implementation enables that worker by default. This matches the current error location and explains why the menus render while the 3D canvas remains blank.

## Implementation

1. Configure Troika text rendering to run on the main browser thread before any 3D text is created, avoiding the broken generated worker/blob path.
2. Keep the existing client-only lazy boundary and all scene features unchanged.
3. Add a canvas-level fallback so a future WebGL/rendering failure shows a useful viewer error rather than leaving an unexplained blank area.

## Verification

- Run the production build, not only the development preview.
- Open the built app in Chromium and confirm the canvas, ground grid, labels, mast, and menus all render.
- Confirm there are no `ReferenceError` or page errors, and specifically no failing Troika blob worker.
