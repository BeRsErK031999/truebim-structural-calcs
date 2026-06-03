# Pilot Validation Campaign

Purpose: use the existing TrueBIM punching shear application as an engineering test stand for pilot validation. This campaign does not add features, does not change formulas, does not change verification logic, and does not change the capability matrix.

Execution date: 2026-06-03.

## Test Matrix

| Scenario | Generated cases | Coverage intent |
| --- | ---: | --- |
| center | 10 | Rectangular center column, force-only realistic ranges. |
| center-moments | 10 | Rectangular center column with Mx/My draft redistribution active. |
| edge | 10 | Rectangular column near one slab edge with boundary clipping active. |
| corner | 10 | Rectangular column near two slab edges with corner clipping active. |
| opening | 10 | Rectangular column with nearby openings and tangent subtraction active. |
| wall-end | 10 | Wall-end support draft geometry. |
| wall-corner | 10 | Wall-corner support draft geometry. |
| round | 10 | Round center column draft geometry. |
| reinforcement | 10 | Shear reinforcement draft contribution active. |
| multiple-contours | 10 | Draft multiple control contours and critical contour selection active. |

## Execution Invariants

- No crashes during calculation, report, review, candidate, or validation session creation.
- No NaN or infinite values in input, output, or report model.
- SVG sketch model generated.
- Markdown and HTML report generated.
- Calculation trace generated.
- Review session can be created and frozen.
- Verification candidate can be created from the review workflow.
- Validation session package can be created.

## Generated Cases

