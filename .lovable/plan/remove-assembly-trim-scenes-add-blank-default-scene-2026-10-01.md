# Remove assembly, trim scenes, add blank default scene

## What changes
1. **Assembly removed everywhere** — no Back/Forward step buttons, no "Show assembly" option in Properties, and every model always shows fully built.
2. **Scenes** — "Puitmast - 1kV", "Puitmast -20kV", "Jaotuskilp" and "Alajaam 10kV/0,4kV" are removed from the scene menu. Remaining: **New blank scene** (default when the site opens: empty ground, grid, nothing placed) and **Electric car**.
3. **Aerial photo** — the built-in default ground photo is deleted; the ground starts plain. Uploading your own ground image still works.
4. Posts, panels and substations stay available in the Add menu, so you can still place them on the blank scene. Reset returns to an empty ground.

## Technical details
- Scene3DViewer.tsx: SCENES reduced to `blank` (new, default) + `electriccar`; remove fixed scene-model rendering, global/per-object step state, assembly controls and Properties assembly section.
- Model components (ElectricalPost, WoodenMast20kV, DistributionPanel, Substation, EV parts): drop `step` props/step definitions, render all parts.
- AerialGround: no default texture; only render when the user uploads an image. Delete the bundled aerial image asset.
- Update AGENTS.md if any rule mentions assembly.
