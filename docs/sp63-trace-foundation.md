# SP63 Trace Engine Foundation

This milestone adds an explainability layer for the punching shear pilot. It does not add full SP63 support, does not change formulas, does not change verification logic, and does not auto-promote any case to `VERIFIED`.

## Trace Architecture

Trace data lives in `src/calculations/punching-shear/trace`.

- `traceStep.ts` defines the `TraceStep` DTO.
- `traceSection.ts` groups steps into report sections.
- `traceBuilder.ts` builds the current punching shear trace from existing input and result DTOs.
- `traceMetadata.ts` keeps source labels and stable trace references.
- `traceWarnings.ts` marks draft formula, draft geometry, and draft reinforcement usage on individual steps.

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

## Current Scope

The current trace builder covers the center force-only path with these steps:

1. Input validation
2. Geometry generation
3. Control perimeter
4. Effective depth
5. Stress, `v = N / (u * h0)`
6. Utilization, `eta = v / R`
7. Verification level

The builder reads already computed values from `PunchingShearResult`. It does not recompute formulas independently and does not alter calculation behavior.

## Draft vs Verified Trace

Step-level source status follows existing verification lifecycle fields.

- Center force-only arithmetic can show `VERIFIED` when the existing verified evidence is linked.
- Center moment-transfer cases remain `PARTIAL` because only the force-only base is verified.
- Wall-end, wall-corner, openings, multiple contours, shear reinforcement, and round column support remain `DRAFT`.
- Input validation can show `MANUAL` because it comes from application schema checks rather than external engineering evidence.

Trace warnings remain visible when draft formula, draft geometry, or draft reinforcement data is involved.

## Current Limitations

- This is not full SP63 clause tracing.
- SP63 clause numbers are not mapped yet.
- Moment transfer formulas are not promoted by trace output.
- Wall, opening, boundary, multiple contour, round column, and reinforcement trace steps are not yet expanded into dedicated clause-level derivations.
- Trace output is an engineer-facing explanation of current app results, not independent verification evidence.

## Future SP63 Clause Mapping

Future work should map each trace step to stable SP63 clause references after trusted evidence is available. The expected direction is:

- add clause IDs and normative source metadata to `sourceReference`;
- split geometry and resistance steps by case type;
- add dedicated trace builders for moment transfer, openings, wall cases, multiple contours, round columns, and shear reinforcement;
- keep `verified`, `partial`, and `draft` source labels granular per step;
- preserve current verification lifecycle rules so trace output cannot auto-promote a case.
