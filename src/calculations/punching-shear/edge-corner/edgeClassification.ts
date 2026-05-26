import type { PunchingShearCaseType, SlabEdgesInput } from '../types'
import { classifySlabBoundary } from './slabBoundary'

export type EdgeCornerClassification = {
  boundaryCondition: 'center' | 'edge' | 'corner' | 'unsupported'
  edgeAffected: boolean
  cornerAffected: boolean
  activeBoundaryCount: number
}

export function classifyEdgeCornerCondition(
  caseType: PunchingShearCaseType,
  slabEdges?: SlabEdgesInput,
): EdgeCornerClassification {
  if (caseType === 'round') {
    return {
      boundaryCondition: 'unsupported',
      edgeAffected: false,
      cornerAffected: false,
      activeBoundaryCount: 0,
    }
  }

  const boundary = classifySlabBoundary(slabEdges)
  const activeBoundaryCount = boundary.activeEdges.length
  const cornerAffected = caseType === 'corner' || activeBoundaryCount >= 2
  const edgeAffected = caseType === 'edge' || caseType === 'corner' || activeBoundaryCount > 0

  return {
    boundaryCondition: cornerAffected ? 'corner' : edgeAffected ? 'edge' : 'center',
    edgeAffected,
    cornerAffected,
    activeBoundaryCount,
  }
}
