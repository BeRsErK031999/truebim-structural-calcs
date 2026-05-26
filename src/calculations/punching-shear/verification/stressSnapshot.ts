import { calculatePunchingShear } from '../engine'
import type { PunchingShearInput, PunchingShearResult } from '../types'
import type { VerificationCase } from './verificationCase'
import { compareMomentStressVerification, type StressComparisonResult } from './stressComparison'
import { calculateVerificationTransferFactors } from './transferFactorComparison'
import { createStressDistributionChecksum } from './stressDistributionComparison'

export type StressSnapshot = {
  title: string
  caseId: string
  status: VerificationCase['status']
  source: string
  input: PunchingShearInput
  result: PunchingShearResult
  stressComparison: StressComparisonResult
  metadata: {
    format: 'Stress Distribution Snapshot'
    transferFactorX: number
    transferFactorY: number
    stressDistributionChecksum: string
    stressPointCount: number
    verifiedArithmeticAvailable: boolean
    warning: string
  }
}

export function buildStressSnapshot(verificationCase: VerificationCase): StressSnapshot {
  const result = calculatePunchingShear(verificationCase.input)
  const transferFactors = calculateVerificationTransferFactors(result.perimeter)

  return {
    title: `Stress Distribution Snapshot - ${verificationCase.title}`,
    caseId: verificationCase.id,
    status: verificationCase.status,
    source: verificationCase.source,
    input: verificationCase.input,
    result,
    stressComparison: compareMomentStressVerification(verificationCase, result),
    metadata: {
      format: 'Stress Distribution Snapshot',
      transferFactorX: transferFactors.factorX,
      transferFactorY: transferFactors.factorY,
      stressDistributionChecksum: createStressDistributionChecksum(result.stressDistribution),
      stressPointCount: result.stressDistribution?.points.length ?? 0,
      verifiedArithmeticAvailable: verificationCase.status === 'verified',
      warning: 'Moment transfer and stress redistribution are draft-only.',
    },
  }
}
