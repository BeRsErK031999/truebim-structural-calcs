# SP63 Trace Engine Foundation

This milestone adds an explainability layer for the punching shear pilot. It does not add full SP63 support, does not change formulas, does not change verification logic, and does not auto-promote any case to `VERIFIED`.

## Trace Architecture

Trace data lives in `src/calculations/punching-shear/trace`.

- `traceStep.ts` defines the `TraceStep` DTO.
- `traceSection.ts` groups steps into report sections.
- `traceBuilder.ts` orchestrates the scenario-specific trace builders from existing input and result DTOs.
- `traceMetadata.ts` keeps source labels and stable trace references.
- `traceWarnings.ts` marks draft formula, draft geometry, and draft reinforcement usage on individual steps.
- `traceForCenterMoment.ts` adds partial/draft moment-transfer explanation.
- `traceForWallEnd.ts` adds draft wall-end trace steps.
- `traceForWallCorner.ts` adds draft wall-corner trace steps.
- `traceForOpenings.ts` adds draft opening tangent and removed-segment trace steps.
- `traceForMultipleContours.ts` adds draft contour generation and critical contour selection trace steps.
- `traceForShearReinforcement.ts` adds draft reinforcement input, area, contribution, and utilization trace steps.
- `traceForRoundColumn.ts` adds draft round-center trace steps and explains round edge/corner unsupported cases.
- `traceForDraftUnsupported.ts` adds placeholder explanation for unsupported draft scenarios.

The report model exposes `calculationTrace`, and HTML/Markdown exports render a `Calculation Trace` section with step title, formula, substituted formula, result, units, and verification source.

## Trace DTO

`TraceStep` contains:

- `id`
- `title`
- `description`
- `formula`
- `substitutedFormula`
- `result`
- `units`
- `sourceType`
- `sourceReference`
- `warnings`

Supported `sourceType` values are `verified`, `partial`, `draft`, `manual`, and `placeholder`.

## Supported Trace Builders

The trace registry currently exposes these builders:

- `center-force-only`
- `center-moment`
- `wall-end`
- `wall-corner`
- `openings`
- `multiple-contours`
- `shear-reinforcement`
- `round-column`
- `draft-unsupported`

The center force-only path remains the base trace section with these steps:

1. Input validation
2. Geometry generation
3. Control perimeter
4. Effective depth
5. Stress, `v = N / (u * h0)`
6. Utilization, `eta = v / R`
7. Verification level

The builder reads already computed values from `PunchingShearResult`. It does not recompute formulas independently and does not alter calculation behavior.

Additional sections are included only when the current input/result make them relevant:

- center moments: force-only base stress, eccentricity, draft redistribution, max/min stress, utilization;
- wall-end: wall geometry, wall-end perimeter, draft offset, draft stress, draft utilization, verification level;
- wall-corner: L-shaped wall geometry, orientation transform, wall-corner perimeter, draft offset, draft stress, verification level;
- openings: opening classification, tangent construction, removed segments, active perimeter, draft stress, verification level;
- multiple contours: contour generation, offsets, stress per contour, draft critical contour selection, warnings;
- shear reinforcement: reinforcement input, steel class draft data, reinforcement area, draft contribution, draft utilization with reinforcement, verification level;
- round center: round geometry, circular perimeter approximation, draft perimeter, draft stress, verification level;
- round edge/corner: placeholder trace explaining that the path is not implemented.

## SourceType Rules

Step-level source status follows existing verification lifecycle fields.

- Center force-only arithmetic can show `VERIFIED` when the existing verified evidence is linked.
- Center moment-transfer force-only base can show `PARTIAL`; moment eccentricity and stress redistribution remain `PARTIAL` or `DRAFT` and must warn when trusted evidence is absent.
- Wall-end, wall-corner, openings, multiple contours, shear reinforcement, and round column support remain `DRAFT`.
- Input validation can show `MANUAL` because it comes from application schema checks rather than external engineering evidence.
- Unsupported paths use `PLACEHOLDER` and must not claim a formula was evaluated.

Trace warnings remain visible when draft formula, draft geometry, or draft reinforcement data is involved.

## Trace Examples

Verified center force-only stress:

- `sourceType`: `verified`
- formula: `v = N / (u * h0)`
- source reference: `center-force-only evidence: verified-center-rect-001`

Partial center moment eccentricity:

- `sourceType`: `partial` or `draft`
- formula: `ex, ey = draft eccentricity from Mx/My and N`
- warning: `Moment transfer is partial/draft and requires trusted evidence.`

Draft opening subtraction:

- `sourceType`: `draft`
- formula: `u_active = u_base - u_removed`
- warning: draft formula or draft verification scope remains visible.

Placeholder unsupported round edge/corner:

- `sourceType`: `placeholder`
- result: `not implemented`
- no verified or draft SP63 formula is claimed.

## Current Limitations

- This is not full SP63 clause tracing.
- SP63 clause numbers are not mapped yet.
- Moment transfer formulas are not promoted by trace output.
- Wall, opening, boundary, multiple contour, round column, and reinforcement trace steps are expanded for explainability, but not into trusted clause-level derivations.
- Trace output is an engineer-facing explanation of current app results, not independent verification evidence.

## Future SP63 Clause Mapping

Future work should map each trace step to stable SP63 clause references after trusted evidence is available. The expected direction is:

- add clause IDs and normative source metadata to `sourceReference`;
- split geometry and resistance steps by case type;
- add dedicated trace builders for moment transfer, openings, wall cases, multiple contours, round columns, and shear reinforcement;
- keep `verified`, `partial`, and `draft` source labels granular per step;
- preserve current verification lifecycle rules so trace output cannot auto-promote a case.
