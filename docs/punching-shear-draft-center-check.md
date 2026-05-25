# Punching Shear Draft Center Check

## What Is Implemented

The current engine implements the first clean-room draft check for punching shear:

- rectangular column;
- column in the middle of the slab;
- no openings;
- no slab edge clipping;
- no shear reinforcement;
- force-only check by `N`.

The draft calculation uses:

```text
v = N / (u * h0)
```

Where:

- `N` is design shear force, converted from kN to N;
- `u` is the draft geometric control perimeter in mm;
- `h0` is effective depth in mm;
- `v` is draft shear stress in MPa because `1 N/mm^2 = 1 MPa`.

## Limitations

This is not a final SP63 implementation. It is a draft architecture and arithmetic flow for the narrow center rectangular case.

The engine does not account for:

- `Mx` and `My` moments;
- shear reinforcement;
- openings;
- slab edges;
- corner columns;
- round columns;
- verified SP63 coefficients;
- verified material resistance values.

## Input Form

The first production-like input form is connected directly to `PunchingShearInput` through React Hook Form and the existing Zod schemas.

Available fields:

- calculation case: center rectangular column;
- loads: `N`, `Mx`, `My`;
- slab geometry: thickness, effective depth `h0`, concrete cover;
- column geometry: rectangular column width in X and height in Y;
- materials: concrete class `B15` to `B40`;
- shear reinforcement: enabled/disabled.

The edge, corner, opening and round-column cases are shown as coming soon and remain disabled in the form. Openings do not have UI yet.

Calculation is started manually with the draft calculate button. Field edits update form state and validation, but the engine is called only on submit or explicit reset to defaults.

Warnings remain visible because the current check is still a draft scope: moments, openings, slab edges and shear reinforcement are stored in input where applicable, but their calculation effects are not implemented in the engine yet.

## Not For Design Use

The UI and report must show:

```text
Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.
```

Current values are not suitable for structural design because formulas, coefficients, material values, rounding rules and benchmark examples are not yet independently verified against trusted SP63 sources.

## SP63 Verification Items

Before production use, verify:

- concrete tensile resistance values and coefficient handling;
- definition and placement of the control perimeter;
- effective depth rules;
- force and moment interaction;
- reinforcement contribution;
- opening influence rules;
- slab edge and corner behavior;
- rounding and reporting conventions.

## Next Steps

1. Verify concrete resistance.
2. Add moments `Mx/My`.
3. Add shear reinforcement.
4. Add openings.
5. Add edge/corner.
6. Add golden tests against trusted examples.
