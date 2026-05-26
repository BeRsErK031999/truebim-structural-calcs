import { calculatePunchingShear } from '../engine'
import type { PunchingShearInput, PunchingShearResult } from '../types'
import { calculateVerificationTransferFactors } from './transferFactorComparison'
import {
  compareStressDistributionChecksum,
  createStressDistributionChecksum,
} from './stressDistributionComparison'
import { summarizeStressRegressionResults, type StressRegressionCaseStatus } from './stressRegressionSummary'
import { validateAxisConvention } from './axisConventionValidation'
import type { AxisConvention } from './axisConvention'
import type { VerificationCaseStatus, VerificationTolerance } from './verificationCase'

export type StressRegressionExpected = {
  maxStressMpa: number | null
  minStressMpa: number | null
  transferFactorX: number | null
  transferFactorY: number | null
  eccentricityX: number | null
  eccentricityY: number | null
  stressPointCount: number | null
  stressDistributionChecksum: string | null
}

export type StressRegressionCase = {
  id: string
  title: string
  source: string
  status: VerificationCaseStatus
  input: PunchingShearInput
  expected: StressRegressionExpected
  tolerance: VerificationTolerance
  axisConvention?: Partial<AxisConvention>
}

export type StressRegressionComparison = {
  field: keyof StressRegressionExpected
  expected: number | string | null
  actual: number | string
  passed: boolean
  delta: number | null
  tolerance: number | null
}

export type StressRegressionCaseResult = {
  caseId: string
  title: string
  source: string
  sourceStatus: VerificationCaseStatus
  regressionStatus: StressRegressionCaseStatus
  result: PunchingShearResult
  actual: StressRegressionExpected
  comparisons: StressRegressionComparison[]
  driftDetected: boolean
  draftPlaceholder: boolean
  axisWarnings: string[]
  warnings: string[]
}

export function runStressRegressionCase(regressionCase: StressRegressionCase): StressRegressionCaseResult {
  const result = calculatePunchingShear(regressionCase.input)
  const transferFactors = calculateVerificationTransferFactors(result.perimeter)
  const actual: StressRegressionExpected = {
    maxStressMpa: result.maxShearStressMpa,
    minStressMpa: result.minShearStressMpa,
    transferFactorX: transferFactors.factorX,
    transferFactorY: transferFactors.factorY,
    eccentricityX: result.eccentricityX,
    eccentricityY: result.eccentricityY,
    stressPointCount: result.stressDistribution?.points.length ?? 0,
    stressDistributionChecksum: createStressDistributionChecksum(result.stressDistribution),
  }
  const comparisons = compareStressRegressionValues(regressionCase, actual)
  const checksumComparison = compareStressDistributionChecksum({
    expectedChecksum: regressionCase.expected.stressDistributionChecksum,
    actualDistribution: result.stressDistribution,
    status: regressionCase.status,
  })
  const axisValidation = validateAxisConvention(regressionCase.axisConvention)
  const draftPlaceholder = hasDraftPlaceholders(regressionCase)
  const driftDetected =
    regressionCase.expected.stressDistributionChecksum !== null && !checksumComparison.passed
  const failed = comparisons.some((comparison) => !comparison.passed) || !axisValidation.passed
  const regressionStatus = getRegressionStatus({
    draftPlaceholder,
    driftDetected,
    failed,
  })

  return {
    caseId: regressionCase.id,
    title: regressionCase.title,
    source: regressionCase.source,
    sourceStatus: regressionCase.status,
    regressionStatus,
    result,
    actual,
    comparisons,
    driftDetected,
    draftPlaceholder,
    axisWarnings: axisValidation.warnings,
    warnings: [
      ...axisValidation.warnings,
      ...checksumComparison.diffSummary.filter((message) => !message.includes('comparison passed')),
    ],
  }
}

export function runStressRegressionCases(regressionCases: StressRegressionCase[]) {
  const results = regressionCases.map(runStressRegressionCase)

  return {
    results,
    summary: summarizeStressRegressionResults(results),
  }
}

function compareStressRegressionValues(
  regressionCase: StressRegressionCase,
  actual: StressRegressionExpected,
): StressRegressionComparison[] {
  return [
    compareNumber('maxStressMpa', regressionCase.expected.maxStressMpa, actual.maxStressMpa ?? Number.NaN, regressionCase),
    compareNumber('minStressMpa', regressionCase.expected.minStressMpa, actual.minStressMpa ?? Number.NaN, regressionCase),
    compareNumber(
      'transferFactorX',
      regressionCase.expected.transferFactorX,
      actual.transferFactorX ?? Number.NaN,
      regressionCase,
    ),
    compareNumber(
      'transferFactorY',
      regressionCase.expected.transferFactorY,
      actual.transferFactorY ?? Number.NaN,
      regressionCase,
    ),
    compareNumber(
      'eccentricityX',
      regressionCase.expected.eccentricityX,
      actual.eccentricityX ?? Number.NaN,
      regressionCase,
    ),
    compareNumber(
      'eccentricityY',
      regressionCase.expected.eccentricityY,
      actual.eccentricityY ?? Number.NaN,
      regressionCase,
    ),
    compareNumber(
      'stressPointCount',
      regressionCase.expected.stressPointCount,
      actual.stressPointCount ?? Number.NaN,
      regressionCase,
      0,
    ),
    compareChecksum(
      regressionCase.expected.stressDistributionChecksum,
      actual.stressDistributionChecksum ?? 'disabled',
      regressionCase.status,
    ),
  ]
}

function compareNumber(
  field: keyof StressRegressionExpected,
  expected: number | null,
  actual: number,
  regressionCase: StressRegressionCase,
  absoluteToleranceOverride?: number,
): StressRegressionComparison {
  if (expected === null) {
    return { field, expected, actual, passed: regressionCase.status === 'draft', delta: null, tolerance: null }
  }

  const tolerancePercent =
    field === 'maxStressMpa' || field === 'minStressMpa'
      ? regressionCase.tolerance.stressTolerancePercent ?? regressionCase.tolerance.relativePercent
      : regressionCase.tolerance.relativePercent
  const tolerance =
    absoluteToleranceOverride ?? Math.max(Math.abs(expected) * (tolerancePercent / 100), regressionCase.tolerance.absolute)
  const delta = Math.abs(actual - expected)

  return { field, expected, actual, passed: Number.isFinite(actual) && delta <= tolerance, delta, tolerance }
}

function compareChecksum(
  expected: string | null,
  actual: string,
  status: VerificationCaseStatus,
): StressRegressionComparison {
  if (expected === null) {
    return { field: 'stressDistributionChecksum', expected, actual, passed: status === 'draft', delta: null, tolerance: null }
  }

  return {
    field: 'stressDistributionChecksum',
    expected,
    actual,
    passed: expected === actual,
    delta: null,
    tolerance: null,
  }
}

function hasDraftPlaceholders(regressionCase: StressRegressionCase) {
  return Object.values(regressionCase.expected).some((value) => value === null)
}

function getRegressionStatus({
  draftPlaceholder,
  driftDetected,
  failed,
}: {
  draftPlaceholder: boolean
  driftDetected: boolean
  failed: boolean
}): StressRegressionCaseStatus {
  if (draftPlaceholder) {
    return 'draft-placeholder'
  }
  if (driftDetected) {
    return 'drifted'
  }
  if (failed) {
    return 'failed'
  }

  return 'passed'
}
