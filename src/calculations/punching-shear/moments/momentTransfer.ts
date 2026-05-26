import type { ControlPerimeterResult, ForceInput, MomentTransferResult } from '../types'

import { calculateDraftEccentricity } from './eccentricity'
import { draftMomentWarnings } from './momentWarnings'
import { calculateDraftStressDistribution } from './stressDistribution'

export function calculateDraftMomentTransfer({
  forces,
  perimeter,
  baseStressMpa,
}: {
  forces: ForceInput
  perimeter: ControlPerimeterResult
  baseStressMpa: number
}): MomentTransferResult {
  const eccentricity = calculateDraftEccentricity(forces)
  const enabled = forces.momentXKnM > 0 || forces.momentYKnM > 0
  const stressDistribution = enabled
    ? calculateDraftStressDistribution({
        perimeter,
        baseStressMpa,
        eccentricity,
      })
    : null

  return {
    status: enabled ? 'draft' : 'disabled',
    enabled,
    eccentricityX: eccentricity.eccentricityX,
    eccentricityY: eccentricity.eccentricityY,
    momentXKnM: forces.momentXKnM,
    momentYKnM: forces.momentYKnM,
    stressDistribution,
    warnings: enabled ? draftMomentWarnings : [],
    metadata: {
      method: 'draft-linear-perimeter-redistribution',
      formulasVerified: false,
      pointCount: stressDistribution?.points.length ?? 0,
      segmentCount: stressDistribution?.segmentStresses.length ?? 0,
    },
  }
}

export function createDisabledMomentTransfer(): MomentTransferResult {
  return {
    status: 'disabled',
    enabled: false,
    eccentricityX: 0,
    eccentricityY: 0,
    momentXKnM: 0,
    momentYKnM: 0,
    stressDistribution: null,
    warnings: [],
    metadata: {
      method: 'draft-linear-perimeter-redistribution',
      formulasVerified: false,
      pointCount: 0,
      segmentCount: 0,
    },
  }
}
