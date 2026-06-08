# Mathcad punching shear benchmark comparison

This document compares the Mathcad/PDF benchmark for a center rectangular column
with the TrueBIM HTML report exported on 2026-06-05. It is an engineering gap
analysis only. It does not change formulas, does not promote any case to
VERIFIED, and does not remove draft warnings.

## Source files

- Mathcad/PDF benchmark: `KZh - Punching shear by column inside slab, SP63.13330.2018.pdf`
- Engineer notes: `2026.06.05_Punching.docx`
- TrueBIM report: `truebim_punching_shear_report_calc_1780652745917_0_8560049275733098.html`

## Extracted Mathcad/PDF values

| Group | Value |
| --- | --- |
| Materials | Concrete B30; shear reinforcement steel A240; `Rbt = 1.15 MPa`; `Rsw = 170 MPa` |
| Reinforcement bar | `ds = 6 mm` |
| Column/body dimensions | `a1 = 800 mm`; `b1 = 500 mm`; `h = 220 mm`; `h0 = 190 mm` |
| Raw actions | `Finf = 800 kN`; `Fsup = 0 kN`; `Mx.inf = 60 kN*m`; `Mx.sup = 0`; `My.inf = 50 kN*m`; `My.sup = 0` |
| Design actions used in checks | `F = 800 kN`; `Mx = 30 kN*m`; `My = 25 kN*m` |
| Control contour | `a = 990 mm`; `b = 690 mm`; `u = 3.36 m`; `Ab = 0.638 m2`; `Ix = 0.29 m3`; `Iy = 0.5 m3`; `Wx = 0.842 m2`; `Wy = 1.01 m2` |
| Concrete limits | `Fb.ult = 734.16 kN`; `Mx.b.ult = 183.933 kN*m`; `My.b.ult = 220.641 kN*m` |
| Shear reinforcement | `sw.1 = 65 mm`; `sw = 60 mm`; `nw = 2`; `Asw = 0.565 cm2`; `qsw = 160.221 kN/m`; `Fsw.ult = 430.675 kN` |
| Reinforced limits | `Fult = 1164.835 kN`; `Mx.ult = 291.833 kN*m`; `My.ult = 350.074 kN*m` |
| Checks | Without shear reinforcement: `1.366`; force cap without reinforcement: `1.635`; with shear reinforcement: `0.861`; outer contour: `0.626` |

## Extracted TrueBIM report values

| Group | Value |
| --- | --- |
| Case | `center`; status `draft_failed`; verification level `draft`; source `NOT VERIFIED` |
| Inputs | `N = 800 kN`; `Mx = 60 kN*m`; `My = 50 kN*m`; `h = 220 mm`; `h0 = 190 mm`; column width X `500 mm`; column height Y `800 mm`; concrete `B30` |
| Control contour | `u = 3360 mm`; bounding box width `690 mm`; bounding box height `990 mm`; segment count `4` |
| Draft stress check | `v = N / (u * h0) = 1.253 MPa`; draft resistance `1.150 MPa`; max draft moment stress `2.101 MPa`; min draft moment stress `0.406 MPa`; utilization `1.827` |
| Moment transfer | Draft method `draft-linear-perimeter-redistribution`; `ex = 62.500 mm`; `ey = 75.000 mm`; stress point count `12`; transfer factors are metadata only |
| Shear reinforcement | Disabled in the report; contribution and utilization with reinforcement are not evaluated |
| Report sections | Round, wall-end, and wall-corner sections are present as disabled/inactive summaries even though the case is `center` |
| Warnings | Draft calculation, moment transfer draft-only, openings/boundaries draft-only, wall/round draft warnings, shear reinforcement draft warning, no trusted verified evidence |

## Gap table

