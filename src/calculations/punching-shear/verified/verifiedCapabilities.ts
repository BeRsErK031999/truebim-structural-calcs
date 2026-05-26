import type { PunchingShearInput } from '../types'

import type { VerifiedCapabilityStatus, VerifiedFeatureId } from './verifiedMode'

export type VerifiedCapability = {
  id: VerifiedFeatureId
  label: string
  status: VerifiedCapabilityStatus
  arithmeticSupport: VerifiedCapabilityStatus
  notes: string
}

export const verifiedCapabilityMatrix: VerifiedCapability[] = [
  {
    id: 'center-force-only',
    label: 'center force-only',
    status: 'verified',
    arithmeticSupport: 'verified',
    notes: 'Rectangular center force-only arithmetic has a trusted verified case.',
  },
  {
    id: 'center-moment-transfer',
    label: 'center moment transfer',
    status: 'partial',
    arithmeticSupport: 'partial',
    notes: 'Center rectangular Mx/My workflow is linked to draft regression cases and verified force-only evidence.',
  },
  {
    id: 'edge',
    label: 'edge columns',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Boundary clipping remains draft geometry.',
  },
  {
    id: 'corner',
    label: 'corner columns',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Corner clipping remains draft geometry.',
  },
  {
    id: 'openings',
    label: 'openings',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Opening tangent subtraction remains draft geometry.',
  },
  {
    id: 'shear-reinforcement',
    label: 'shear reinforcement',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Shear reinforcement is not included in the verified arithmetic layer.',
  },
  {
    id: 'round-columns',
    label: 'round columns',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Round column geometry is outside the verified transition scope.',
  },
]

export function getVerifiedCapabilityMatrix() {
  return verifiedCapabilityMatrix
}

export function getCapability(featureId: VerifiedFeatureId) {
  return verifiedCapabilityMatrix.find((capability) => capability.id === featureId)
}

export function detectInputFeatures(input: PunchingShearInput): VerifiedFeatureId[] {
  const features = new Set<VerifiedFeatureId>()
  const hasMoments = input.forces.momentXKnM !== 0 || input.forces.momentYKnM !== 0

  if (input.caseType === 'center' && input.rectColumn && !hasMoments) {
    features.add('center-force-only')
  }

  if (input.caseType === 'center' && input.rectColumn && hasMoments) {
    features.add('center-force-only')
    features.add('center-moment-transfer')
  }

  if (input.caseType === 'edge' || input.slabEdges) {
    features.add('edge')
  }

  if (input.caseType === 'corner') {
    features.add('corner')
  }

  if (input.caseType === 'opening' || input.openings.length > 0) {
    features.add('openings')
  }

  if (input.shearReinforcement.enabled) {
    features.add('shear-reinforcement')
  }

  if (input.caseType === 'round' || input.roundColumn) {
    features.add('round-columns')
  }

  return Array.from(features)
}
