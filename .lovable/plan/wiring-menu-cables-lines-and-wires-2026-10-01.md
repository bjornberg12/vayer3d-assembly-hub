# Wiring menu: Cables, Lines and Wires

## What you will get
The "Cables" button in the top bar becomes **Wiring**. All connecting moves there and out of the Add menu. Wiring has three sections you can open and close:

1. **Cables (underground)**: everything the current Cables menu has: 70/95/120/240 mm² four-core LV cable, yellow 750N/1250N conduit, laying mode, the cable list and removal. It works the same as today.
2. **Lines (aerial)**: pick the line type, then click "Connect posts" and click two posts. The types are:
   - LV aerial bundled cable (AMKA): 3×25+54.6, 3×50+54.6, 3×70+95, 3×120+95
   - 20 kV bare conductor: AC-35, AC-50, AC-70
   - Each line remembers its type. Clicking a line shows its type, length and sag. The list of lines lets you delete them.
3. **Wires (small)**: pick a wire type, then click "Wire objects" and click two objects. The types are:
   - Installation cable: 3G1.5, 3G2.5, 5G2.5, 5G6
   - DC single-core: 4, 6, 10, 16, 35, 50, 95 mm²
   - This works in every scene, for car parts and placed objects. It replaces the old "Wire parts" button and size slider in the car scene.
   - Clicking a wire shows its type, length and colour. You can also delete it there.

Only one connect tool is active at a time. The banner at the bottom shows which cable type you are using. The Add menu then only adds components, and "Move" stays there.

## Technical details
- New `src/ModelLibrary/cables/catalog.ts` holds the `LINE_TYPES` and `WIRE_TYPES` catalogues (id, label, cross-section, colour, diameter, voltage class). Register both in `ModelLibrary/index.ts` with basic-property defaults.
- `Scene3DViewer.tsx`:
  - Rename the `cablesOpen` button and panel to "Wiring" (Cable icon). Inside the `DraggablePanel`, add three collapsible sections, with `wiringSection` state saying which is open.
  - Move the cable UI block in unchanged.
  - Move "Connect posts" from the Add menu to Lines. Add `lineType` state, and store `type` on each connection record (old records default to AMKA 3×70+95). Line thickness and colour come from the type.
  - Move EV wiring to Wires, with `wireType` state. Generalise `evWires` into wires whose ends can be any placed object or car part (ends are object ids plus world anchors). Draw them as smooth slightly sagging tubes in the wire's colour. Use the type instead of the old cross-section slider in properties.
  - Starting a connect mode turns off the others (cable, connect, wire, move, placing).
  - Delete and Reset remove the matching lines and wires.
- AGENTS.md: rule that all connection types live in the Wiring menu, with catalogues in `ModelLibrary/cables`.
- Browser check: draw a line between two posts, a wire in the car scene, and an underground cable. Then confirm the Add menu has no connect buttons.
