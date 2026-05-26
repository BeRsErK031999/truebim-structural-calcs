import type { DraftPerimeterInertia } from './polarInertia'

export type DraftTransferFactors = {
  factorX: number
  factorY: number
}

export function calculateDraftTransferFactors(
  inertia: DraftPerimeterInertia,
): DraftTransferFactors {
  return {
    factorX: 1 / inertia.radiusXSquaredMm2,
    factorY: 1 / inertia.radiusYSquaredMm2,
  }
}
