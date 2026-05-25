# Local Calculation Storage

## What Is Saved

Saved calculations are stored as complete punching shear calculation snapshots:

- `id`;
- `title`;
- `createdAt`;
- `updatedAt`;
- `input`;
- `result`;
- `report`;
- `appVersion`;
- `calculationType: "punching-shear"`.

The saved `input` is the same `PunchingShearInput` model used by the form. The saved `result` and `report` are the objects currently shown in the UI, including draft warnings.

## Where It Is Stored

Data is stored only in the user's browser `localStorage` under:

```text
truebim-structural-calcs:saved-calculations:v1
```

There is no backend, no server database and no account synchronization.

## JSON Format

Exported JSON contains one `SavedCalculation` object. Imported JSON is validated with Zod before it is added to local history.

Example shape:

```json
{
  "id": "calc-id",
  "title": "Продавливание — 25.05.2026, 15:30:00",
  "createdAt": "2026-05-25T08:30:00.000Z",
  "updatedAt": "2026-05-25T08:30:00.000Z",
  "input": {},
  "result": {},
  "report": {},
  "appVersion": "0.0.0",
  "calculationType": "punching-shear"
}
```

The real exported file includes full `input`, `result` and `report` objects.

## Limitations

- Storage is local to the current browser profile and device.
- Clearing site data or browser storage removes saved calculations.
- Browser quota limits apply.
- Corrupted `localStorage` data is ignored gracefully and treated as an empty history.
- Import validates the saved calculation envelope and punching shear input, but it does not recalculate formulas during import.
