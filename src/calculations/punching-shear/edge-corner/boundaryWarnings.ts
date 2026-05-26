import type { EdgeCornerClassification } from './edgeClassification'

export function createBoundaryWarnings(classification: EdgeCornerClassification) {
  if (!classification.edgeAffected) {
    return []
  }

  return [
    'Openings and boundary clipping are draft geometry only.',
    classification.cornerAffected
      ? 'Corner column clipping uses draft clean-room geometry only; СП63 formulas are not verified.'
      : 'Edge column clipping uses draft clean-room geometry only; СП63 formulas are not verified.',
  ]
}
