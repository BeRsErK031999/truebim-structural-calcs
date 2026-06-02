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
    label: 'центральная колонна, только сила',
    status: 'verified',
    arithmeticSupport: 'verified',
    notes: 'Rectangular center force-only arithmetic has a trusted verified case.',
  },
  {
    id: 'center-moment-transfer',
    label: 'центральная колонна с моментами',
    status: 'partial',
    arithmeticSupport: 'partial',
    notes: 'Center rectangular Mx/My workflow is linked to draft regression cases and verified force-only evidence.',
  },
  {
    id: 'edge',
    label: 'крайние колонны',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Boundary clipping remains draft geometry.',
  },
  {
    id: 'corner',
    label: 'угловые колонны',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Corner clipping remains draft geometry.',
  },
  {
    id: 'openings',
    label: 'отверстия',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Opening tangent subtraction remains draft geometry.',
  },
  {
    id: 'wall-end',
    label: 'wall punching at wall end',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Wall-end punching currently has draft geometry only; SP63 formulas are not verified.',
  },
  {
    id: 'wall-corner',
    label: 'wall punching at wall corner',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Wall-corner punching currently has draft geometry only; SP63 formulas are not verified.',
  },
  {
    id: 'shear-reinforcement',
    label: 'поперечная арматура',
    status: 'draft',
    arithmeticSupport: 'draft',
    notes: 'Shear reinforcement is not included in the verified arithmetic layer.',
  },
  {
    id: 'round-columns',
    label: 'круглые колонны',
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

  if (input.caseType === 'wall-end') {
    features.add('wall-end')
  }

  if (input.caseType === 'wall-corner') {
    features.add('wall-corner')
  }

  if (input.shearReinforcement.enabled) {
    features.add('shear-reinforcement')
  }

  if (input.caseType === 'round' || input.roundColumn) {
    features.add('round-columns')
  }

  return Array.from(features)
}
