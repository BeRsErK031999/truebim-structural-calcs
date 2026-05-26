# Verified Transition Strategy

Date: 2026-05-26

This project uses a granular verification lifecycle for punching shear arithmetic:

```text
draft -> partial -> verified
```

The lifecycle applies per feature, not to the whole SP63 implementation. A verified center rectangular force-only case does not make openings, edge columns, round columns, shear reinforcement, or moment transfer globally verified.

## Capability Matrix

| Feature | Status | Reason |
| --- | --- | --- |
| center force-only | verified | Trusted manual case `verified-center-rect-001` exists and passes tolerance. |
| center moment transfer | partial | Draft Mx/My regression cases exist, but no trusted moment source has been promoted. |
| edge columns | draft | Boundary clipping is draft geometry only. |
| corner columns | draft | Corner clipping is draft geometry only. |
| openings | draft | Opening tangent subtraction is draft geometry only. |
| shear reinforcement | draft | Reinforcement contribution is outside the current arithmetic scope. |
| round columns | draft | Round column geometry is not implemented as verified arithmetic. |

## Why Verification Is Granular

Each feature has different geometry, assumptions, and evidence requirements. The result model therefore carries:

- `verifiedMode`;
- `verificationLevel`;
- `verifiedFeatures`;
- `draftFeatures`;
- `verificationEvidenceIds`;
- `verificationEvidence`.

Reports, UI, diagnostics, and verification runner output use these fields directly. This keeps the global draft warning intact while allowing a small trusted scope to be surfaced clearly.

## Evidence Linkage

The verified layer links a result to verification cases only when:

1. The case geometry and input match the current supported scope.
2. The source is trusted for `status: "verified"`.
3. Current result values pass the stored tolerances.

For `center-force-only`, the linked trusted evidence is `verified-center-rect-001`.

For `center-moment-transfer`, the result can be `partial` when the matching draft Mx/My regression case still passes and the base force-only case is verified. The moment arithmetic itself remains listed under draft features until trusted moment expected values are available.

## Why Edge And Openings Stay Draft

Edge, corner, and opening cases currently exercise geometry generation and report plumbing. They do not yet have trusted SP63 arithmetic evidence, so they remain `draft` even when the calculation runs and produces stable regression output.

## Promoting Future Features

To promote a feature:

1. Add or update a verification case with trusted source metadata.
2. Fill expected values, tolerances, `checkedBy`, and `checkedAt`.
3. Keep the feature draft until the verification runner passes.
4. Update the verified capability matrix only for the promoted feature.
5. Keep unrelated draft warnings in place.

This prevents a single verified case from being misread as full SP63 support.
