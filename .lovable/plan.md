# Add a new blank scene called "Electric car"

Add a selectable empty scene named **Electric car** to the scene menu. It will show only the standard ground plane, grid, and weather, with no fixed 3D model and no assembly steps.

## What will change

1. **Scene registry (`src/components/Scene3DViewer.tsx`)**
   - Extend the `SceneId` union type with `"electriccar"`.
   - Append a new scene entry to `SCENES`:
     - id: `electriccar`
     - name: `Electric car`
     - subtitle: `Blank scene`
     - footprintM: `20`

2. **Step labels logic**
   - Update the `stepLabels` ternary chain so `"electriccar"` resolves to `null`, which disables the Back/Forward step controls and the step counter.

3. **Scene rendering**
   - Add a `{sceneId === "electriccar" && null}` branch (or equivalent empty render) in the active scene conditional block so the scene remains blank.

4. **Verification**
   - Run the type checker to confirm the new `SceneId` is handled everywhere.
   - Open the preview, open the Scenes menu, select **Electric car**, and confirm the ground plane loads with no model and no step controls.
