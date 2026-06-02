# CalcEngine Gap Analysis

This document compares the current TrueBIM punching shear pilot scope against the public CalcEngine punchshear page as a product benchmark. It is an honest readiness map, not a claim of equivalent functionality.

Public benchmark: https://calcengine.ru/punchshear

## Scope Rules

- Do not copy CalcEngine text, formulas, or code.
- Do not change TrueBIM calculation formulas from this analysis.
- Do not claim full SP63.13330.2018 production support.
- Keep draft warnings visible until trusted engineering verification exists.
- Use this document to prioritize pilot UX, evidence collection, and production-readiness work.

## Gap Matrix

| Feature | CalcEngine states | Current TrueBIM state | Status | What needs to be done | Priority |
| --- | --- | --- | --- | --- | --- |
| center column | Related punching shear column workflow is a public reference; this wall page is not centered on column punching. | Center rectangular force-only case has one trusted verified case. | done | Preserve warning text that verified scope is narrow and add more golden examples. | P0 |
| wall/end-wall case | Wall end-zone punching shear is part of the public page scope. | Wall-end draft DTO, geometry, SVG/report exposure, diagnostics, and verification template exist. | draft | Collect trusted SP63 wall-end examples and add verified formula evidence before promotion. | P0 |
| wall corner case | Wall corner punching shear is part of the public page scope. | Wall-corner draft DTO, L-shaped geometry, SVG/report exposure, diagnostics, and verification template exist. | draft | Collect trusted SP63 wall-corner examples and add verified formula evidence before promotion. | P0 |
| edge column | Not the main wall page focus, but comparable boundary behavior is expected in punching shear tools. | Edge clipping exists as draft geometry and regression preparation only. | draft | Verify edge perimeter rules, stress checks, warnings, and evidence fixtures. | P1 |
| corner column | Not the main wall page focus, but comparable boundary behavior is expected in punching shear tools. | Corner clipping exists as draft geometry and regression preparation only. | draft | Verify corner perimeter rules, stress checks, warnings, and evidence fixtures. | P1 |
| openings | Public page states openings are considered. | Opening tangent subtraction exists as draft geometry only. | draft | Verify opening influence rules, removed perimeter, stress redistribution, and report trace. | P1 |
| multiple control perimeters | Public page states multiple calculation contours are considered. | Draft contour generation, selection trace, SVG/report exposure, diagnostics, and verification templates exist. | draft | Verify SP63 critical contour rules and trusted selection examples before promotion. | P0 |
| concrete resistance | Public page presents concrete bearing capacity/check result. | Draft concrete resistance is reported; center force-only arithmetic has one verified fixture. | partial | Verify SP63 coefficients, material mapping, rounding, and limit cases. | P0 |
| utilization ratio | Public page presents utilization. | Utilization ratio is calculated and exported for current supported flow. | partial | Keep narrow verified scope; verify utilization for moments, boundaries, openings, and reinforcement. | P0 |
| SP63.13330.2018 trace | Public page presents the calculation as SP63.13330.2018-oriented. | Reports include SP63 warnings and verification notes, not a full clause trace. | blocked-by-verification | Build clause-level trace only after trusted formula and coefficient verification. | P0 |
| engineering report | Public page states report-oriented output. | HTML and Markdown exports include inputs, geometry, warnings, evidence, and status. | partial | Add official DOCX/PDF format and signed review metadata after formulas are verified. | P2 |
| step-by-step calculation trace | Public page states step tracing. | Report includes calculation steps and source notes. | partial | Expand trace with clause references, intermediate values, rounding, and rejected paths. | P1 |
| limitations/applicability | Public page states limitations/applicability are presented. | UI/docs/report warnings exist; applicability section is added for pilot export. | partial | Keep limitations route-visible and case-specific for every unsupported feature. | P0 |
| review workflow | Public benchmark focuses on calculation; review workflow is a TrueBIM pilot need. | Review mode, snapshots, mismatch status, candidates, and validation sessions exist locally. | done | Continue hardening workflow and handoff copy around evidence return. | P1 |
| verification evidence | Public benchmark implies engineering traceability; exact evidence workflow is not the target. | One center force-only verified case; draft regression fixtures for moments/openings/boundaries. | blocked-by-verification | Collect trusted SP63/manual/Excel/WebCAD examples and promote only reviewed fixtures. | P0 |
| pilot feedback | Not a CalcEngine benchmark item. | Local pilot feedback capture and JSON export exist. | done | Keep feedback tied to calculation ID, review status, and validation package. | P2 |
| local deploy | Public SaaS/page availability is the benchmark. | Static Vite build is deployed through Docker/nginx on the office server. | done | Continue precheck/build/deploy evidence and route verification after each rollout. | P1 |

## Short Gap Summary

TrueBIM is ready as a pilot review and evidence collection tool for a narrow punching shear workflow. It is not ready to be marketed or used as a production SP63 wall-punching calculator. The biggest gaps are trusted SP63 verification, verified wall/end-wall and wall-corner formulas, multiple control perimeters, and verified edge/opening behavior.
