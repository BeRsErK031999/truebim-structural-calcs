# Report export

Report export lets a user download the current punching shear draft calculation as a human-readable file. The intended workflow is to send the report to an engineer, a review chat, or another trusted checker, then use the checked values as evidence when creating a verified case.

## Formats

Available formats:

- HTML report: `truebim-punching-shear-report-{date}.html`
- Markdown report: `truebim-punching-shear-report-{date}.md`

Both files are generated in the browser and downloaded through the browser download flow.

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

## Verified cases

Use the exported report only as a starting point for a verified case. A case can be treated as verified only after the values and assumptions have been checked independently and the expected values are captured in the verified case dataset.
