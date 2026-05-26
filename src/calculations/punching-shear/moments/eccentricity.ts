import type { ForceInput } from '../types'

export type EccentricityResult = {
  eccentricityX: number
  eccentricityY: number
}

export function calculateDraftEccentricity(forces: ForceInput): EccentricityResult {
  if (forces.axialForceKn <= 0) {
    return {
      eccentricityX: 0,
      eccentricityY: 0,
    }
  }

  return {
    eccentricityX: (forces.momentYKnM / forces.axialForceKn) * 1000,
    eccentricityY: (forces.momentXKnM / forces.axialForceKn) * 1000,
  }
}
