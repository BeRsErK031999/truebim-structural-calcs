# Review To Verification Candidate

Date: 2026-05-26

This workflow adds a staging layer between manual engineering review and the verified dataset.

## Review

A review is a local `/review` working record. It stores the calculation input, reviewer metadata, trusted source notes, expected values, attachments, and comparison notes.

Review data is evidence collection only. It is not a verification dataset case.

## Accepted Review

An accepted review means the reviewer accepted the manual evidence record. It confirms the review status, but it does not promote any calculation feature.

Accepted Review != VERIFIED

The app must keep the original `verificationLevel`, `verifiedFeatures`, and draft warnings until the existing verification lifecycle explicitly changes them.

## Verification Candidate

A verification candidate is exported JSON prepared from an accepted review. It contains:

- source review session id;
- calculation id;
- input;
- expected numeric values;
- tolerances;
- trusted source marker;
- checked by / checked at;
- comparison and axis convention notes;
- attachments;
- candidate status.

Candidate != VERIFIED

The candidate can be checked with:

```powershell
npm run verification:candidate -- path/to/candidate.json
```

The CLI prints PASS or FAIL and never imports the file into the verification dataset.

## Validation Session

The `/validation-session` route packages the report exports, review snapshot, candidate JSON, regression snapshot, engineer notes, checklist progress and reviewer summary into one deterministic manifest for external engineering validation.

The validation session is a handoff package only. It does not import the candidate, does not modify the verification dataset and does not auto-promote VERIFIED.

## Verified Case

A verified case is a manually imported dataset entry that passes the verification runner and is intentionally included in the capability promotion workflow.

Promotion still requires explicit engineering action:

1. export a ready candidate;
2. validate the candidate JSON;
3. manually review and import it as a dataset case;
4. run verification tests;
5. update capability status only when the verified workflow passes.
