# Report export

Report export lets a user download the current punching shear draft calculation as a human-readable file. The intended workflow is to send the report to an engineer, a review chat, or another trusted checker, then use the checked values as evidence when creating a verified case.

## Formats

Available formats:

- HTML report: `truebim-punching-shear-report-{calculationId}.html`
- Markdown report: `truebim-punching-shear-report-{calculationId}.md`

Both files are generated in the browser and downloaded through the browser download flow.

## Report structure

The exported report contains metadata, input data, geometry, segment data, inline SVG preview, calculation summary, assumptions, unsupported draft features, warnings, verification status and source report notes.

Value cells include units directly in the value, for example `420 kN`, `2360 mm`, `0.937 MPa` and `420000 N`. Utilization is shown as a ratio and percent, for example `0.892 (89.2%)`.

## Calculation ID

Each export receives a calculation ID in this format:

`ps-center-{yyyymmdd}-{hhmmss}-{commit}`

Example:

`ps-center-20260526-041754-d576a71`

The same ID is written into the report metadata and exported filename. Engineers should include this ID in review notes, external calculation files and verified case evidence.

## Verification source lifecycle

Current draft reports use `Verification source: NOT VERIFIED`.

Future reviewed reports can use `WebCAD checked`, `Manual engineer calculation`, `Verified Excel` or `Normative example`. Changing this field does not by itself make a case verified; the verified JSON must also contain trusted expected values, reviewer metadata and comparison notes.

## Draft status

The exported report is always marked:

`DRAFT CALCULATION - NOT FOR DESIGN USE`

The export does not make the calculation production-ready and does not remove any draft warnings. The current punching shear check still requires verification against SP63 before design use.

## Review workflow

1. Run the punching shear draft calculation in the app.
2. Click `Выгрузить HTML` or `Выгрузить Markdown` in the result panel.
3. Send the downloaded report to an engineer or a trusted checking workflow.
4. Compare the report values with manual calculation, WebCAD, Excel, or another trusted source.
5. Keep the reviewed report together with review notes as verification evidence.

Engineers should review assumptions and unsupported draft features before comparing numbers. If the external source includes openings, edge effects, shear reinforcement or moment transfer, the current draft report is not a like-for-like case.

## Verified cases

Use the exported report only as a starting point for a verified case. A case can be treated as verified only after the values and assumptions have been checked independently and the expected values are captured in the verified case dataset.
