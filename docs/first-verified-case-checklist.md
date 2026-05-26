# First Verified Case Checklist

Use this checklist only for the first center-column punching shear case. Do not mark the case as verified until the external source and comparison are complete.

1. Take the center example from `examples/verification/center-verified-case.example.json`.
2. Run the same input through the app and export the engineering report.
3. Run the same input through one trusted source:
   - WebCAD checked
   - Manual engineer calculation
   - Verified Excel
   - Normative example
4. Compare these values:
   - `u`
   - `h0`
   - `v`
   - `utilization`
   - `passed`
5. Fill the verified JSON:
   - `verificationSource`
   - `checkedBy`
   - `checkedAt`
   - `comparisonNotes`
   - numeric `expected` values
   - `expected.passed`
6. Run validation:

```bash
npm run verification:validate -- examples/verification/center-verified-case.example.json
```

7. Change `status` from `draft` to `verified` only after validation passes and the engineering review is accepted.
