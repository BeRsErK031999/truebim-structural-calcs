# Round Column Draft Geometry

This document describes the draft foundation for round column punching geometry.

## Scope

- `caseType: "round"` is available for center-position round columns only.
- `RoundColumnInput` captures `diameterMm`, `slabThickness`, `effectiveDepth`, `cover`, and `position`.
- `position: "edge"` and `position: "corner"` are accepted by the DTO but return `not_implemented`.
- No verified SP63 round-column support is claimed.

## Geometry

The draft control perimeter is generated as a circular approximation around the column center.

- draft offset: `h0 / 2`;
- segment count: 32;
- control radius: `diameterMm / 2 + offset`;
- perimeter: summed from generated segment lengths;
- SVG path: generated from the approximated circular vertices.

The warning `Round column perimeter is draft-only and requires SP63 verification.` must remain visible in UI, reports, and exports.

## Calculation

The center round draft check uses the existing draft scalar:

```text
v = N / (u * h0)
```

This formula remains draft-only. It is available to prepare geometry, UX, report export, and future verification templates.

## Report And UX

Round reports include a `Round Column Geometry` section with diameter, position, control perimeter, draft formula, warnings, and `draft-only` applicability.

The SVG preview shows the slab, round column, circular control perimeter approximation, diameter label, draft offset label, and contour label.

## Path To VERIFIED

Round support can only move beyond draft after trusted evidence is added:

- SP63 clause mapping for round columns;
- trusted manual/WebCAD/Excel/normative examples;
- expected values for perimeter, resistance, stress, utilization, and edge/corner applicability;
- verified fixtures with populated `expected` values;
- regression tests proving rectangular center verified behavior is unchanged.