| Parameter | Mathcad/PDF | TrueBIM | Match | Reason | Fix |
| --- | --- | --- | --- | --- | --- |
| Case type | Center rectangular column inside slab | `center` | Yes | Same physical case. | Keep mapping. |
| Concrete | B30, `Rbt = 1.15 MPa` | B30, draft resistance `1.150 MPa` | Yes | Material resistance value matches this benchmark. | Keep draft warning until material table is verified. |
| Column dimensions | `a1 = 800 mm`, `b1 = 500 mm` | width X `500 mm`, height Y `800 mm` | Yes with labels clarified | Numeric values match, but the UI labels can be ambiguous for X/Y and major/minor dimensions. | Rename labels to width along X / smaller dimension and height along Y / larger dimension for this workflow. |
| Slab depth | `h = 220 mm`, `h0 = 190 mm` | `h = 220 mm`, `h0 = 190 mm`, cover `30 mm` | Yes, with UX issue | TrueBIM still asks for cover even when `h0` is supplied directly. | Hide or de-emphasize cover when direct `h0` input is active. |
| Control contour dimensions | `a = 990 mm`, `b = 690 mm` | bounding box height `990 mm`, width `690 mm` | Yes | Same contour, reported with X/Y orientation. | Add Mathcad-style contour labels in the report. |
| Control perimeter | `u = 3.36 m` | `u = 3360 mm` | Yes | Unit conversion only. | Report both `3.36 m` and `3360 mm` where useful. |
| Area | `Ab = 0.638 m2` | Not reported as `Ab`; implicitly `u*h0 = 638400 mm2` | Partial | Engine uses the area implicitly in stress calculation but does not expose the Mathcad variable. | Add explicit `Ab` to report calculations. |
| Moments used in checks | `Mx = 30 kN*m`, `My = 25 kN*m` | `Mx = 60 kN*m`, `My = 50 kN*m` | No | Mathcad halves the raw inf/sup moment difference or applies a design transformation before interaction checks; TrueBIM uses entered moments directly. | Add a load-combination/design-action step and label raw versus design moments. |
| Concrete-only limit | `Fb.ult = 734.16 kN` | Not reported; stress resistance `v/R` used instead | Partial | Values are equivalent for force-only capacity, but TrueBIM does not express the check as SP63 interaction capacities. | Add SP63 capacity outputs `Fb.ult`, `Mx.b.ult`, `My.b.ult`. |
| Moment capacities | `Mx.b.ult = 183.933 kN*m`, `My.b.ult = 220.641 kN*m` | Not calculated as limit moments | No | Current moment logic uses draft perimeter stress redistribution. | Implement separate SP63 interaction check for center rectangular columns. |
| Concrete-only utilization | `min(F/Fb.ult + Mx/Mx.b.ult + My/My.b.ult, 1.5*F/Fb.ult) = 1.366` | `vmax/R = 1.827` | No | Different method and different moments. TrueBIM uses maximum draft stress from direct `60/50` moments. | Use SP63 interaction formula with design moments, keep stress redistribution as draft trace until verified. |
| Force cap | `1.5 * F / Fb.ult = 1.635` | Not separately reported | No | TrueBIM does not evaluate the SP63 cap branch. | Add cap branch to concrete-only and reinforced checks. |
| Shear reinforcement input | `ds = 6 mm`, `A240`, `sw.1 = 65 mm`, `sw = 60 mm`, `nw = 2`, `Asw = 0.565 cm2` | Disabled in exported report | No | The current report case was exported without shear reinforcement enabled. | Allow benchmark input to enable shear reinforcement and report normalized `Asw`, `qsw`, row layout, and warnings. |
| Reinforced capacities | `Fult = 1164.835 kN`, `Mx.ult = 291.833 kN*m`, `My.ult = 350.074 kN*m` | Not calculated with SP63 reinforcement model | No | Current reinforcement model is draft axial-capacity addition only and does not implement SP63 interaction capacities. | Implement draft/verified-gated SP63 reinforcement capacity path. |
| Reinforced utilization | `0.861` | Not evaluated in report | No | Shear reinforcement is disabled in the report and the engine does not yet calculate this SP63 interaction check. | Add `utilizationWithReinforcement` for SP63 interaction, still draft until validated. |
| Outer contour check | `0.626` | Not evaluated | No | Current multiple contour support is draft-only and disabled in the report. | Add outer contour variables and comparison after reinforcement zone definition. |
| Status | Benchmark passes with shear reinforcement; concrete-only check fails | `draft_failed` | Expected mismatch | TrueBIM evaluated a different draft check with reinforcement disabled and untransformed moments. | Use this case as a candidate regression target, not as current verified evidence. |
| Verification level | Trusted Mathcad source candidate, not imported as verified | `draft` | Yes | No auto VERIFIED promotion occurred. | Keep candidate `status = draft` until engine fixes and engineer review pass. |
| Report structure | Mathcad order: inputs, reference data, calculations, formulas, substitutions, checks | Current report includes many generic/inactive sections and draft trace tables | Partial | Trace is useful, but inactive wall/round/opening sections distract from the selected case. | Generate case-specific report sections and add Mathcad-style formula/substitution blocks. |

