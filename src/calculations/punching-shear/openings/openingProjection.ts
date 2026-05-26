import type { OpeningInput } from '../types'
import type { OpeningTangentCone } from './tangentConstruction'
import { constructOpeningTangents } from './tangentConstruction'

export type OpeningProjection = {
  openingId: string
  cone: OpeningTangentCone
}

export function projectOpeningToContour(opening: OpeningInput): OpeningProjection {
  return {
    openingId: opening.id,
    cone: constructOpeningTangents(opening),
  }
}
