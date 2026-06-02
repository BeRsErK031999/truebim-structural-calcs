# Wall Punching Draft Geometry

This milestone adds draft geometry preparation for punching shear at a wall end.

## Current Support

- New `wall-end` case type.
- `WallInput` DTO with `wallLength`, `wallThickness`, `slabThickness`, `effectiveDepth`, and `cover`.
- Draft U-shaped control perimeter around one wall end.
- SVG preview with slab, wall, control perimeter, wall dimensions, contour dimensions, and `Draft wall punching geometry` label.
- Report export section named `Wall Geometry`.
- Diagnostics field `wall punching support: draft`.
- Verification template at `examples/verification/wall-end-verified-case.example.json`.

## Limitations

- This is geometry preparation only.
- No SP63 wall punching coefficients are implemented.
- No verified SP63 wall-end formulas are claimed.
- The wall-end capability stays `draft` and must not be promoted to `VERIFIED`.
- Moment transfer, openings near wall ends, reinforcement, and wall-corner punching remain outside verified scope.

## Future SP63 Validation

Before wall punching can become verified:

1. Collect trusted SP63 wall-end benchmark cases.
2. Fill expected geometry and stress values in verification fixtures.
3. Add golden tests for perimeter, stress, utilization, warnings, and report output.
4. Review formulas with an engineer and link evidence IDs.
5. Promote capability status only after trusted evidence passes automated validation.