## Root causes

1. TrueBIM uses the entered moments `60/50 kN*m` directly, while the benchmark checks use design moments `30/25 kN*m`.
2. TrueBIM reports a draft stress ratio `vmax / Rbt`; the benchmark uses SP63 interaction checks:
   `F/Fult + Mx/Mx.ult + My/My.ult` limited by `1.5 * F/Fult`.
3. The exported TrueBIM case has shear reinforcement disabled, while the benchmark includes A240 shear reinforcement.
4. Current shear reinforcement logic is explicitly draft-only and does not yet expose the benchmark variables `qsw`, `Fsw.ult`, reinforced moment capacities, or outer-contour checks.
5. The report generator renders inactive wall/round/wall-corner sections for a center-column case.

## Engine correction plan

1. Add a separate SP63 interaction-check model behind draft/verified gating. Do not replace the current draft stress trace until the new path has trusted tests.
2. Add explicit design action normalization: raw `Finf/Fsup/Mx.inf/Mx.sup/My.inf/My.sup` to checked `F/Mx/My`, with clear labels and trace rows.
3. For concrete-only center rectangular checks, calculate:
   - `Fb.ult = Rbt * Ab`
   - `Mx.b.ult = Rbt * Wx * h0`
   - `My.b.ult = Rbt * Wy * h0`
   - `utilizationConcrete = min(F/Fb.ult + Mx/Mx.b.ult + My/My.b.ult, 1.5 * F/Fb.ult)`
4. For shear-reinforced checks, calculate and report `Asw`, `qsw`, `Fsw.ult`, `Fult`, `Mx.ult`, `My.ult`, and:
   - `utilizationWithReinforcement = min(F/Fult + Mx/Mx.ult + My/My.ult, 1.5 * F/Fult)`
5. Add the outer-contour check after the reinforcement-zone geometry is modeled:
   `a'`, `b'`, `u'`, `Ab'`, `Wx'`, `Wy'`, `Fb.ult'`, `Mx.b.ult'`, `My.b.ult'`, `F'`, and `utilizationOuterContour`.
6. Keep `verifiedMode`, `verificationLevel`, `verifiedFeatures`, `draftFeatures`, warnings, and evidence IDs conservative until the benchmark passes under engineer review.

## UI and report correction plan

1. Reorder the form as: slab material, slab, shear reinforcement, column, loads.
2. Hide cover or mark it inactive when `h0` is entered directly.
3. Rename column and moment labels:
   - Column width: width along X, smaller dimension.
   - Column height: height along Y, larger dimension.
   - `Mx`: moment in the X-axis plane.
   - `My`: moment in the Y-axis plane.
4. Allow recalculation after editing existing values without forcing a full reset to defaults.
5. Add more explanatory labels for intermediate values.
6. Rebuild report ordering around the engineering calculation:
   inputs, reference data, calculations, punching contour, limit forces, shear reinforcement, contour check, outer-zone check, result.
7. Hide inactive sections for wall, wall-corner, round, and openings when they do not belong to the current case.

## Candidate fixture

The draft candidate fixture is stored at
`examples/verification/mathcad-center-column-with-reinforcement.example.json`.
It preserves the extracted Mathcad values and intentionally remains `status = draft`.
Current TrueBIM output is expected to mismatch this benchmark until the engine changes above are implemented.
