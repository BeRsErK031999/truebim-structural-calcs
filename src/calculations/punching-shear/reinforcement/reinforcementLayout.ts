import type { ShearReinforcementInput } from '../types'

import { defaultShearReinforcementInput, type NormalizedShearReinforcement } from './reinforcementTypes'

export function normalizeShearReinforcement(
  input: ShearReinforcementInput,
): NormalizedShearReinforcement {
  return {
    enabled: input.enabled,
    barDiameterMm: input.barDiameterMm ?? defaultShearReinforcementInput.barDiameterMm,
    barSpacingMm: input.barSpacingMm ?? defaultShearReinforcementInput.barSpacingMm,
    rowCount: input.rowCount ?? input.rows ?? defaultShearReinforcementInput.rowCount,
    legsPerRow: input.legsPerRow ?? defaultShearReinforcementInput.legsPerRow,
    steelClass: input.steelClass ?? defaultShearReinforcementInput.steelClass,
    firstRowDistanceMm:
      input.firstRowDistanceMm ?? defaultShearReinforcementInput.firstRowDistanceMm,
    rowSpacingMm: input.rowSpacingMm ?? input.barSpacingMm ?? defaultShearReinforcementInput.rowSpacingMm,
    layoutType: input.layoutType ?? defaultShearReinforcementInput.layoutType,
  }
}
