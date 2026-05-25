# Punching Shear Geometry Engine

## Purpose

The geometry layer provides clean-room primitives and preview-ready DTOs for future punching shear calculations. It intentionally does not implement final СП63 engineering formulas. The current center rectangular control perimeter is draft geometry only and is marked as unsuitable for design.

## Geometry Layer Architecture

Core primitives live in `src/calculations/punching-shear/domain`:

- `point.ts` defines `Point2D`, `BoundingBox`, distance and bounding-box helpers.
- `vector.ts` defines `Vector2D` helpers for future geometric operations.
- `segment.ts` defines `Segment2D`, segment length and closed loop segment creation.
- `polygon.ts` defines `Polygon2D`, perimeter, area, orientation and normalization.
- `contour.ts` defines `ContourLoop` as vertices, closed segments and bounding box.

These modules are pure TypeScript and do not depend on React, DOM, SVG, canvas or report generation.

## Control Perimeter Generation

`geometry/perimeter.ts` now generates a real geometric loop for the center rectangular column case:

1. Read rectangular column dimensions and slab effective depth.
2. Build a rectangular draft perimeter around the column.
3. Normalize polygon orientation.
4. Convert vertices into contour segments.
5. Calculate geometric perimeter from segment lengths.
6. Return vertices, segments, bounding box and an SVG path string.

The draft offset currently uses `effectiveDepthMm / 2` only as a geometry placeholder pending СП63 verification. It is not a validated design formula.

## SVG Rendering Pipeline

Sketch DTOs live in `src/calculations/punching-shear/sketch`:

- `svg.ts` defines SVG element DTOs and helpers such as `pointsToSvg` and `polygonToPath`.
- `viewport.ts` creates padded view boxes and serializes them to SVG `viewBox`.
- `punchingSketch.ts` builds a `PunchingSketchModel` from input and perimeter geometry.

The UI consumes only the `PunchingSketchModel`. It renders:

- grid background;
- slab preview extent;
- rectangular column;
- draft control perimeter;
- opening placeholders;
- labels and dimension lines.

This keeps SVG generation export-friendly: the same model can later feed PNG, PDF or DOCX export adapters without reading geometry from the DOM.

## Future Openings Subtraction Plan

Opening architecture stubs are prepared in:

- `geometry/openingProjection.ts`
- `geometry/tangent.ts`
- `geometry/contourSplit.ts`

Future implementation should:

1. Convert openings into geometry primitives.
2. Project opening influence to the control contour using clean-room tangent or polygon clipping logic.
3. Split contour segments at projection intersections.
4. Mark removed contour portions.
5. Recalculate perimeter and section properties from the remaining contour.

The current stubs return pending plans only and do not alter geometry.

## Edge And Corner Extension Strategy

Edge and corner support should extend the current pipeline rather than branch inside UI:

1. Build the base center contour.
2. Represent slab edges as clipping half-planes or boundary segments.
3. Clip contour loops against active slab boundaries.
4. Preserve segment provenance for reporting.
5. Reuse the same `ContourLoop`, `ControlPerimeterSegment` and `PunchingSketchModel` contracts.

Unsupported cases must continue to return explicit warnings until geometry and formulas are verified.

## Why Formulas Are Disabled

This layer is production-oriented geometry infrastructure, not a finished engineering calculator. Material values still contain verification TODOs, final СП63 capacity formulas are not implemented, and section property formulas for design checks are not complete.

Any numeric value from the current perimeter engine is draft geometry only. It may be used for UI preview, tests and architecture validation, but not for structural design.
