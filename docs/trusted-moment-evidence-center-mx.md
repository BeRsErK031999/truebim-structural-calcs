# Trusted Moment Evidence: Center + Mx

## Status

Status: partial / trusted values unavailable.

The target case was reviewed for first trusted center moment evidence, but no trusted source with matching values was available in this pass. The center moment transfer capability must remain PARTIALLY VERIFIED, and all moment expected values for this case remain null.

## Target Input

| Field | Value |
| --- | --- |
| caseType | center |
| N | 420 kN |
| Mx | 50 kN*m |
| My | 0 kN*m |
| slab thickness | 220 mm |
| effective depth | 190 mm |
| concrete cover | 30 mm |
| concrete class | B25 |
| column | 400 mm x 400 mm |
| openings | none |
| shear reinforcement | disabled |

## Trusted Source Collection

| Candidate source | Result |
| --- | --- |
| WebCAD | No accessible export or screenshot with this exact N/Mx/My and geometry was available in the automation session. |
| Manual engineer calculation | Not available for independent trusted comparison in this pass. |
| Verified Excel | Not available for independent trusted comparison in this pass. |
| Normative source | General eccentric punching shear references were found, but no worked SP63 example with this exact input and expected stress values was found. |

Reference search notes:

- Calctree has an ACI 318-19 two-way shear stress with moment transfer template description, but it is not an SP63 trusted result for this case and no matching output values were obtained.
- Public references for eccentric punching shear describe linear/non-uniform stress distribution and beta/eccentricity approaches, but they do not provide trusted expected values for N = 420 kN, Mx = 50 kN*m, My = 0 with a 400 mm x 400 mm center column.

## Current Application Output

These values are recorded only as current draft app output, not trusted expected values.

| Field | Draft app value |
| --- | --- |
| max stress | 1.6926473034064622 MPa |
| min stress | 0.1806800828558037 MPa |
| eccentricityX | 0 mm |
| eccentricityY | 119.04761904761904 mm |
| transferFactorX | 0.00002298190175237001 |
| transferFactorY | 0.00002298190175237001 |
| stress point count | 12 |
| stress distribution checksum | count=12;coords=295.000,-295.000\|0.000,-295.000\|-295.000,-295.000\|295.000,295.000\|295.000,0.000\|295.000,-295.000\|-295.000,295.000\|0.000,295.000\|295.000,295.000\|-295.000,-295.000\|-295.000,0.000\|-295.000,295.000;stress=center-rectangular-control-perimeter-1-end:0.180680\|center-rectangular-control-perimeter-1-mid:0.180680\|center-rectangular-control-perimeter-1-start:0.180680\|center-rectangular-control-perimeter-2-end:1.692647\|center-rectangular-control-perimeter-2-mid:0.936664\|center-rectangular-control-perimeter-2-start:0.180680\|center-rectangular-control-perimeter-3-end:1.692647\|center-rectangular-control-perimeter-3-mid:1.692647\|center-rectangular-control-perimeter-3-start:1.692647\|center-rectangular-control-perimeter-4-end:0.180680\|center-rectangular-control-perimeter-4-mid:0.936664\|center-rectangular-control-perimeter-4-start:1.692647 |

## Axis And Sign Convention

| Field | Convention |
| --- | --- |
| traversal | counterclockwise |
| x positive direction | right |
| y positive direction | up |
| Mx sign convention | positive-mx-increases-positive-y-stress |
| My sign convention | positive-my-increases-positive-x-stress |

## Promotion Decision

Promotion blocked.

- Trusted source exists: no.
- Expected values confirmed: no.
- Tolerance passes: not applicable.
- Checksum stable: current draft checksum is deterministic, but cannot be trusted evidence without source confirmation.
- Axis conventions confirmed against trusted source: no.
- Drift: no unexplained drift was detected by the current draft snapshot, but this is not sufficient for verified promotion.

`examples/verification/moments/mx-low-eccentricity.json` remains draft with nullable expected values.
