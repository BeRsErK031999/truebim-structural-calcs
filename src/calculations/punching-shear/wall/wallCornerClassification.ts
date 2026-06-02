import type { PunchingShearInput, WallCornerOrientation } from '../types'

export type WallCornerPunchingClassification = {
  caseType: 'wall-corner'
  status: 'draft'
  orientation: WallCornerOrientation | null
  geometrySupported: boolean
  formulasVerified: false
  warnings: string[]
}

export function classifyWallCornerPunching(
  input: PunchingShearInput,
): WallCornerPunchingClassification {
  const orientation = input.wallCorner?.orientation ?? null
  const geometrySupported = input.caseType === 'wall-corner' && Boolean(input.wallCorner)

  return {
    caseType: 'wall-corner',
    status: 'draft',
    orientation,
    geometrySupported,
    formulasVerified: false,
    warnings: [
      'Wall-corner punching geometry is draft-only and not verified against SP63',
      'Wall-corner control perimeter is a geometry preparation model; formulas remain draft',
    ],
  }
}
