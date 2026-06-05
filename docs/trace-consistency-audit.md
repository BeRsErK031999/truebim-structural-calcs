# Trace Consistency Audit

Date: 2026-06-05

Scope: Calculation Trace consistency across the current punching shear calculation model. This audit checks trace/result/report/SVG/verification-level alignment without changing formulas or verification lifecycle logic.

## Checked scenarios

| Scenario | Trace exists | Report trace exists | Source type status | Warning status | Notes |
| --- | --- | --- | --- | --- | --- |
| center force-only | yes | yes | verified/manual only where linked to center evidence | verified scope warnings remain visible | Base verified case remains linked to `verified-center-rect-001`. |
| center + moments | yes | yes | moment steps are partial/draft, not verified | moment draft warning present | Moment formulas remain draft/partial explainability only. |
| edge | yes | yes | draft/manual | boundary/draft warning present | No verified source type is assigned to edge calculation steps. |
| corner | yes | yes | draft/manual | boundary/draft warning present | No verified source type is assigned to corner calculation steps. |
| opening | yes | yes | draft/manual | opening/draft warning present | Opening tangent/subtraction trace remains draft-only. |
| wall-end | yes | yes | draft/manual | wall/draft warning present | Wall-end geometry trace remains draft-only. |
| wall-corner | yes | yes | draft/manual | wall/draft warning present | Wall-corner orientation and geometry trace remain draft-only. |
| multiple contours | yes | yes | draft/manual for contour-driven arithmetic | contour/draft warning present | Fixed source type for base arithmetic when draft contour selection is enabled. |
| shear reinforcement | yes | yes | reinforcement steps are draft | reinforcement draft warning present | Force-only base trace remains separate from draft reinforcement contribution. |
| round center | yes | yes | draft/manual | round/draft warning present | Round center perimeter approximation remains draft-only. |
| round unsupported edge/corner | yes | yes | placeholder/draft/manual | unsupported warning present | Unsupported trace is explanatory only and does not claim a formula. |

## Automated checks added

- Trace/result consistency for key fields: `controlPerimeterMm`, `effectiveDepthMm`, `shearStressMpa`, `utilizationRatio`, and `verificationLevel`.
- Trace/report consistency for HTML and Markdown report exports.
- At least one trace section and one trace step per audited scenario.
- Allowed `sourceType` values only: `verified`, `partial`, `draft`, `manual`, `placeholder`.
- No `NaN`, `Infinity`, or `-Infinity` in serialized trace values.
- Draft-only scenario trace steps are not marked with verified source type.
- Draft/partial/unsupported warnings are surfaced in result or trace.
- Visible trace labels use readable titles instead of raw internal IDs.
- Report source labels use a dedicated trace label map.

## Issues found

1. Multiple control contours could keep center force-only verification level while base arithmetic trace inherited `verified` source type.
   - Impact: report/trace could imply verified arithmetic even though selected contour arithmetic came from the draft multiple-contour workflow.
   - Fix: when `multipleContours.enabled` is true, base arithmetic trace source type is now `draft`.

2. Report/UI source labels used raw uppercase source type values.
   - Impact: readable enough for developers, but not a stable presentation label map.
   - Fix: added `traceLabels.ts` with readable source labels and used it in UI, HTML, and Markdown reports.

## Fixed issues

- Added `src/calculations/punching-shear/trace/traceLabels.ts`.
- Updated HTML/Markdown report trace rendering to use readable source labels.
- Updated `ResultPanel` trace badges to use readable source labels.
- Updated trace arithmetic source selection for multiple control contours.
- Added trace consistency audit tests covering the scenario matrix.

## Deferred issues

- Verification lifecycle still determines `verificationLevel` and `verifiedFeatures`. This audit intentionally did not promote, demote, or recalculate verification status.
- Existing mojibake in legacy Russian text remains outside this audit. The change does not introduce new mojibake-bearing strings.
- Source references still include stable evidence IDs and trace foundation references. Those are treated as traceability references, not visible labels.

## Remaining risks

- Moment transfer, openings, edge/corner clipping, wall cases, multiple contours, shear reinforcement, and round column behavior remain draft/partial as previously documented.
- The audit verifies consistency of current DTO/report output, not engineering correctness of formulas.
- SVG checks are structural through generated report inclusion and model availability; no visual browser pixel regression was added in this milestone.

## Verification commands

Required final verification for this milestone:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:mojibake
```
