# Verified Moment Transfer Workflow

This workflow prepares trusted validation for draft Mx/My moment transfer. It does not claim verified SP63 formulas and does not remove draft warnings.

## 1. Start From A Template

Use one of:

- `examples/verification/center-mx-verified-case.example.json`
- `examples/verification/center-my-verified-case.example.json`
- `examples/verification/center-mx-my-verified-case.example.json`

Keep `status: "draft"` while expected values are `null`. Replace `source: "TODO..."` only after a trusted source is available.

## 2. Check Mx And My Inputs

Record the force set exactly:

- axial force `N`;
- `Mx`;
- `My`;
- effective depth;
- column geometry;
- control perimeter used by the trusted source.

Do not compare moment transfer unless the trusted source uses the same geometry basis or documents the difference.

## 3. Verify Eccentricity

Record:

- `eccentricityX`;
- `eccentricityY`;
- `eccentricityToleranceMm`.

The current draft engine derives eccentricity from moment divided by axial force. A trusted workflow must document whether the source uses the same axis convention.

## 4. Verify Stress Redistribution

Record:

- `maxShearStressMpa`;
- `minShearStressMpa`;
- `stressPointCount`;
- `stressDistributionChecksum`;
- `transferFactorX`;
- `transferFactorY`;
- stress diagram metadata.

For WebCAD/manual/Excel, capture enough stress point data to reproduce the checksum or explain why only max/min values are trusted.

## 5. Stress Snapshot

Use the Stress Distribution Snapshot to review:

- SVG stress overlay;
- max/min labels;
- eccentricity marker;
- Mx/My arrows;
- stress points;
- transfer metadata;
- verification metadata;
- draft warnings.

The snapshot is review evidence only. Expected values must come from the trusted source.

## 6. Promote To Verified

Before setting `status: "verified"`:

1. Fill all scalar expected values.
2. Fill moment expected values and tolerances.
3. Add checked by, checked date and comparison notes.
4. Ensure `source` names a trusted manual, WebCAD, Excel or normative source.
5. Run `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build`.

The moment transfer warning remains until the verified formula scope is complete and intentionally promoted.
