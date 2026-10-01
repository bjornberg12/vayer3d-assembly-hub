# Properties panel UI rework

The Properties panel is cramped and misaligned: property labels are cut off by the input, the × / AC-DC controls crowd the right edge of each input at different positions, the content sits in a fixed 256px block inside a 288px panel (32px dead strip on the right), and the "Show assembly" checkbox row is an unstyled native checkbox. Same glass design language, cleaner execution.

## Changes

### 1. `src/components/DraggablePanel.tsx` — content spacing helper
No behavior change. Panels already pass full-width content; nothing needed here beyond keeping the header. (Only touched if a class tweak is required.)

### 2. `src/components/Scene3DViewer.tsx` — Properties panel body
- Replace the `w-64` inner block with full-width padded content (px-4 like the other panels) so the panel edges align on both sides.
- Section headers ("Part", "Scene", "Basic properties", "Model-specific") get consistent small-caps styling with a hairline divider.
- "Show assembly" rows become glass cards (rounded-lg, white/50 bg, accent checkbox, hover state) instead of bare checkboxes.
- Wire cross-section chips, Wire-from-this-part, Delete and Close buttons restyled consistently: uniform height, full width, same rounding, centered text.

### 3. `src/components/BasePropsEditor.tsx` — property rows (the core fix)
- Each row becomes a CSS grid: fixed label column (96px, no truncation for current labels) → input column (1fr, min-w-0) → fixed right controls column. All inputs start and end at the same x on every row; unit, AC/DC and × sit in the right column, never overlapping the input.
- Inputs restyled: rounded-lg, white/65 glass fill, visible border, 2px horizontal padding, focus ring in the amber accent; monospace for numbers.
- AC/DC becomes a compact segmented toggle (AC | DC, active side highlighted) with a fixed slot in the right column.
- × remove button becomes a small circular ghost button, vertically centered, consistent position in the right column.
- "+ Add property" keeps its dashed style but matches the panel width and centered text.
- The picker chips wrap cleanly with more padding.

## Verification
- Typecheck, then Playwright: open the app, right-click the mast, screenshot the panel; confirm labels are not clipped, all rows align, controls sit in their own column, and the panel content fills the panel width.
