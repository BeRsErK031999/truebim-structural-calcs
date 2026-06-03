# Pilot Readiness Matrix

This matrix separates what engineers can safely test in the office pilot from what must remain out of final design use.

## Ready For Pilot

| Feature | Pilot use |
| --- | --- |
| UI calculation flow | Engineers can enter inputs, run calculations, inspect warnings, and compare outputs. |
| report export | HTML and Markdown reports can be attached to review and validation packages. |
| review mode | Engineers can freeze snapshots, record comparison status, and capture mismatch notes. |
| validation session | Review, report, candidate, regression, and checklist context can be packaged locally. |
| release evidence | Release metadata, diagnostics-like status, and rollback notes can be exported. |
| center force-only verified case | Current trusted baseline for a center rectangular force-only case. |

## Pilot With Warning

| Feature | Warning |
| --- | --- |
| center moment transfer | Partial workflow only; moment formulas and stress redistribution need trusted SP63 evidence. |
| edge/corner/opening draft geometry | Useful for comparison and feedback, not verified design behavior. |
| wall-end/wall-corner draft geometry | Useful for geometry review, report export, and verification preparation only. |
| round center draft geometry | Useful for diameter input, circular perimeter review, SVG/report export, and verification preparation only. |
| multiple control perimeters | Draft generation and selection trace is available for review, not verified SP63 contour selection. |
| shear reinforcement draft foundation | Useful for input review, report/SVG trace, and verification preparation only; draft capacity is not SP63 verified. |
| stress visualization | Draft visualization/regression aid, not verified engineering output. |
| candidate workflow | Candidate export records evidence intent; it does not auto-promote a case to VERIFIED. |

## Not Ready For Design Use

| Feature | Blocker |
| --- | --- |
| full SP63.13330.2018 support | Trusted clause-level verification is not complete. |
| verified wall punching shear | Wall-end and wall-corner geometry exists as draft preparation only; formulas and SP63 coefficients are not verified. |
| verified multiple contours | Draft generation and selection trace exists, but SP63 contour rules and trusted expected values are not verified. |
| verified openings | Opening behavior is draft geometry only. |
| verified edge/corner | Boundary behavior is draft geometry only. |
| verified shear reinforcement | Draft contribution is available for review, but SP63 reinforcement formulas, steel values, and layout assumptions are not verified. |
| verified round columns | Center round geometry exists as draft preparation only; round edge/corner are not implemented and SP63 formulas are not verified. |

## Production Blockers

- Trusted SP63 verification for formulas, coefficients, rounding, and applicability limits.
- Golden examples pack covering center moments, edge/corner, openings, wall cases, shear reinforcement, and multiple contours.
- Official report format with stable traceability and case-specific limitations.
- Engineer-reviewed evidence flow for promoting candidates without hiding draft warnings.
