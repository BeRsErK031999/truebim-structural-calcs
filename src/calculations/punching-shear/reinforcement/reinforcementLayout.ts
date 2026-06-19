import type { ShearReinforcementInput } from '../types'

import { defaultShearReinforcementInput, type NormalizedShearReinforcement } from './reinforcementTypes'

export function normalizeShearReinforcement(
  input: ShearReinforcementInput,
): NormalizedShearReinforcement {
  const legacyBarCountAswMm2 =
    typeof input.simpleBarCount === 'number' && typeof input.barDiameterMm === 'number'
      ? input.simpleBarCount * Math.PI * input.barDiameterMm ** 2 / 4
      : null
  const hasManualValues =
    typeof input.manualAswMm2 === 'number' && typeof input.manualSwMm === 'number'
  const requestedInputMode =
    input.inputMode ??
    (input.enabled && !hasManualValues && legacyBarCountAswMm2 === null
      ? 'legacy-layout'
      : defaultShearReinforcementInput.inputMode)
  const inputMode =
    requestedInputMode === 'legacy-layout'
      ? 'legacy-layout'
      : 'manual'

  return {
    enabled: input.enabled,
    inputMode,
    barDiameterMm: input.barDiameterMm ?? defaultShearReinforcementInput.barDiameterMm,
    simpleBarCount: input.simpleBarCount ?? defaultShearReinforcementInput.simpleBarCount,
    barSpacingMm: input.barSpacingMm ?? defaultShearReinforcementInput.barSpacingMm,
    rowCount: input.rowCount ?? input.rows ?? defaultShearReinforcementInput.rowCount,
    legsPerRow: input.legsPerRow ?? defaultShearReinforcementInput.legsPerRow,
    steelClass: input.steelClass ?? defaultShearReinforcementInput.steelClass,
    firstRowDistanceMm:
      input.firstRowDistanceMm ?? defaultShearReinforcementInput.firstRowDistanceMm,
    rowSpacingMm: input.rowSpacingMm ?? input.barSpacingMm ?? defaultShearReinforcementInput.rowSpacingMm,
    layoutType: input.layoutType ?? defaultShearReinforcementInput.layoutType,
    manualAswMm2:
      (requestedInputMode === 'bar-count' ? legacyBarCountAswMm2 : null) ??
      input.manualAswMm2 ??
      defaultShearReinforcementInput.manualAswMm2,
    manualSwMm: input.manualSwMm ?? input.barSpacingMm ?? defaultShearReinforcementInput.manualSwMm,
  }
}
