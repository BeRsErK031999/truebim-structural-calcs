# Punching Shear Engine Plan

## Created Modules

The clean-room scaffold for punching shear lives in `src/calculations/punching-shear`.

- `types.ts` defines the public DTOs for input, result, report model, control perimeter and check status.
- `schemas.ts` defines Zod validation for core input objects.
- `defaults.ts` provides `defaultPunchingShearInput` for a center rectangular column case.
- `units.ts` contains simple unit helpers and a normalization placeholder.
- `materials.ts` contains placeholder concrete material values for B15-B40.
- `engine.ts` validates input, normalizes it, selects material data, builds placeholder perimeter data and returns `not_implemented`.
- `report.ts` builds a structured report model from input and result.
- `geometry/perimeter.ts` contains the current control perimeter stub.
- `geometry/slabEdges.ts` and `geometry/openings.ts` reserve extension points for edge/corner/opening geometry.
- `reinforcement/shearReinforcement.ts` reserves the extension point for punching shear reinforcement contribution.
- `__tests__/punchingShear.test.ts` verifies validation, stub status, warnings and invalid dimensions.

## Why Result Is `not_implemented`

The engine now returns draft statuses for the narrow center rectangular force-only case. It still returns `not_implemented` for openings, edge, corner, round columns, and shear reinforcement. It exists to establish stable contracts between UI, validation, geometry, reporting and future calculation code. Engineering formulas, material values and reinforcement contribution are not yet verified against СП63.13330.

The result therefore returns:

- `status: "not_implemented"`;
- `utilization: null`;
- placeholder perimeter values;
- warnings that formulas are not implemented and values must not be used for design.

## Draft Center Check

The first draft check supports only:

- `caseType = "center"`;
- rectangular column;
- no openings;
- no slab edges;
- no shear reinforcement;
- force-only check by `N`.

The draft formula is `v = N / (u * h0)`, where `N` is converted from kN to N, `u` is the generated draft control perimeter in mm, and `h0` is the effective depth in mm. Since `1 N/mm² = 1 MPa`, the resulting draft stress is reported in MPa.

The warning `Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.` must remain visible in UI and reports until formulas and coefficients are independently verified.

## Next Steps For СП63 Implementation

1. Confirm normative scope and exact СП63.13330 revision.
2. Verify material tables and coefficients from primary нормативные sources.
3. Define internal units and rounding rules.
4. Implement center rectangular column control perimeter.
5. Implement section properties for the perimeter.
6. Implement concrete punching capacity.
7. Add moment contribution and normative caps.
8. Add slab edge and corner clipping.
9. Add opening influence using clean-room geometry primitives.
10. Add shear reinforcement contribution.
11. Build a traceable report model with formula references.
12. Add DOCX/PDF export adapters after report model is stable.

## Required Test Cases Before Production

- Center rectangular column without moments.
- Center rectangular column with `Mx` and `My`.
- Edge column for left, right, top and bottom slab edges.
- Corner column for all adjacent edge combinations.
- Invalid opposite-edge combinations.
- Round column.
- One opening near the column.
- Multiple openings with overlapping influence zones.
- Opening outside the influence distance.
- Shear reinforcement disabled.
- Shear reinforcement enabled with rows inside and outside the control zone.
- Unit conversion for mm/cm and kN/N.
- Invalid negative dimensions and invalid material classes.
- Report model consistency with calculation result.

## Why Current Values Cannot Be Used For Design

Current material values are placeholders and explicitly marked with `TODO: verify values against СП63.13330.` The control perimeter function returns placeholder values rather than engineering formulas. The engine does not calculate concrete capacity, moment capacity, opening reductions or reinforcement contribution.

Until the formulas are implemented, verified and covered by normative test cases, every numeric result from this module must be treated as a UI/architecture placeholder only.
