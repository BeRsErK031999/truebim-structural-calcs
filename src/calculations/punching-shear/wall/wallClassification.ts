import type { PunchingShearInput } from '../types'

export type WallPunchingClassification = {
  caseType: 'wall-end'
  status: 'draft'
  geometrySupported: boolean
  formulasVerified: false
  warnings: string[]
}

export function classifyWallPunching(input: PunchingShearInput): WallPunchingClassification {
  const geometrySupported = input.caseType === 'wall-end' && Boolean(input.wall)

  return {
    caseType: 'wall-end',
    status: 'draft',
    geometrySupported,
    formulasVerified: false,
    warnings: [
      'Wall-end punching geometry is draft-only and not verified against SP63',
      'Wall-end control perimeter is a geometry preparation model; formulas remain draft',
    ],
  }
}
