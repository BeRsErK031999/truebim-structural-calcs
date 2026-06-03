# Draft Shear Reinforcement Foundation

This page documents the draft-only shear reinforcement foundation for punching shear.

## Scope

- Input DTO support for `enabled`, `barDiameterMm`, `barSpacingMm`, `rowCount`, `legsPerRow`, `steelClass`, `firstRowDistanceMm`, `rowSpacingMm`, and `layoutType`.
- Draft steel classes: `A240`, `A400`, `A500`, `B500`.
- Draft reinforcement area, contribution, reinforced capacity, and reinforced utilization fields.
- SVG row and marker layout for review.
- HTML/Markdown report section for engineer handoff.
- Diagnostics support flags and verification templates.

## Verification Status

Shear reinforcement remains a draft feature. The implementation does not claim verified SP63 support, does not auto-promote any case to VERIFIED, and does not remove warnings.

Current verified shear reinforcement cases count: `0`.

## Draft Capacity Logic

The current draft model calculates:

- `totalLegs = rowCount * legsPerRow`;
- `reinforcementAreaMm2 = totalLegs * pi * barDiameterMm^2 / 4`;
- `reinforcementContributionN = reinforcementAreaMm2 * draftSteelStrengthMpa`;
- `draftCapacityWithReinforcementN = concreteCapacityN + reinforcementContributionN`;
- `utilizationWithReinforcement = draftDesignDemandN / draftCapacityWithReinforcementN`.

The steel strengths are placeholders and must be checked against SP63.13330 before design use.

## Remaining Work To VERIFIED

- Replace draft steel values with verified SP63 values and clause references.
- Verify layout assumptions for stirrups, studs, links, and custom layouts.
- Collect trusted center and wall-end reinforcement examples.
- Populate expected values in verification templates.
- Add verified fixtures only after manual/WebCAD/Excel/normative evidence passes review.
- Keep reports and UI warnings visible until verified evidence exists.
