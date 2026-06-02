# Pilot Rollout

## Scope

Pilot MVP Mode is for real office use with engineering review and evidence return. It does not change formulas, verification logic, or VERIFIED promotion rules.

## How to Run the Pilot

1. Open the deployed office application.
2. Go to `/pilot`.
3. Read the engineer warnings before running calculations.
4. Use the quick start workflow: calculation, report check, review, candidate, validation session, return package.
5. Save local feedback for every issue, uncertainty, or workflow gap.
6. Export `pilot-feedback-{date}.json` and include it in the package returned to development.

## What Engineers Should Test

- Center force-only cases already covered by VERIFIED scope.
- Center cases with Mx moment transfer.
- Center cases with My moment transfer when comparable trusted evidence exists.
- Review workflow status changes and trusted evidence input.
- Candidate creation from accepted trusted review evidence.
- Validation session package export.
- Release evidence page status.
- Feedback capture and JSON export.

## What Data to Collect

- HTML or Markdown calculation report.
- Engineering review snapshot JSON or HTML.
- Verification candidate JSON when the review is complete.
- Validation session package manifest.
- Trusted evidence attachments: manual calculation, Excel, WebCAD result, screenshots, or PDF notes.
- Pilot feedback JSON with category, calculation ID, review status, and verification level.

## What to Return to Development

- Calculation report.
- Review snapshot.
- Candidate JSON if created.
- Validation session package manifest.
- Trusted evidence files or references.
- `pilot-feedback-{date}.json`.
- Short note identifying whether the case should remain DRAFT, continue as PARTIAL, or become a future verification candidate.

## Priority Calculations

1. `center + Mx`
2. `edge`
3. `corner`
4. `opening`

## Pilot Warnings

- VERIFIED does not mean full SP63 support.
- Edge columns, corner columns, and openings are still DRAFT.
- Moment transfer is PARTIAL and requires trusted engineering evidence.
- Review is required before engineering use.
- Trusted evidence is required before any candidate can be considered for future verification work.
