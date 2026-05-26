# Stress Regression Workflow

Date: 2026-05-26

The stress regression workflow records moment-transfer evidence without promoting the draft formulas. It is a verification-first collection layer for center rectangular Mx/My cases.

## Why Snapshots Exist

Stress snapshots make stress redistribution observable. A snapshot stores the current stress overlay, optional expected stress points, diff markers, eccentricity, transfer factors and verification metadata. This helps reviewers see whether a change moved stress around the perimeter before any trusted values are promoted.

## Evidence Templates

Draft moment evidence templates live in:

- `examples/verification/moments/mx-low-eccentricity.json`
- `examples/verification/moments/mx-high-eccentricity.json`
- `examples/verification/moments/my-low-eccentricity.json`
- `examples/verification/moments/my-high-eccentricity.json`
- `examples/verification/moments/mx-my-combined.json`

They intentionally use `status: "draft"`, `source: "TODO..."` and nullable expected values. Fill expected values only after comparison with a trusted manual, Excel, WebCAD or normative source.

## Capturing Expected Stress

For each trusted case, record:

- `maxStressMpa` and `minStressMpa`
- `transferFactorX` and `transferFactorY`
- `eccentricityX` and `eccentricityY`
- `stressPointCount`
- `stressDistributionChecksum`
- optional point-level metadata in `stressPoints`

Keep the source and axis assumptions beside the values. Do not change calculation formulas while collecting evidence.

## Drift Checks

`createStressDistributionChecksum()` builds a deterministic checksum from:

- stress point count
- ordered perimeter traversal by segment and point id
- rounded point coordinates
- rounded stress values

The regression runner marks a case as `drifted` when an expected checksum exists and the current distribution no longer matches. Draft templates with `null` expected values are counted as `draft-placeholder`, not failed.

## Axis Convention

The current convention is:

- perimeter traversal: counterclockwise
- X positive direction: right
- Y positive direction: up
- Mx sign convention: positive Mx increases positive-Y stress
- My sign convention: positive My increases positive-X stress

`validateAxisConvention()` emits warnings when evidence assumptions do not match the regression baseline. Axis warnings are included in regression results and report exports.

## Promotion Path

Trusted moment evidence can raise `center-moment-transfer` only after:

1. Expected stress, eccentricity, transfer factors and checksum are filled from a trusted source.
2. The stress regression runner passes without drift.
3. Axis convention validation passes.
4. Snapshot review shows expected and actual overlays match within tolerance.
5. The verified capability matrix is updated only for the promoted scope.

Until then, center force-only remains `VERIFIED`, center moment transfer remains `PARTIALLY VERIFIED`, and edge/opening behavior remains `DRAFT`.
