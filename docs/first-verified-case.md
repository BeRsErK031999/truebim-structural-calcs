# First verified center punching shear case

Date: 2026-05-26

## Input

| Field | Value |
| --- | --- |
| caseType | center |
| N | 420 kN |
| Mx | 0 kN*m |
| My | 0 kN*m |
| slab thickness | 220 mm |
| effective depth h0 | 190 mm |
| concrete cover | 30 mm |
| column width X | 400 mm |
| column width Y | 400 mm |
| concrete class | B25 |
| shear reinforcement | false |

## App result

| Field | Value |
| --- | --- |
| control perimeter u | 2360 mm |
| effective depth h0 | 190 mm |
| shear stress v | 0.936663693 MPa |
| utilization | 0.892060660 |
| passed | true |

The app report export keeps the draft warning and includes the formula, geometry,
calculationId, assumptions, unsupported draft features, and verification source
metadata.

## Manual result

Trusted source: manual calculation.

For a center rectangular column with a 400 mm by 400 mm column and h0 = 190 mm,
the current draft control perimeter is offset by h0 / 2 from each column face.

```text
u = 2 * ((400 + 190) + (400 + 190)) = 2360 mm
h0 = 190 mm
v = 420000 N / (2360 mm * 190 mm) = 0.936663693 MPa
utilization = 0.936663693 / 1.05 = 0.892060660
passed = true
```

WebCAD interactive verification was attempted at
https://webcad.pro/prod/prod_fma_v2.html, but the current automation path could
not operate the form. The case is therefore based on the manual trusted source.

## Comparison

| Field | App | Manual | Difference | Tolerance |
| --- | ---: | ---: | ---: | ---: |
| control perimeter u | 2360 mm | 2360 mm | 0 mm | max(0.1%, 0.000001) |
| effective depth h0 | 190 mm | 190 mm | 0 mm | max(0.1%, 0.000001) |
| shear stress v | 0.936663693 MPa | 0.936663693 MPa | 0 MPa | max(0.1%, 0.000001) |
| utilization | 0.892060660 | 0.892060660 | 0 | max(0.1%, 0.000001) |
| passed | true | true | match | exact |

## Decision

Status: verified.

This verifies the current center rectangular draft arithmetic only. It does not
remove the draft calculation warning and does not claim full SP63 design
coverage for moments, openings, slab edges, round columns, or shear
reinforcement.
