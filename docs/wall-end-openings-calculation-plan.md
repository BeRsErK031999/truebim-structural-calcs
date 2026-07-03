# Plan: Wall End With Openings Calculation

## Goal

Add a separate application tab for the calculation from
`docs/Продавливание_произвольный_контур (2).xlsx`.

Working user-facing name: `Расчет торца стены с отверстиями`.
Alternate engineering name: `Продавливание с произвольным контуром`.

The first implementation must be clear that this is a new calculation surface
based on the Excel reference, not a promotion of the existing punching-shear
engine to verified wall-end support.

## Reference Snapshot

Source workbook:

- main sheet: `П`;
- drawing sheet: `График продавливания`;
- materials sheet: `Характеристики материалов`.

Input groups found in the workbook:

- wall/pylon thickness `t`;
- slab section `h`, `ax`, `ay`, computed `h0`;
- punching force `Fi`, moment `Myi`, area load `qi`;
- three cutouts on `lx1` from below;
- three cutouts on `lx2` from above;
- three cutouts on `ly` at the wall end;
- alternate contour offsets `Y+` and `Y-`;
- concrete class and shear reinforcement class, diameter, count, spacing.

Observed workbook formulas cover:

- contour lengths `lx1`, `lx2`, `ly`, total active contour `u`;
- cutout clipping to the available contour side;
- static moment `S`, contour centroid `y`;
- local eccentricity moment from `Fi`;
- concrete capacity without shear reinforcement;
- shear reinforcement contribution with upper/lower limits;
- live contour plot coordinates.

Note: the screenshots show the first `lx2` cutout as `32 / 52 mm`, while the
saved workbook currently stores `0 / 0 mm` in that input pair. For the first UI
task the default values follow the screenshots, and the formulas stay editable
so the saved workbook state can also be reproduced by setting `lx2` to zero.

## Work Plan

1. Create a standalone calculation module.
   - Define typed inputs and outputs for wall-end openings.
   - Port the Excel formulas into pure TypeScript.
   - Add regression tests against the screenshot baseline values.

2. Add the new application tab.
   - Add route `/wall-end-openings`.
   - Add sidebar navigation entry `Торец стены с отверстиями`.
   - Keep the existing punching-shear tab unchanged.

3. Build the calculator screen.
   - Dense engineering layout with results, inputs, and live contour preview.
   - Tooltips/comments for parameters and input rules.
   - Derived values update immediately when inputs change.
   - Show draft/reference status and warnings near the results.

4. Implement the live contour preview.
   - Draw wall center, control contour, active segments, cutout gaps, and
     contour centroid.
   - Update the drawing from the same computed geometry used by the numbers.
   - Keep dimensions stable across desktop and mobile widths.

5. Extend verification.
   - Unit tests for formulas and clipping rules.
   - Render test for the new tab content.
   - Browser smoke test after UI implementation.

6. Later tasks after the first vertical slice.
   - Reconcile all workbook cells against an engineer-approved saved example.
   - Add export/report output for this calculation.
   - Add saved localStorage session support if the workflow needs persistence.
   - Add trusted verification cases before any `VERIFIED` status is claimed.

## First Task Scope

The first task in this branch is a vertical slice:

- plan document;
- formula module for the Excel baseline;
- new tab and route;
- live input/results/contour preview;
- focused tests for the baseline and route rendering.

Out of scope for the first task:

- report export;
- localStorage persistence;
- office deployment;
- claiming normative verification beyond the Excel reference.
