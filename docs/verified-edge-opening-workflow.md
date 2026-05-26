# Verified Edge and Opening Workflow

This workflow turns draft edge, corner and opening geometry into trusted verification cases. It does not change the calculation engine and does not claim production SP63 support.

## 1. Prepare The Case

Start from one of:

- `examples/verification/edge-verified-case.example.json`
- `examples/verification/corner-verified-case.example.json`
- `examples/verification/opening-verified-case.example.json`

Keep `status: "draft"` while any expected value is `null`. Replace `source: "TODO..."` only after a trusted source is available: manual engineering calculation, WebCAD output, verified Excel or normative example.

## 2. Edge Geometry Check

For edge cases, record the slab boundary distance from the column center and the active control perimeter after clipping.

Required values:

- `clippedPerimeterMm`
- `removedPerimeterMm`
- `removedSegmentCount`
- `edgeAffected`
- `cornerAffected`
- final `controlPerimeterMm`

The trusted source must make clear which boundary line was used and which perimeter portions were removed.

## 3. Corner Geometry Check

For corner cases, record both slab boundary distances and confirm that the case is classified as a corner.

Required values:

- `clippedPerimeterMm`
- `removedPerimeterMm`
- `removedSegmentCount`
- `edgeAffected = true`
- `cornerAffected = true`
- final `controlPerimeterMm`

Check the removed perimeter against both boundaries, not only the final scalar perimeter.

## 4. Opening Tangent Subtraction Check

For openings, record the opening rectangle, tangent geometry and affected perimeter portions.

Required values:

- `openingAffected`
- `tangentCount`
- `removedSegmentCount`
- `removedPerimeterMm`
- `clippedPerimeterMm`
- final active `controlPerimeterMm`

The comparison should include tangent endpoints or enough metadata to reconstruct the tangent rays. The current draft engine removes whole segments by tangent cone; verified support may later require partial segment subtraction, so keep the trusted source notes explicit.

## 5. Verification Snapshot

Use the Verification Snapshot export to review one case visually. The snapshot includes:

- active perimeter;
- removed perimeter;
- openings;
- tangent lines;
- stress overlay where present;
- verification metadata;
- draft warnings.

The snapshot is review evidence. It is not a source of trusted expected values by itself.

## 6. Promote To Verified

Only promote a case after all expected values are filled from the trusted source:

- scalar calculation values: `controlPerimeterMm`, `effectiveDepthMm`, `shearStressMpa`, `utilizationRatio`, `passed`;
- geometry values: `clippedPerimeterMm`, `removedPerimeterMm`, `removedSegmentCount`, `tangentCount`;
- flags: `openingAffected`, `edgeAffected`, `cornerAffected`;
- tolerances: `geometryToleranceMm`, `stressTolerancePercent`;
- metadata: checked by, checked date, comparison notes and trusted source.

Then run:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

The draft warning remains until the relevant SP63 formula scope has verified coverage.
