# TrueBIM Structural Calculations - Punching Shear Report

> DRAFT CALCULATION - NOT FOR DESIGN USE

This report is a draft calculation export. Verify against SP63 before any design use.

## Metadata

| Field | Value |
| --- | --- |
| calculationId | ps-center-20260526-120000-center-mx-draft |
| generatedAt | 2026-05-26T12:00:00.000+07:00 |
| app version | 0.0.0 |
| commit | 747efba |
| build time | 2026-05-26T07:40:17.761Z |
| calculation type | punching-shear |
| status | draft_failed |
| verification level | partial |
| Verification source | NOT VERIFIED |

## Input Data

| Field | Value |
| --- | --- |
| case type | center |
| N | 420 kN |
| Mx | 50 kN*m |
| My | 0 kN*m |
| slab thickness | 220 mm |
| effective depth | 190 mm |
| concrete cover | 30 mm |
| column width | 400 mm |
| column height | 400 mm |
| concrete class | B25 |
| shear reinforcement enabled | false |

## Geometry

| Field | Value |
| --- | --- |
| control perimeter | 2360 mm |
| effective depth | 190 mm |
| segment count | 4 |
| bounding box minX | -295 mm |
| bounding box minY | -295 mm |
| bounding box width | 590 mm |
| bounding box height | 590 mm |

## Boundary Effects

| Field | Value |
| --- | --- |
| edge affected | false |
| corner affected | false |
| removed perimeter | 0 mm |
| clipped perimeter | 2360 mm |

## Openings

| Field | Value |
| --- | --- |
| opening count | 0 |
| affected openings | none |
| removed segments | 0 |
| tangent geometry | 0 |

## Geometry Verification

| Field | Value |
| --- | --- |
| clipped perimeter | 2360 mm |
| removed perimeter | 0 mm |
| removed segments | 0 |
| tangent count | 0 |
| opening affected | false |
| boundary classification | center |

## Verification Readiness

| Field | Value |
| --- | --- |
| geometry draft-ready | true |
| stress draft-ready | true |
| verified arithmetic available | true |
| geometry verified | true |
| stress verified | true |
| moment transfer verified | false |

## Verification Capabilities

Verified:

- center-force-only

Draft:

- center-moment-transfer

## Verification Evidence

| Field | Value |
| --- | --- |
| case ID | source \| checkedBy \| checkedAt \| status |
| verified-center-rect-001 | Manual engineer calculation \| manual verification workflow \| 2026-05-26 \| verified |

### Segments

| Field | Value |
| --- | --- |
| id | kind \| start \| end \| length |
| center-rectangular-control-perimeter-1 | line \| (-295 mm, -295 mm) \| (295 mm, -295 mm) \| 590 mm |
| center-rectangular-control-perimeter-2 | line \| (295 mm, -295 mm) \| (295 mm, 295 mm) \| 590 mm |
| center-rectangular-control-perimeter-3 | line \| (295 mm, 295 mm) \| (-295 mm, 295 mm) \| 590 mm |
| center-rectangular-control-perimeter-4 | line \| (-295 mm, 295 mm) \| (-295 mm, -295 mm) \| 590 mm |

## Calculation Summary

| Field | Value |
| --- | --- |
| formula | v = N / (u * h0) |
| N | 420000 N |
| u | 2360 mm |
| h0 | 190 mm |
| v | 0.937 MPa |
| draft resistance | 1.050 MPa |
| utilization ratio | 1.612 (161.2%) |
| passed | false |

## Moment Transfer

| Field | Value |
| --- | --- |
| status | draft |
| Mx | 50 kN*m |
| My | 0 kN*m |
| eccentricity X | 0.000 mm |
| eccentricity Y | 119.048 mm |
| max stress | 1.693 MPa |
| min stress | 0.181 MPa |
| redistribution notes | DRAFT provisional linear perimeter redistribution; not SP63 verified |

- Moment transfer draft-only
- Verify against SP63
- Stress redistribution is not verified

## Moment Verification

