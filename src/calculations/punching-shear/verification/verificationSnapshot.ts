import { calculatePunchingShear } from '../engine'
import type { PunchingShearInput, PunchingShearResult } from '../types'
import type { VerificationCase } from './verificationCase'
import { compareGeometryVerification, type GeometryComparisonResult } from './geometryComparison'

export type VerificationSnapshot = {
  title: string
  caseId: string
  status: VerificationCase['status']
  source: string
  input: PunchingShearInput
  result: PunchingShearResult
  geometryComparison: GeometryComparisonResult
  metadata: {
    format: 'Verification Snapshot'
    geometryDraftReady: boolean
    stressDraftReady: boolean
    verifiedArithmeticAvailable: boolean
    boundaryClassification: string
    warning: string
  }
}

export function buildVerificationSnapshot(verificationCase: VerificationCase): VerificationSnapshot {
  const result = calculatePunchingShear(verificationCase.input)
  const geometryComparison = compareGeometryVerification(verificationCase, result)

  return {
    title: `Verification Snapshot - ${verificationCase.title}`,
    caseId: verificationCase.id,
    status: verificationCase.status,
    source: verificationCase.source,
    input: verificationCase.input,
    result,
    geometryComparison,
    metadata: {
      format: 'Verification Snapshot',
      geometryDraftReady: result.perimeter.perimeterMm > 0,
      stressDraftReady: result.stressDistribution !== null || result.shearStressMpa !== null,
      verifiedArithmeticAvailable: verificationCase.status === 'verified',
      boundaryClassification: result.perimeter.clippingMetadata.boundaryCondition,
      warning: 'Openings and boundary clipping are draft geometry only.',
    },
  }
}
