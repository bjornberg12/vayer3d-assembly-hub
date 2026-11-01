# Run the app fully offline on your computer

## Findings
- No backend: no database, no login, no online services. All simulation runs in the browser; scenes live in memory.
- Only two leftover template example files exist (unused).
- One online dependency: 3D text labels (part names, GIS/LV panel labels) download their font from the internet by default. Offline, those labels would be missing.

## Changes
1. Add a font file to the project and point every 3D label to it, so labels work without internet.
2. Delete the two unused example server files.
3. Add a short "Run offline" section to the README:
   - Install Node.js or Bun once (needs internet the first time to download packages).
   - `bun install`, then `bun run build` and `bun run preview` (or `bun run dev`) and open http://localhost:8080 — after that it works with no internet.
   - Alternatively download the project via GitHub export.

## Technical details
- Put a .woff/.ttf in `public/fonts/` and pass `font="/fonts/..."` to all drei `<Text>` usages (Scene3DViewer, GIS, LVPanel and any others found by search), ideally via a shared constant.
- Remove `src/lib/api/example.functions.ts` and `src/lib/config.server.ts` if unreferenced.
- Verify with Playwright with external network requests blocked: labels render, no failed requests.
