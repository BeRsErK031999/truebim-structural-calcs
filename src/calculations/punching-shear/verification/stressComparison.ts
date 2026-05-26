import type { PunchingShearResult } from '../types'
import type { VerificationCase } from './verificationCase'
import { compareEccentricityVerification } from './eccentricityComparison'
import { compareStressDistributionChecksum } from './stressDistributionComparison'
import { compareTransferFactors } from './transferFactorComparison'

export type StressComparisonItem = {
  field: string
  expected: number | string | null | undefined
  actual: number | string
  passed: boolean
  delta: number | null
  tolerance: number | null
}

export type StressComparisonResult = {
  passed: boolean
  items: StressComparisonItem[]
  diffSummary: string[]
}

export function compareMomentStressVerification(
  verificationCase: VerificationCase,
  result: PunchingShearResult,
): StressComparisonResult {
  const stressTolerancePercent =
    verificationCase.tolerance.stressTolerancePercent ?? verificationCase.tolerance.relativePercent
  const eccentricityToleranceMm =
    verificationCase.tolerance.eccentricityToleranceMm ?? verificationCase.tolerance.absolute
  const items: StressComparisonItem[] = [
    compareStressNumber(
      'maxShearStressMpa',
      verificationCase.expected.maxShearStressMpa,
      result.maxShearStressMpa ?? Number.NaN,
      stressTolerancePercent,
      verificationCase.status,
    ),
    compareStressNumber(
      'minShearStressMpa',
      verificationCase.expected.minShearStressMpa,
      result.minShearStressMpa ?? Number.NaN,
      stressTolerancePercent,
      verificationCase.status,
    ),
    compareAbsoluteNumber(
      'stressPointCount',
      verificationCase.expected.stressPointCount,
      result.stressDistribution?.points.length ?? 0,
      0,
      verificationCase.status,
    ),
  ]
  const eccentricity = compareEccentricityVerification({
    expectedX: verificationCase.expected.eccentricityX,
    expectedY: verificationCase.expected.eccentricityY,
    actualX: result.eccentricityX ?? 0,
    actualY: result.eccentricityY ?? 0,
    toleranceMm: eccentricityToleranceMm,
    status: verificationCase.status,
  })
  const transferFactors = compareTransferFactors({
    expectedFactorX: verificationCase.expected.transferFactorX,
    expectedFactorY: verificationCase.expected.transferFactorY,
    perimeter: result.perimeter,
    tolerance: verificationCase.tolerance.absolute,
    status: verificationCase.status,
  })
  const checksum = compareStressDistributionChecksum({
    expectedChecksum: verificationCase.expected.stressDistributionChecksum,
    actualDistribution: result.stressDistribution,
    status: verificationCase.status,
  })
  const allPassed =
    items.every((item) => item.passed) &&
    eccentricity.passed &&
    transferFactors.passed &&
    checksum.passed

  return {
    passed: allPassed,
    items,
    diffSummary: [
      ...createStressDiffSummary(items),
      ...eccentricity.diffSummary,
      ...transferFactors.diffSummary,
      ...checksum.diffSummary,
    ],
  }
}

function compareStressNumber(
  field: string,
  expected: number | null | undefined,
  actual: number,
  tolerancePercent: number,
  status: VerificationCase['status'],
): StressComparisonItem {
  if (expected === null || expected === undefined) {
    return { field, expected, actual, passed: status === 'draft', delta: null, tolerance: null }
  }

  const delta = Math.abs(actual - expected)
  const tolerance = Math.abs(expected) * (tolerancePercent / 100)

  return { field, expected, actual, passed: delta <= tolerance, delta, tolerance }
}

function compareAbsoluteNumber(
  field: string,
  expected: number | null | undefined,
  actual: number,
  tolerance: number,
  status: VerificationCase['status'],
): StressComparisonItem {
  if (expected === null || expected === undefined) {
    return { field, expected, actual, passed: status === 'draft', delta: null, tolerance: null }
  }

  const delta = Math.abs(actual - expected)

  return { field, expected, actual, passed: delta <= tolerance, delta, tolerance }
}

function createStressDiffSummary(items: StressComparisonItem[]) {
  const failed = items.filter((item) => !item.passed)

  return failed.length === 0
    ? ['Stress scalar comparison passed.']
    : failed.map((item) => `${item.field}: expected ${String(item.expected)}, actual ${item.actual}`)
}
