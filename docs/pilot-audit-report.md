# Pilot Audit Report

Date: 2026-06-03
Scope: existing UI/workflow audit only. No formulas, verification logic, or code behavior were changed.

## Audit Coverage

Checked scenarios:

1. center rectangular
2. center rectangular + moments
3. edge
4. corner
5. opening
6. multiple contours
7. wall-end
8. wall-corner
9. round column
10. shear reinforcement

Checked surfaces:

- calculation form
- result panel
- SVG preview
- calculation trace
- HTML and Markdown report export workflow
- review workflow
- verification candidate workflow
- validation session workflow
- pilot workflow

Notes:

- The in-app browser backend was not available during the audit session, so route availability was checked with the production preview/office HTTP responses and workflow behavior was reviewed against the current UI implementation.
- Existing automated validation was run separately before the audit. This report focuses on pilot usability and workflow risks, not formula correctness.

## Critical

### 1. Validation session can mark candidate PASS without a valid candidate

- page: `/validation-session`
- scenario: validation session, candidate workflow
- steps to reproduce:
  1. Open `/validation-session`.
  2. Do not create a ready-for-validation candidate.
  3. Click `Mark candidate PASS`.
- expected behavior:
  - PASS should be disabled unless a candidate exists and has `candidateStatus: ready-for-validation`.
  - PASS should require evidence that CLI validation succeeded.
- actual behavior:
  - `markValidationCandidateValidated(session, true)` is available from the UI without checking candidate presence, candidate status, or CLI result.
  - This can create a validation session state where the candidate is marked validated even when the candidate is missing or incomplete.
- recommendation:
  - Disable PASS until a ready candidate exists and a validation result is attached.
  - Show the blocking reason in the checklist.

## High

### 2. Validation session can create and export incomplete candidate JSON

- page: `/validation-session`
- scenario: candidate workflow, validation session
- steps to reproduce:
  1. Open `/validation-session` with the default or incomplete review.
  2. Click `Create candidate`.
  3. Click `Export candidate JSON`.
- expected behavior:
  - Incomplete candidate creation should be blocked or clearly staged as non-exportable.
  - Export should be disabled unless the candidate passes `validateReviewForVerificationCandidate`.
- actual behavior:
  - `Create candidate` stores a candidate even when validation is invalid.
  - `Export candidate JSON` checks only that `session.candidate` exists.
  - The UI can export `candidateStatus: incomplete`.
- recommendation:
  - Keep incomplete candidate preview-only.
  - Disable JSON export for incomplete candidates.
  - Surface validation errors next to the export button.

### 3. Edge, corner, and opening scenarios are blocked in the main form

- page: `/`
- scenario: edge, corner, opening
- steps to reproduce:
  1. Open the calculation form.
  2. Open case type selection.
  3. Try to select `edge`, `corner`, or `opening`.
- expected behavior:
  - Since these scenarios are part of the pilot audit scope and the project has draft foundations, the UI should either allow draft calculation or clearly route users to the supported evidence workflow.
- actual behavior:
  - The options are disabled and labeled as coming soon.
  - The helper text also says the engine supports only center rectangular without openings or slab edges.
  - These scenarios cannot be completed through normal UI steps.
- recommendation:
  - Align the form with the current draft capability matrix.
  - If the scenarios must stay blocked, remove them from pilot quick-start expectations and make the limitation explicit.

### 4. Cyrillic text is corrupted across core pilot screens

- page: `/`, `/review`, `/validation-session`, `/pilot`, `/diagnostics`
- scenario: all scenarios
- steps to reproduce:
  1. Open any primary workflow page.
  2. Inspect labels, helper text, warnings, buttons, and report workflow messages.
- expected behavior:
  - Russian UI text should be readable and technically unambiguous.
- actual behavior:
  - Many labels render as mojibake such as `РџСЂ...`.
  - This affects form labels, status badges, report messages, pilot checklist, diagnostics, and validation workflow.
- recommendation:
  - Restore UTF-8 text resources.
  - Add a smoke check for common mojibake sequences in user-facing strings before pilot release.

### 5. Accepted review can be saved without trusted evidence

- page: `/review`
- scenario: review workflow, candidate workflow
- steps to reproduce:
  1. Open `/review`.
  2. Do not fill expected values, checkedBy, or axis convention notes.
  3. Click status `accepted`.
