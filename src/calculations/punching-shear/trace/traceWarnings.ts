import type { PunchingShearInput, PunchingShearResult } from '../types'

export function createTraceWarnings(input: PunchingShearInput, result: PunchingShearResult) {
  const warnings: string[] = []

  if (usesDraftGeometry(input, result)) {
    warnings.push('Draft geometry source is used for this trace step.')
  }

  if (result.draftFeatures.length > 0 || result.verificationLevel === 'draft') {
    warnings.push('Draft formula or draft verification scope is present.')
  }

  if (input.shearReinforcement.enabled || result.shearReinforcement.enabled) {
    warnings.push('Draft reinforcement data is present and is not verified.')
  }

  return warnings
}

export function usesDraftGeometry(input: PunchingShearInput, result: PunchingShearResult) {
  return (
    input.caseType !== 'center' ||
    input.openings.length > 0 ||
    Boolean(input.multipleContours?.enabled) ||
    result.perimeter.edgeAffected ||
    result.perimeter.cornerAffected ||
    result.perimeter.openingAffected
  )
}
