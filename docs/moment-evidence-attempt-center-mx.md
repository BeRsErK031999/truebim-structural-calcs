# Center + Mx Moment Evidence Attempt

## Status

Current status: draft / pending trusted validation.

This attempt records the current application output for the first center + Mx trusted moment evidence pass. No trusted source values were obtained, so this case remains draft and expected values stay null.

## Input

| Field | Value |
| --- | --- |
| caseType | center |
| N | 420 kN |
| Mx | 50 kN*m |
| My | 0 kN*m |
| slab thickness | 220 mm |
| effective depth | 190 mm |
| concrete cover | 30 mm |
| column width | 400 mm |
| column height | 400 mm |
| concrete class | B25 |
| shear reinforcement | false |

## App Output

| Field | Value |
| --- | --- |
| calculationId | ps-center-20260526-120000-center-mx-draft |
| maxShearStressMpa | 1.6926473034064622 |
| minShearStressMpa | 0.1806800828558037 |
| eccentricityX | 0 |
| eccentricityY | 119.04761904761904 |
| transferFactorX | 0.00002298190175237001 |
| transferFactorY | 0.00002298190175237001 |
| stressPointCount | 12 |
| stressDistributionChecksum | count=12;coords=295.000,-295.000\|0.000,-295.000\|-295.000,-295.000\|295.000,295.000\|295.000,0.000\|295.000,-295.000\|-295.000,295.000\|0.000,295.000\|295.000,295.000\|-295.000,-295.000\|-295.000,0.000\|-295.000,295.000;stress=center-rectangular-control-perimeter-1-end:0.180680\|center-rectangular-control-perimeter-1-mid:0.180680\|center-rectangular-control-perimeter-1-start:0.180680\|center-rectangular-control-perimeter-2-end:1.692647\|center-rectangular-control-perimeter-2-mid:0.936664\|center-rectangular-control-perimeter-2-start:0.180680\|center-rectangular-control-perimeter-3-end:1.692647\|center-rectangular-control-perimeter-3-mid:1.692647\|center-rectangular-control-perimeter-3-start:1.692647\|center-rectangular-control-perimeter-4-end:0.180680\|center-rectangular-control-perimeter-4-mid:0.936664\|center-rectangular-control-perimeter-4-start:1.692647 |
| verificationLevel | partial |

Warnings:

- Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.
- Moment transfer uses draft-only stress redistribution when Mx/My are provided.
- Openings and boundary clipping are draft geometry only.
- Shear reinforcement is not included in this draft.
- Draft formula must be verified before design use.
- Control perimeter geometry is draft-only; engineering formulas are intentionally disabled.
- Draft offset uses effectiveDepthMm / 2 as a geometry placeholder pending SP63 verification.
- Moment transfer is DRAFT-only and not verified for design use.
- Verify moment transfer formulas against SP63 before design use.
- Stress redistribution is provisional and not verified.
- Partially verified calculation: only listed verified features have trusted evidence.
- Center moment transfer remains provisional until a trusted moment verification case passes.

## Exported Files

| Export | Filename |
| --- | --- |
| HTML report | docs/evidence/center-mx/truebim-punching-shear-report-ps-center-20260526-120000-center-mx-draft.html |
| Markdown report | docs/evidence/center-mx/truebim-punching-shear-report-ps-center-20260526-120000-center-mx-draft.md |
| Stress snapshot | docs/evidence/center-mx/stress-snapshot-moment-evidence-mx-low-eccentricity-20260526.html |

## Axis Convention

| Field | Value |
| --- | --- |
| traversal | counterclockwise |
| xPositiveDirection | right |
| yPositiveDirection | up |
| momentXSignConvention | positive-mx-increases-positive-y-stress |
| momentYSignConvention | positive-my-increases-positive-x-stress |

## Trusted Source Check

Trusted source was not available for this attempt.

- WebCAD: not manually accessible through the available automation session.
- Manual engineer calculation: not available in this pass.
- Verified Excel: not available in this pass.
- Normative example: not available in this pass.

Expected values remain null. No verified claim is made for center-moment-transfer.

## Notes

The app host `http://192.168.22.37/` responded with HTTP 200 during the attempt. Report files were generated from the same application calculation and report builders for the specified input because browser automation for manual UI interaction was unavailable in this session.
