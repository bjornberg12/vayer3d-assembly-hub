# Bug and error check results, and fixes

## What was checked
- All 30 automated tests (circuit solver, LV panel, car-part pins, save files, electron flow): all pass.
- Type check and build: clean, no errors.
- Live preview logs: no crashes or errors, only two harmless warnings from the 3D library.
- Code quality scan: no real bugs, but leftover clutter.

## Findings
1. Leftover "always on" / "always off" switches in the 3D viewer (7 places) from when car parts were only in the Electric car scene and an old cable mode. They do nothing now but make code harder to follow; two blocks of hidden menu code are dead.
2. About 2,300 formatting warnings (spacing/line breaks only, no effect on behaviour).
3. Two 3D library warnings in the browser console (old clock and soft shadow setting). Harmless; shadows already fall back automatically.

## Fixes
1. Remove the leftover always-on conditions and delete the two dead hidden blocks.
2. Run the automatic formatter over the code so the scan is clean.
3. Switch the shadow setting to the supported type to silence that warning (the clock warning comes from inside the library and cannot be fixed here).
4. Re-run all tests, the build, and open the app to confirm scenes, wiring and saving still work.

No behaviour changes for the user.