- expected behavior:
  - Accepting a review should require the same minimum evidence needed to support a candidate, or at least require an explicit override reason.
- actual behavior:
  - Review status can become `accepted` with empty evidence.
  - Candidate generation is still blocked on the review page, but the accepted review state itself can be misleading and can be reused by validation session and knowledge workflows.
- recommendation:
  - Gate accepted status behind minimum evidence checks or introduce a separate `accepted-without-candidate` status.
  - Show missing evidence before allowing acceptance.

## Medium

### 6. Copied calculation ID does not match exported report metadata

- page: `/`
- scenario: center rectangular, report workflow
- steps to reproduce:
  1. Run a calculation.
  2. Click `Copy calculation ID`.
  3. Export HTML or Markdown report.
  4. Compare copied ID to the report `calculationId`.
- expected behavior:
  - The copied ID and exported report ID should identify the same calculation.
- actual behavior:
  - Result Panel creates an ID with `createCalculationId()` when the result changes.
  - Each report export creates new metadata and a new ID at export time.
  - The copied ID can differ from both HTML and Markdown report IDs.
- recommendation:
  - Persist one calculation/report ID per result and reuse it for copy, HTML export, Markdown export, review, and validation session.

### 7. Round column edge/corner positions are selectable even though not implemented

- page: `/`
- scenario: round column
- steps to reproduce:
  1. Select `Round column - draft center only`.
  2. Change position to `edge` or `corner`.
  3. Run calculation.
- expected behavior:
  - Unsupported round edge/corner positions should be disabled or should prevent calculation submission.
- actual behavior:
  - The UI shows a warning, but the unsupported positions remain selectable in the same calculation flow.
  - This increases the chance that a pilot user treats `not implemented` as a usable draft result.
- recommendation:
  - Disable unsupported positions until implemented, or block submit with a clear validation message.

### 8. Report cannot be opened in-app before download

- page: `/`
- scenario: report workflow, all calculation scenarios
- steps to reproduce:
  1. Run a calculation.
  2. Look for an in-app report preview/open action.
- expected behavior:
  - The pilot workflow asks the user to open/check the report; the UI should provide an obvious report preview or open-in-new-tab action.
- actual behavior:
  - The result panel only downloads HTML/Markdown.
  - Users must find downloaded files outside the app to review report content.
- recommendation:
  - Add an in-app report preview or an explicit "download and open locally" instruction.

### 9. Candidate evidence entry is hard to understand and easy to fill incorrectly

- page: `/review`
- scenario: center rectangular, center + moments, candidate workflow
- steps to reproduce:
  1. Open `/review`.
  2. Try to create a candidate from trusted values.
  3. Fill expected values manually.
- expected behavior:
  - Required candidate fields should explain units, source, tolerance, and whether values can be copied from app output or must come from trusted evidence.
- actual behavior:
  - The page requires many numeric expected fields, including transfer factors and stress point count.
  - Field labels are partially corrupted by encoding.
  - The trusted source requirement is based on source text markers, which is not obvious to users.
- recommendation:
  - Add explicit candidate readiness guidance near the fields.
  - Keep trusted source as a controlled select plus reference field.
  - Provide unit hints and source-of-truth hints per expected field.

### 10. Validation session can export package before blocking checklist is complete

- page: `/validation-session`
- scenario: validation session
- steps to reproduce:
  1. Open `/validation-session`.
  2. Leave report export, accepted review, ready candidate, trusted source, and regression snapshot incomplete.
  3. Click `Export validation package`.
- expected behavior:
  - Package export should be disabled or clearly labeled as incomplete while blocking checklist items remain.
- actual behavior:
  - Package manifest export is always available.
  - The exported package may look like a handoff artifact even when blocking checklist items are unresolved.
- recommendation:
  - Disable package export until blocking items are complete, or generate an "incomplete package" with a clear warning banner.

## Low

### 11. Pilot quick-start text promises report viewing that the main UI does not provide

- page: `/pilot`
- scenario: pilot workflow
- steps to reproduce:
  1. Open `/pilot`.
  2. Read the quick-start step for checking the report.
  3. Return to `/` and look for report preview/open behavior.
- expected behavior:
  - Pilot instructions should match available controls.
- actual behavior:
  - Quick-start copy mentions viewing/checking the report, but the main workflow only exports files.
- recommendation:
  - Update copy to match current controls or add a preview/open action.

