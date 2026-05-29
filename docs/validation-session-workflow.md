# Validation Session Workflow

Validation Session is the handoff layer for real engineering validation. It packages the current calculation, engineering review, verification candidate, regression snapshot, and engineer notes without changing formulas or verification status.

Start from `/engineer` when guiding an engineer through the office deployment. The Engineer Portal links `/`, `/validation-session`, `/review`, `/release-evidence` and `/diagnostics`, and provides copy buttons for the handoff instructions, return checklist and current app links.

## Prepare a Validation Session

1. Run the calculation in the main app.
2. Open `/review` and complete the engineering review.
3. Accept the review only after the source, checked-by, checked-at, expected values, and axis convention notes are filled.
4. Open `/validation-session`.
5. Link the latest review session.
6. Export the HTML and Markdown reports.
7. Create and export the candidate JSON.
8. Run the candidate CLI:

```bash
npm run verification:candidate -- path/to/verification-candidate.json
```

9. Record the PASS result in the validation session.
10. Attach engineer notes and trusted source references.
11. Freeze the regression snapshot.
12. Export the validation package manifest.

## Engineer Package

The package is deterministic and uses this folder structure:

```text
validation-session-{calculationId}/
  reports/punching-shear-report.html
  reports/punching-shear-report.md
  review/review-snapshot.json
  candidate/verification-candidate.json
  regression/regression-snapshot.json
  notes/engineer-notes.md
  metadata/checklist.json
  metadata/summary.md
  metadata/package.json
```

The JSON manifest contains all file paths and file contents. A zip archive is not required for the workflow.

## Returning Trusted Evidence

The engineer returns:

- reviewed HTML or Markdown report;
- completed review snapshot or comments;
- candidate JSON;
- manual/WebCAD/Excel/normative evidence attachments;
- axis convention notes;
- mismatch explanations;
- candidate CLI output.

## Candidate JSON

Candidate JSON is staging data only. It can pass CLI validation and still does not import anything into the verification dataset.

Accepted Review != VERIFIED.

Candidate != VERIFIED.

Manual dataset import and the verification runner remain required before any capability promotion.

## Verified Promotion Feed

Validation session output feeds the promotion workflow by providing:

- trusted evidence source;
- checked expected values;
- tolerances and axis notes;
- regression drift status;
- open mismatch list;
- recommendation: keep partial, ready for verification, or requires investigation.

Center moment transfer remains PARTIAL until trusted evidence is available, manually imported into the dataset, and the verification runner passes.
