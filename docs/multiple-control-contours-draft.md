# Multiple Control Contours Draft

This document describes the draft foundation for multiple punching shear control perimeters. It is geometry and verification preparation only. It is not verified SP63 support and must not be used as a final design calculation.

## Scope

- Supported draft case types: `center`, `edge`, `corner`, `opening`, `wall-end`, `wall-corner`.
- Default behavior remains unchanged because `multipleContours.enabled` is `false`.
- When enabled, the engine generates several draft offsets and exposes them in result DTOs, SVG previews, reports, diagnostics, and verification template examples.

## DTO

`PunchingShearInput.multipleContours`:

- `enabled`
- `count`
- `offsetStep`: `h0/2`, `h0`, or `custom`
- `customOffsetStepMm`

`PunchingShearResult`:

- `controlContours`
- `selectedContourId`
- `draftCriticalContour`
- `contourComparison`
- `contourWarnings`

`ControlContour`:

- `id`
- `index`
- `kind`
- `offsetMm`
- `perimeterMm`
- `effectiveDepthMm`
- `vertices`
- `segments`
- `boundingBox`
- `warnings`
- `status`

## Draft Generation

Offsets are generated from the selected step:

- `h0/2`: `h0 / 2`, `h0`, `1.5 * h0`, `2 * h0`, and so on.
- `h0`: `h0`, `2 * h0`, `3 * h0`, and so on.
- `custom`: `customOffsetStepMm`, `2 * customOffsetStepMm`, and so on.

Each contour reuses the existing draft perimeter geometry generator with the requested offset. The generated offsets are placeholders for comparison and verification preparation only.

## Draft Selection

For each contour, the draft stress is:

```text
v = N / (u * h0)
```

Draft utilization is `v / Rdraft`. The current `draftCriticalContour` selector chooses the contour with maximum draft utilization. This selector is intentionally named and reported as draft-only.

## Reports And SVG

Reports include a `Multiple Control Perimeters` section with contour id, offset, perimeter, draft stress, utilization, selected status, and warnings.

SVG previews show all generated contours. Non-selected contours are thin draft lines. The selected draft critical contour is emphasized and labeled.

## Remaining Work Before VERIFIED

- Confirm SP63 critical contour rules for every supported case type.
- Replace draft offsets with verified clause-based contour generation.
- Verify contour selection against trusted manual/WebCAD/Excel examples.
- Add expected values to verification templates.
- Keep draft warnings visible until trusted evidence is merged into the verification dataset.
