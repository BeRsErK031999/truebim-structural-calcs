# Engineering Review Workflow

Date: 2026-05-26

Engineering Review mode collects trusted manual evidence for punching shear results without changing formulas, verification logic, or draft warnings.

## Purpose

Use `/review` when a result needs manual comparison against a trusted source such as hand calculation, WebCAD, Excel, or another reviewed engineering reference.

The workflow stores:

- review status;
- checked by / checked at metadata;
- source and axis convention notes;
- expected trusted values;
- screenshot and attachment references;
- side-by-side mismatch highlights;
- frozen review snapshots for future drift checks.

All data is local browser state. There is no backend.

## Manual Comparison Steps

1. Run the draft calculation on `/`.
2. Open `/review`.
3. Enter evidence source, reviewer, review time, notes, and axis convention assumptions.
4. Fill trusted expected values for geometry, stress, eccentricity, transfer factors, checksum, and verification level.
5. Review the side-by-side table.
6. Record mismatch explanations in notes when trusted values intentionally differ.
7. Export JSON or HTML review snapshot for the evidence folder.

## Mismatch Highlighting

The comparison table uses:

- green `match`: app value is within the low-risk tolerance band;
- yellow `warning`: app value is inside tolerance but close to the limit;
- red `mismatch`: app value is outside tolerance;
- neutral `missing`: no trusted expected value was entered.

Default tolerances are intentionally narrow and are review aids only. They do not promote verification status.

## Freezing Snapshots

Use `Freeze snapshot` after manual review. The frozen snapshot stores the app result and comparison rows at the time of review.

Future visits compare the current draft run with frozen snapshots. Any changed geometry, stress, eccentricity, or verification-level field is reported as regression drift after manual review.

## Accepted Review vs VERIFIED

`accepted` means an engineer accepted the manual review record. It does not set `verificationLevel: "verified"` and does not add verified features.

VERIFIED still requires the existing capability promotion lifecycle:

1. trusted source values are moved into verification cases;
2. tolerances and metadata are explicit;
3. verification runner passes;
4. capability matrix is intentionally updated.

## Verification Lifecycle Feed

Review snapshots are evidence collection artifacts. They help prepare trusted moment cases, especially center moment transfer, but the verified transition layer remains the authority for promotion.

Accepted reviews can now be converted into verification candidate JSON from `/review`. A candidate is a staging artifact for manual validation and manual dataset import only.

The candidate workflow keeps these boundaries explicit:

- Accepted Review != VERIFIED;
- Candidate != VERIFIED;
- candidate export does not modify `verificationLevel`;
- candidate export does not add anything to the verification dataset.

For center moment transfer, the remaining work is to convert accepted trusted review snapshots into verified moment evidence cases with expected max/min stress, eccentricity, transfer factors, checksum, axis convention notes, and passing regression tests.
