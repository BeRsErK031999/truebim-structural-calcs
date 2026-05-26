# Moment Transfer Draft

## Architecture

Draft moment support is isolated under `src/calculations/punching-shear/moments/`.

- `eccentricity.ts` converts input `Mx/My` into draft eccentricities.
- `polarInertia.ts` derives provisional perimeter radii from control-perimeter geometry.
- `transferFactors.ts` exposes draft factors used by the redistribution layer.
- `stressDistribution.ts` generates perimeter stress points and segment stress metadata.
- `momentTransfer.ts` orchestrates the draft flow and returns `MomentTransferResult`.
- `momentWarnings.ts` keeps the draft-only warning copy in one place.

The main punching shear engine still owns validation, material lookup, base shear stress and utilization. The moment layer only receives normalized forces, control perimeter geometry and base stress.

## Assumptions

The current implementation is deliberately provisional:

- rectangular center-column geometry only;
- moments are represented through draft eccentricities;
- stress redistribution is linear around the generated control perimeter;
- no final SP63 coefficients or moment-transfer formulas are implemented;
- the governing draft stress is the maximum generated perimeter stress when Mx or My is nonzero.

For zero moments, the existing center rectangular verified arithmetic remains unchanged.

## Current Status

This is DRAFT support only. It exists to prepare the architecture, DTOs, SVG/report plumbing and verification workflow before normative formulas are introduced.

The app emits explicit warnings:

- moment transfer is draft-only;
- formulas must be verified against SP63;
- stress redistribution is not verified.

## Why Formulas Are Not Verified Yet

No clean-room engineering validation source has been attached for moment transfer. Until a manual calculation, verified Excel, WebCAD output or normative example is captured, the code must not claim SP63 verified behavior.

The draft cases in the verification dataset freeze current internal arithmetic only. They are regression checks, not design validation.

## Required Engineering Validation

Before moment transfer can become VERIFIED:

1. Select representative center cases with Mx, My and combined Mx/My.
2. Calculate expected values from a trusted engineering source.
3. Capture source, checked-by, checked-at and comparison notes.
4. Replace draft expected values only after review.
5. Keep warnings visible until verified coverage is sufficient.

## Future Edge, Corner And Openings Extensions

The moment layer consumes perimeter segments and stress points, so it is prepared for non-rectangular contours. Future work should extend the geometry engine first:

- edge and corner control perimeter clipping;
- opening projection and subtraction;
- segment classification for omitted contour parts;
- centroid and inertia calculation for irregular contours;
- stress labels and heat segments on split/open contours.
