# Draft Wall Corner Punching Geometry

This milestone adds draft geometry preparation for punching shear at a wall corner.

## Scope

- New `wall-corner` case type.
- `WallCornerInput` DTO with independent X/Y wall lengths and wall thicknesses.
- Corner orientation support: `top-left`, `top-right`, `bottom-left`, `bottom-right`.
- Draft L-shaped wall support geometry.
- Draft L-shaped control perimeter geometry around the wall corner.
- SVG labels for slab, wall corner, active control perimeter, X/Y dimensions, and corner labels.
- Report and diagnostics visibility for wall-corner draft support.
- Verification template at `examples/verification/wall-corner-verified-case.example.json`.

## DTO

`WallCornerInput` fields:

- `wallLengthX`
- `wallLengthY`
- `wallThicknessX`
- `wallThicknessY`
- `slabThickness`
- `effectiveDepth`
- `cover`
- `orientation`

The geometry is intentionally ready for different X/Y arm dimensions. Slab thickness, effective depth, and cover are normalized from the common slab input, matching the existing wall-end DTO behavior.

## Draft Geometry Model

The local base model starts from an L-shaped wall corner in the `top-left` orientation. The X arm extends along the local X axis and the Y arm extends along the local Y axis. Orientation mirrors the generated vertices across X/Y axes for `top-right`, `bottom-left`, and `bottom-right`.

The active control perimeter is a draft L-shaped offset contour using `effectiveDepth / 2` as a geometry preparation offset. This is not an SP63 coefficient implementation.

## Verification Status

- Wall-corner remains `draft`.
- No verified SP63 wall-corner formulas are claimed.
- No auto-promotion to `VERIFIED` is performed.
- Center force-only verified behavior remains the only verified arithmetic scope.

## Next Steps To VERIFIED

1. Collect trusted SP63/manual/WebCAD/Excel wall-corner benchmark cases.
2. Fill expected geometry, perimeter, stress, utilization, and tolerance values.
3. Add clause-specific applicability and coefficient checks.
4. Add reviewed regression fixtures and acceptance criteria.
5. Promote only after trusted evidence passes without hiding draft warnings.