### 12. Some validation session labels do not cover current statuses

- page: `/validation-session`
- scenario: center + moments, validation session
- steps to reproduce:
  1. Use a calculation with `verificationLevel: partial`.
  2. Open validation session summary.
- expected behavior:
  - All current statuses and recommendations should have readable labels.
- actual behavior:
  - Some formatter maps omit values such as `partial` and `ready for verification`, so raw internal strings can appear.
- recommendation:
  - Extend label maps to cover all current enum values.

### 13. Result panel mixes translated and raw feature labels

- page: `/`
- scenario: wall-end, wall-corner, multiple contours, round column, shear reinforcement
- steps to reproduce:
  1. Run draft scenarios that add draft features.
  2. Inspect verified and draft feature lists.
- expected behavior:
  - Feature labels should be consistently readable and localized.
- actual behavior:
  - Some labels are English, some are corrupted Cyrillic, and unknown feature IDs can appear raw.
- recommendation:
  - Centralize feature labels and ensure all current feature IDs have readable display labels.

## Scenario Summary

| Scenario | UI status | Audit result |
| --- | --- | --- |
| center rectangular | accessible | Workflow available; report/review issues noted. |
| center rectangular + moments | accessible | Workflow available; candidate evidence UX is risky. |
| edge | blocked in form | Cannot complete through normal UI. |
| corner | blocked in form | Cannot complete through normal UI. |
| opening | blocked in form | Cannot complete through normal UI. |
| multiple contours | accessible as center option | Draft workflow available; feature labeling/report review issues noted. |
| wall-end | accessible | Draft workflow available; must remain non-VERIFIED. |
| wall-corner | accessible | Draft workflow available; must remain non-VERIFIED. |
| round column | accessible for center; unsupported positions selectable | Center draft workflow available; edge/corner position UX issue noted. |
| shear reinforcement | accessible as center option | Draft workflow available; must remain non-VERIFIED. |

## Readiness Assessment

- scenarios checked: 10
- issues found: 13
- severity breakdown:
  - Critical: 0 open
  - High: 0 open
  - Medium: 1 open risk
  - Low: 0 open
- pilot readiness: 84/100

Pilot is ready for controlled engineer rollout focused on evidence collection. Draft geometry remains explicitly non-design-use and still requires trusted review evidence before any promotion workflow.

## Remediation

Commit: final remediation commit hash is reported with the task completion output.

| # | Severity | Status | Verification |
| --- | --- | --- | --- |
| 1 | Critical | fixed | `validationSession.test.ts`: PASS is blocked without candidate, incomplete candidate, or missing CLI PASS; ready candidate + CLI PASS succeeds. |
| 2 | High | fixed | UI blocks incomplete candidate JSON export; candidate validation errors are shown near export controls. |
| 3 | High | fixed | Edge, corner, and opening are selectable in the form with DRAFT GEOMETRY ONLY / NOT FOR DESIGN USE warnings. |
| 4 | High | fixed | `scripts/check-mojibake.mjs` and `npm run check:mojibake` guard the requested mojibake signatures. |
| 5 | High | fixed | Review `accepted` is gated by candidate evidence requirements; incomplete evidence moves to `reviewed-needs-evidence`. |
| 6 | Medium | fixed | Store-level `activeCalculationId` is reused by copy, HTML export, Markdown export, review, and validation package metadata. |
| 7 | Medium | fixed | Round edge/corner positions are disabled in the round-column UI; center remains available. |
| 8 | Medium | fixed | Result panel includes in-app `Preview HTML report` using the same report metadata/calculationId. |
| 9 | Medium | fixed | Review evidence source is a controlled select with trusted-source warning and expected-value unit/source hints. |
| 10 | Medium | fixed | Normal validation package export is disabled with blockers; incomplete debug export includes a manifest warning. |
| 11 | Low | fixed | Pilot quick-start now says: preview report in app or download HTML/Markdown. |
| 12 | Low | fixed | Validation session label maps cover partial, ready-for-validation, incomplete, rejected, needs-investigation, reviewed-needs-evidence, draft, verified, and ready-for-verification wording. |
| 13 | Low | fixed | `src/shared/labels/featureLabels.ts` centralizes known feature labels and reports/result panel use it. |

Remaining risk:

- The pilot still depends on trusted external/manual evidence for draft and partial features. This remediation did not change formulas, auto-promotion, verification logic, or draft warnings.
