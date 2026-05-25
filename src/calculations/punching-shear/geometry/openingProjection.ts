import type { OpeningInput } from '../types'

export type OpeningProjection = {
  openingId: string
  status: 'pending'
}

export function projectOpeningToContour(opening: OpeningInput): OpeningProjection {
  return {
    openingId: opening.id,
    status: 'pending',
  }
}
