# Save and load the simulation as a file

## What you get
- In the scene menu: **Save to file** and **Open save file**.
- **Save** downloads a text file (e.g. `vayer-scene-2026-11-01.txt`) with everything in the scene: placed models and their positions/rotations, car parts, every cable, line and wire (with routes and pin connections), all object properties (voltages, transformer settings, switchgear/GIS breakers, LV panel devices, relay automation), feeders, weather, ground settings, chosen scene and the "show electron flow" toggle.
- **Open** lets you pick a save file; the scene is replaced with the saved one and the simulation recalculates straight away (lights, currents, electron flow).
- Works fully offline — nothing is sent anywhere.
- A clear message if the file is not a valid save or comes from a newer version; your current scene stays untouched in that case.
- The file is readable text (JSON inside a .txt), so it can be emailed or kept in folders.

Not saved: camera position, open menus, half-finished drawing actions. A custom uploaded ground photo is not saved (only the ground mode and width) to keep files small.

## Technical details
- New module `src/lib/sceneSave.ts`: `SceneSave` type with `format: "vayer3d-scene"`, `version: 1`, `savedAt`, and data: `sceneId, addedItems, connections, cables, feeders, evParts, evWires, objectProps, weather, groundMode, customGroundWidthM, showFlow`. Functions `serializeScene(state)` and `parseScene(text)` (validates format, version, array/object shapes; throws readable errors).
- Scene3DViewer: buttons in the hamburger menu; save builds a Blob (`text/plain`) and downloads via an anchor in the click handler; open uses a hidden file input (`.txt,.json`), reads `file.text()`, parses, then sets all state at once and clears selections/modes. Loading must not trigger the scene-switch default car layout.
- Test `sceneSave.test.ts`: round-trip preserves items, wires with `owner#pin` ends and property values; wrong format and future version are rejected.
- Verify with Playwright: place a source + part + wire, save (expect_download), reset, open the file, confirm the objects return and the part shows powered.
