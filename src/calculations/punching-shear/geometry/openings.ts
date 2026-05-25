import type { OpeningInput } from '../types'

export function summarizeOpenings(openings: OpeningInput[]) {
  return {
    count: openings.length,
    warnings: openings.length > 0 ? ['Opening geometry is not implemented yet'] : [],
  }
}
