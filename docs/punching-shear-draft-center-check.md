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
- `v` is draft shear stress in MPa because `1 N/mm² = 1 MPa`.

## Limitations

This is not a final СП63 implementation. It is a draft architecture and arithmetic flow for the narrow center rectangular case.

The engine does not account for:

- `Mx` and `My` moments;
- shear reinforcement;
- openings;
- slab edges;
- corner columns;
- round columns;
- verified СП63 coefficients;
- verified material resistance values.

## Not For Design Use

The UI and report must show:

```text
Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.
```

Current values are not suitable for structural design because formulas, coefficients, material values, rounding rules and benchmark examples are not yet independently verified against trusted СП63 sources.

## СП63 Verification Items

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
