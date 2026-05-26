# Openings and Boundaries Draft Geometry

This document describes the clean-room draft geometry architecture for edge columns, corner columns and openings near a rectangular punching shear control perimeter.

The implementation is geometry and verification preparation only. It is not production SP63 support and must not be used as a verified design calculation.

## Architecture

The rectangular center perimeter remains the base contour. Edge, corner and opening cases start from the same draft rectangle at `effectiveDepthMm / 2` from the column face, then apply independent geometry transforms:

- `edge-corner/slabBoundary.ts` converts optional slab edge distances into a slab boundary box.
- `edge-corner/edgeClassification.ts` marks center, edge or corner conditions.
- `edge-corner/perimeterClipping.ts` clips perimeter segments against the slab boundary box.
- `openings/openingClassification.ts` marks openings inside the draft influence radius.
- `openings/tangentConstruction.ts` builds tangent rays from the column center to the opening rectangle.
- `openings/contourSubtraction.ts` removes perimeter segments whose midpoint lies inside the tangent cone.

The resulting `ControlPerimeterResult` carries both active and removed geometry:

- `segments`: active perimeter used by current draft arithmetic.
- `removedSegments`: boundary-clipped or opening-subtracted segments.
- `clippedPerimeterMm`: perimeter after slab boundary clipping.
- `removedPerimeterMm`: total removed draft length.
- `openingTangents`: tangent line DTOs for SVG and report output.
- `clippingMetadata`: flags and affected opening IDs for diagnostics/export.

## Boundary Clipping

Slab edge distances are interpreted from the column center:

- `leftMm` creates a boundary at `x = -leftMm`.
- `rightMm` creates a boundary at `x = rightMm`.
- `topMm` creates a boundary at `y = -topMm`.
- `bottomMm` creates a boundary at `y = bottomMm`.

Each perimeter segment is line-clipped against that box. The active piece remains in `segments`; the outside piece is added to `removedSegments` with `removedBy: "boundary"`.

## Opening Tangents

For every affected rectangular opening, the geometry layer builds rays from the column center to the opening corners and selects the smallest angular cone containing the opening.

Current subtraction is deliberately simple and deterministic: if a perimeter segment midpoint falls inside that cone, the whole segment is marked removed by that opening. This gives stable draft arithmetic for regression tests without copying reference formulas or claiming verified normative behavior.

## SVG And Reports

SVG previews now include:

- slab boundary outline;
- active perimeter segments in teal;
- removed perimeter segments in dashed red;
- openings in orange/red;
- tangent rays in dashed gray;
- edge/corner/opening draft labels;
- stress overlay on the remaining active perimeter.

HTML and Markdown exports include `Boundary Effects` and `Openings` sections and the warning:

`Openings and boundary clipping are draft geometry only.`

## Draft Limitations

The following still require engineering verification before any `VERIFIED` support claim:

- SP63 edge and corner perimeter rules;
- normative opening influence criteria;
- partial segment subtraction rules;
- interaction of openings with moments;
- shear reinforcement contribution;
- round column support;
- verified resistance coefficients and combinations.

## Future Verified Workflow

Keep all new edge, corner and opening cases as `status: "draft"` until expected values are checked against a trusted source such as manual engineering calculation, verified Excel, WebCAD or a normative example.

When a trusted case is available:

1. Add the full input to the verification dataset.
2. Fill expected values from the trusted source, not from the draft engine.
3. Mark the source and checked date.
4. Keep the UI/report warnings until the relevant formula scope has verified coverage.
5. Run `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build`.
