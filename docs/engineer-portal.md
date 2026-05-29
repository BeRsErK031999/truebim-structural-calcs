# Engineer Portal

Engineer Portal is available at:

```text
http://192.168.22.37/engineer
```

It is a navigation start page for the engineer handoff. It does not change formulas, verification logic, candidate import rules or VERIFIED status.

## Main Steps

1. Run calculation: open `/`, enter or load the calculation, review warnings and export the HTML/Markdown report.
2. Check report: open `/validation-session`, link the review, collect report exports, add trusted evidence references and export the validation package.
3. Fill Engineering Review: open `/review`, enter trusted values, axis notes, source, checked-by and checked-at fields, then export the review snapshot and candidate JSON.
4. Download Release Evidence: open `/release-evidence` and export HTML, Markdown or JSON audit evidence.

## Status Cards

The portal shows:

- current verification level;
- verified features;
- draft features;
- candidate workflow status;
- validation package readiness;
- release evidence status.

Draft capabilities remain labelled as draft. The portal must not be used as a VERIFIED promotion mechanism.

## Copy Buttons

The page provides:

- Copy engineer instructions;
- Copy return checklist;
- Copy current app links.

Current app links copied by the portal:

```text
http://192.168.22.37/
http://192.168.22.37/review
http://192.168.22.37/validation-session
http://192.168.22.37/release-evidence
http://192.168.22.37/diagnostics
```

## What To Return

Return these artifacts to the developer:

- HTML/Markdown report;
- review snapshot;
- verification candidate JSON;
- validation session package;
- trusted evidence attachments;
- filled checklist.
