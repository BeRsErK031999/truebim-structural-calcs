import type { ShearReinforcementInput } from '../types'

import { defaultShearReinforcementInput, type NormalizedShearReinforcement } from './reinforcementTypes'

export function normalizeShearReinforcement(
  input: ShearReinforcementInput,
): NormalizedShearReinforcement {
  const hasManualValues =
    typeof input.manualAswMm2 === 'number' && typeof input.manualSwMm === 'number'

  return {
    enabled: input.enabled,
    inputMode: input.inputMode ?? (input.enabled && !hasManualValues ? 'legacy-layout' : defaultShearReinforcementInput.inputMode),
    barDiameterMm: input.barDiameterMm ?? defaultShearReinforcementInput.barDiameterMm,
    barSpacingMm: input.barSpacingMm ?? defaultShearReinforcementInput.barSpacingMm,
    rowCount: input.rowCount ?? input.rows ?? defaultShearReinforcementInput.rowCount,
    legsPerRow: input.legsPerRow ?? defaultShearReinforcementInput.legsPerRow,
    steelClass: input.steelClass ?? defaultShearReinforcementInput.steelClass,
    firstRowDistanceMm:
      input.firstRowDistanceMm ?? defaultShearReinforcementInput.firstRowDistanceMm,
    rowSpacingMm: input.rowSpacingMm ?? input.barSpacingMm ?? defaultShearReinforcementInput.rowSpacingMm,
    layoutType: input.layoutType ?? defaultShearReinforcementInput.layoutType,
    manualAswMm2: input.manualAswMm2 ?? defaultShearReinforcementInput.manualAswMm2,
    manualSwMm: input.manualSwMm ?? input.barSpacingMm ?? defaultShearReinforcementInput.manualSwMm,
  }
}