| Field | Value |
| --- | --- |
| eccentricity X | 0.000 mm |
| eccentricity Y | 119.048 mm |
| transfer factor X | draft metadata only |
| transfer factor Y | draft metadata only |
| max stress | 1.693 MPa |
| min stress | 0.181 MPa |
| stress point count | 12 |
| stress distribution metadata | draft-linear-perimeter-redistribution |

## Stress Distribution

| Field | Value |
| --- | --- |
| status | draft |
| point count | 12 |
| segment count | 4 |
| base stress | 0.937 MPa |
| method | draft-linear-perimeter-redistribution |
| formulas verified | false |

## Stress Regression

| Field | Value |
| --- | --- |
| checksum | count=12;coords=295.000,-295.000\|0.000,-295.000\|-295.000,-295.000\|295.000,295.000\|295.000,0.000\|295.000,-295.000\|-295.000,295.000\|0.000,295.000\|295.000,295.000\|-295.000,-295.000\|-295.000,0.000\|-295.000,295.000;stress=center-rectangular-control-perimeter-1-end:0.180680\|center-rectangular-control-perimeter-1-mid:0.180680\|center-rectangular-control-perimeter-1-start:0.180680\|center-rectangular-control-perimeter-2-end:1.692647\|center-rectangular-control-perimeter-2-mid:0.936664\|center-rectangular-control-perimeter-2-start:0.180680\|center-rectangular-control-perimeter-3-end:1.692647\|center-rectangular-control-perimeter-3-mid:1.692647\|center-rectangular-control-perimeter-3-start:1.692647\|center-rectangular-control-perimeter-4-end:0.180680\|center-rectangular-control-perimeter-4-mid:0.936664\|center-rectangular-control-perimeter-4-start:1.692647 |
| drift detected | no expected baseline |
| expected vs actual | pending trusted stress evidence |
| tolerance | not applied until expected values are populated |
| regression status | draft-placeholder |

## Axis Convention

| Field | Value |
| --- | --- |
| X positive direction | right |
| Y positive direction | up |
| Mx sign convention | positive-mx-increases-positive-y-stress |
| My sign convention | positive-my-increases-positive-x-stress |

## Assumptions

- Center, edge, corner, and opening geometry are draft-only where provided
- Openings use draft tangent subtraction geometry
- Slab edges use draft control perimeter clipping geometry
- No shear reinforcement contribution
- Moments use draft redistribution where provided
- Draft concrete resistance values
- Draft perimeter geometry

## Unsupported in this draft

- verified openings formulas
- verified edge column formulas
- verified corner column formulas
- round columns
- shear reinforcement contribution
- verified moment transfer
- verified SP63 coefficients

## Warnings

- DRAFT CALCULATION - NOT FOR DESIGN USE
- Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.
- Moment transfer uses draft-only stress redistribution when Mx/My are provided
- Openings and boundary clipping are draft geometry only
- Shear reinforcement is not included in this draft
- Draft formula must be verified before design use
- Control perimeter geometry is draft-only; engineering formulas are intentionally disabled
- Draft offset uses effectiveDepthMm / 2 as a geometry placeholder pending SP63 verification
- Moment transfer is DRAFT-only and not verified for design use
- Verify moment transfer formulas against SP63 before design use
- Stress redistribution is provisional and not verified
- Partially verified calculation: only listed verified features have trusted evidence.
- Center moment transfer remains provisional until a trusted moment verification case passes.
- Moment transfer is draft-only where Mx/My are provided
- Openings and boundary clipping are draft geometry only.
- Shear reinforcement is unsupported in this draft
- Verify against SP63 before design use

## Verification Status

- Verification source: NOT VERIFIED
- verification level: partial
- verified features: center-force-only
- draft features: center-moment-transfer
- This report can be used to create a verified case only after checking with manual calculation, WebCAD, Excel, or another trusted source.

## Source Report Notes

- DRAFT / NOT FOR DESIGN USE.
- Input schema validation completed.
- Units normalized into the current internal DTO shape.
- Draft material resistance selected.
- Control perimeter draft geometry generated.
- SVG sketch model generated from geometry DTOs.
- Draft moment-transfer stress distribution generated where Mx/My are present.
- Draft rectangular force-only check evaluated where supported.
- Draft openings and slab edge clipping geometry generated where provided.
- Shear reinforcement intentionally skipped.