| Case ID | Scenario | Purpose | Input summary |
| --- | --- | --- | --- |
| center-01 | center | Force-only rectangular center column. | case=center; N=320kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| center-02 | center | Force-only rectangular center column. | case=center; N=365kN; Mx=0kNm; My=0kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| center-03 | center | Force-only rectangular center column. | case=center; N=410kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| center-04 | center | Force-only rectangular center column. | case=center; N=455kN; Mx=0kNm; My=0kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| center-05 | center | Force-only rectangular center column. | case=center; N=500kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| center-06 | center | Force-only rectangular center column. | case=center; N=545kN; Mx=0kNm; My=0kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| center-07 | center | Force-only rectangular center column. | case=center; N=590kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| center-08 | center | Force-only rectangular center column. | case=center; N=635kN; Mx=0kNm; My=0kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| center-09 | center | Force-only rectangular center column. | case=center; N=680kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| center-10 | center | Force-only rectangular center column. | case=center; N=725kN; Mx=0kNm; My=0kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| center-moments-01 | center-moments | Center column with draft moment transfer. | case=center; N=380kN; Mx=18kNm; My=10kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| center-moments-02 | center-moments | Center column with draft moment transfer. | case=center; N=430kN; Mx=22kNm; My=13kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| center-moments-03 | center-moments | Center column with draft moment transfer. | case=center; N=480kN; Mx=26kNm; My=16kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| center-moments-04 | center-moments | Center column with draft moment transfer. | case=center; N=530kN; Mx=30kNm; My=19kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| center-moments-05 | center-moments | Center column with draft moment transfer. | case=center; N=580kN; Mx=34kNm; My=22kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| center-moments-06 | center-moments | Center column with draft moment transfer. | case=center; N=630kN; Mx=38kNm; My=25kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| center-moments-07 | center-moments | Center column with draft moment transfer. | case=center; N=680kN; Mx=42kNm; My=28kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| center-moments-08 | center-moments | Center column with draft moment transfer. | case=center; N=730kN; Mx=46kNm; My=31kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| center-moments-09 | center-moments | Center column with draft moment transfer. | case=center; N=780kN; Mx=50kNm; My=34kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| center-moments-10 | center-moments | Center column with draft moment transfer. | case=center; N=830kN; Mx=54kNm; My=37kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| edge-01 | edge | Single-edge boundary clipping. | case=edge; N=320kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| edge-02 | edge | Single-edge boundary clipping. | case=edge; N=365kN; Mx=0kNm; My=0kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| edge-03 | edge | Single-edge boundary clipping. | case=edge; N=410kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| edge-04 | edge | Single-edge boundary clipping. | case=edge; N=455kN; Mx=0kNm; My=0kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| edge-05 | edge | Single-edge boundary clipping. | case=edge; N=500kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| edge-06 | edge | Single-edge boundary clipping. | case=edge; N=545kN; Mx=0kNm; My=0kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| edge-07 | edge | Single-edge boundary clipping. | case=edge; N=590kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| edge-08 | edge | Single-edge boundary clipping. | case=edge; N=635kN; Mx=0kNm; My=0kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| edge-09 | edge | Single-edge boundary clipping. | case=edge; N=680kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| edge-10 | edge | Single-edge boundary clipping. | case=edge; N=725kN; Mx=0kNm; My=0kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| corner-01 | corner | Two-edge corner boundary clipping. | case=corner; N=320kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| corner-02 | corner | Two-edge corner boundary clipping. | case=corner; N=365kN; Mx=0kNm; My=0kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| corner-03 | corner | Two-edge corner boundary clipping. | case=corner; N=410kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| corner-04 | corner | Two-edge corner boundary clipping. | case=corner; N=455kN; Mx=0kNm; My=0kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| corner-05 | corner | Two-edge corner boundary clipping. | case=corner; N=500kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| corner-06 | corner | Two-edge corner boundary clipping. | case=corner; N=545kN; Mx=0kNm; My=0kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| corner-07 | corner | Two-edge corner boundary clipping. | case=corner; N=590kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| corner-08 | corner | Two-edge corner boundary clipping. | case=corner; N=635kN; Mx=0kNm; My=0kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| corner-09 | corner | Two-edge corner boundary clipping. | case=corner; N=680kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| corner-10 | corner | Two-edge corner boundary clipping. | case=corner; N=725kN; Mx=0kNm; My=0kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| opening-01 | opening | Nearby slab opening tangent subtraction. | case=opening; N=320kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=2; reinforcement=false; multiContours=false |
| opening-02 | opening | Nearby slab opening tangent subtraction. | case=opening; N=365kN; Mx=0kNm; My=0kNm; h=210mm; h0=180mm; concrete=B25; openings=1; reinforcement=false; multiContours=false |
| opening-03 | opening | Nearby slab opening tangent subtraction. | case=opening; N=410kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=1; reinforcement=false; multiContours=false |
| opening-04 | opening | Nearby slab opening tangent subtraction. | case=opening; N=455kN; Mx=0kNm; My=0kNm; h=230mm; h0=200mm; concrete=B35; openings=2; reinforcement=false; multiContours=false |
| opening-05 | opening | Nearby slab opening tangent subtraction. | case=opening; N=500kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=1; reinforcement=false; multiContours=false |
| opening-06 | opening | Nearby slab opening tangent subtraction. | case=opening; N=545kN; Mx=0kNm; My=0kNm; h=250mm; h0=220mm; concrete=B20; openings=1; reinforcement=false; multiContours=false |
| opening-07 | opening | Nearby slab opening tangent subtraction. | case=opening; N=590kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=2; reinforcement=false; multiContours=false |
| opening-08 | opening | Nearby slab opening tangent subtraction. | case=opening; N=635kN; Mx=0kNm; My=0kNm; h=270mm; h0=240mm; concrete=B30; openings=1; reinforcement=false; multiContours=false |
| opening-09 | opening | Nearby slab opening tangent subtraction. | case=opening; N=680kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=1; reinforcement=false; multiContours=false |
| opening-10 | opening | Nearby slab opening tangent subtraction. | case=opening; N=725kN; Mx=0kNm; My=0kNm; h=290mm; h0=260mm; concrete=B40; openings=2; reinforcement=false; multiContours=false |
| wall-end-01 | wall-end | Wall-end draft support geometry. | case=wall-end; N=320kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| wall-end-02 | wall-end | Wall-end draft support geometry. | case=wall-end; N=365kN; Mx=0kNm; My=0kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| wall-end-03 | wall-end | Wall-end draft support geometry. | case=wall-end; N=410kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| wall-end-04 | wall-end | Wall-end draft support geometry. | case=wall-end; N=455kN; Mx=0kNm; My=0kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| wall-end-05 | wall-end | Wall-end draft support geometry. | case=wall-end; N=500kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| wall-end-06 | wall-end | Wall-end draft support geometry. | case=wall-end; N=545kN; Mx=0kNm; My=0kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| wall-end-07 | wall-end | Wall-end draft support geometry. | case=wall-end; N=590kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| wall-end-08 | wall-end | Wall-end draft support geometry. | case=wall-end; N=635kN; Mx=0kNm; My=0kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| wall-end-09 | wall-end | Wall-end draft support geometry. | case=wall-end; N=680kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| wall-end-10 | wall-end | Wall-end draft support geometry. | case=wall-end; N=725kN; Mx=0kNm; My=0kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| wall-corner-01 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=320kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| wall-corner-02 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=365kN; Mx=0kNm; My=0kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| wall-corner-03 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=410kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| wall-corner-04 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=455kN; Mx=0kNm; My=0kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| wall-corner-05 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=500kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| wall-corner-06 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=545kN; Mx=0kNm; My=0kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| wall-corner-07 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=590kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| wall-corner-08 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=635kN; Mx=0kNm; My=0kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| wall-corner-09 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=680kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| wall-corner-10 | wall-corner | Wall-corner draft support geometry. | case=wall-corner; N=725kN; Mx=0kNm; My=0kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| round-01 | round | Round center column draft geometry. | case=round; N=320kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| round-02 | round | Round center column draft geometry. | case=round; N=365kN; Mx=0kNm; My=0kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| round-03 | round | Round center column draft geometry. | case=round; N=410kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| round-04 | round | Round center column draft geometry. | case=round; N=455kN; Mx=0kNm; My=0kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| round-05 | round | Round center column draft geometry. | case=round; N=500kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| round-06 | round | Round center column draft geometry. | case=round; N=545kN; Mx=0kNm; My=0kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=false |
| round-07 | round | Round center column draft geometry. | case=round; N=590kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=false |
| round-08 | round | Round center column draft geometry. | case=round; N=635kN; Mx=0kNm; My=0kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=false |
| round-09 | round | Round center column draft geometry. | case=round; N=680kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=false |
| round-10 | round | Round center column draft geometry. | case=round; N=725kN; Mx=0kNm; My=0kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=false |
| reinforcement-01 | reinforcement | Draft shear reinforcement contribution. | case=center; N=520kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=true; multiContours=false |
| reinforcement-02 | reinforcement | Draft shear reinforcement contribution. | case=center; N=590kN; Mx=22kNm; My=14kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=true; multiContours=false |
| reinforcement-03 | reinforcement | Draft shear reinforcement contribution. | case=center; N=660kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=true; multiContours=false |
| reinforcement-04 | reinforcement | Draft shear reinforcement contribution. | case=center; N=730kN; Mx=26kNm; My=18kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=true; multiContours=false |
| reinforcement-05 | reinforcement | Draft shear reinforcement contribution. | case=center; N=800kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=true; multiContours=false |
| reinforcement-06 | reinforcement | Draft shear reinforcement contribution. | case=center; N=870kN; Mx=30kNm; My=22kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=true; multiContours=false |
| reinforcement-07 | reinforcement | Draft shear reinforcement contribution. | case=center; N=940kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=true; multiContours=false |
| reinforcement-08 | reinforcement | Draft shear reinforcement contribution. | case=center; N=1010kN; Mx=34kNm; My=26kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=true; multiContours=false |
| reinforcement-09 | reinforcement | Draft shear reinforcement contribution. | case=center; N=1080kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=true; multiContours=false |
| reinforcement-10 | reinforcement | Draft shear reinforcement contribution. | case=center; N=1150kN; Mx=38kNm; My=30kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=true; multiContours=false |
| multiple-contours-01 | multiple-contours | Draft multiple control contour selection. | case=center; N=420kN; Mx=0kNm; My=0kNm; h=200mm; h0=170mm; concrete=B20; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-02 | multiple-contours | Draft multiple control contour selection. | case=center; N=480kN; Mx=19kNm; My=16kNm; h=210mm; h0=180mm; concrete=B25; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-03 | multiple-contours | Draft multiple control contour selection. | case=center; N=540kN; Mx=0kNm; My=0kNm; h=220mm; h0=190mm; concrete=B30; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-04 | multiple-contours | Draft multiple control contour selection. | case=center; N=600kN; Mx=25kNm; My=20kNm; h=230mm; h0=200mm; concrete=B35; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-05 | multiple-contours | Draft multiple control contour selection. | case=center; N=660kN; Mx=0kNm; My=0kNm; h=240mm; h0=210mm; concrete=B40; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-06 | multiple-contours | Draft multiple control contour selection. | case=center; N=720kN; Mx=31kNm; My=24kNm; h=250mm; h0=220mm; concrete=B20; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-07 | multiple-contours | Draft multiple control contour selection. | case=center; N=780kN; Mx=0kNm; My=0kNm; h=260mm; h0=230mm; concrete=B25; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-08 | multiple-contours | Draft multiple control contour selection. | case=center; N=840kN; Mx=37kNm; My=28kNm; h=270mm; h0=240mm; concrete=B30; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-09 | multiple-contours | Draft multiple control contour selection. | case=center; N=900kN; Mx=0kNm; My=0kNm; h=280mm; h0=250mm; concrete=B35; openings=0; reinforcement=false; multiContours=true |
| multiple-contours-10 | multiple-contours | Draft multiple control contour selection. | case=center; N=960kN; Mx=43kNm; My=32kNm; h=290mm; h0=260mm; concrete=B40; openings=0; reinforcement=false; multiContours=true |
