import { calculatePunchingShear } from '../engine'
import type { PunchingShearResult } from '../types'

import type { VerificationCase, VerificationExpected } from './verificationCase'
import { canUseVerificationStatus } from './verificationCase'
import { summarizeVerificationResults } from './verificationSummary'

type NumericExpectedField =
  | 'controlPerimeterMm'
  | 'effectiveDepthMm'
  | 'shearStressMpa'
  | 'utilizationRatio'
type ComparedField = keyof VerificationExpected

export type VerificationFieldComparison = {
  field: ComparedField
  expected: number | boolean | null
  actual: number | boolean | null
  passed: boolean
  delta: number | null
  tolerance: number | null
}

export type VerificationCaseResult = {
  caseId: string
  title: string
  status: VerificationCase['status']
  source: string
  standard: string
  fieldResults: VerificationFieldComparison[]
  passed: boolean
  statusAllowed: boolean
  verificationLevel: PunchingShearResult['verificationLevel']
  verifiedFeatures: PunchingShearResult['verifiedFeatures']
  draftFeatures: PunchingShearResult['draftFeatures']
  verificationEvidenceIds: PunchingShearResult['verificationEvidenceIds']
  actual: VerificationExpected
}

const numericExpectedFields: NumericExpectedField[] = [
  'controlPerimeterMm',
  'effectiveDepthMm',
  'shearStressMpa',
  'utilizationRatio',
]

export function runVerificationCase(verificationCase: VerificationCase): VerificationCaseResult {
  const calculationResult = calculatePunchingShear(verificationCase.input)
  const actual = extractExpectedFields(calculationResult)
  const fieldResults: VerificationFieldComparison[] = [
    ...numericExpectedFields.map((field) =>
      compareNumericField(field, actual[field] ?? Number.NaN, verificationCase.expected[field], verificationCase),
    ),
    {
      field: 'passed',
      expected: verificationCase.expected.passed,
      actual: actual.passed,
      passed:
        verificationCase.expected.passed === null
          ? verificationCase.status === 'draft'
          : actual.passed === verificationCase.expected.passed,
      delta: null,
      tolerance: null,
    },
  ]
  const statusAllowed = canUseVerificationStatus(verificationCase.status, verificationCase.source)

  return {
    caseId: verificationCase.id,
    title: verificationCase.title,
    status: verificationCase.status,
    source: verificationCase.source,
    standard: verificationCase.standard,
    fieldResults,
    passed: statusAllowed && fieldResults.every((fieldResult) => fieldResult.passed),
    statusAllowed,
    verificationLevel: calculationResult.verificationLevel,
    verifiedFeatures: calculationResult.verifiedFeatures,
    draftFeatures: calculationResult.draftFeatures,
    verificationEvidenceIds: calculationResult.verificationEvidenceIds,
    actual,
  }
}

export function runVerificationCases(cases: VerificationCase[]) {
  const results = cases.map(runVerificationCase)

  return {
    results,
    summary: summarizeVerificationResults(results),
  }
}

function extractExpectedFields(result: PunchingShearResult): VerificationExpected {
  return {
    controlPerimeterMm: result.controlPerimeterMm ?? Number.NaN,
    effectiveDepthMm: result.effectiveDepthMm ?? Number.NaN,
    shearStressMpa: result.shearStressMpa ?? Number.NaN,
    utilizationRatio: result.utilizationRatio ?? Number.NaN,
    passed: result.passed ?? false,
  }
}

function compareNumericField(
  field: NumericExpectedField,
  actual: number,
  expected: number | null,
  verificationCase: VerificationCase,
): VerificationFieldComparison {
  if (expected === null) {
    return {
      field,
      expected,
      actual,
      passed: verificationCase.status === 'draft',
      delta: null,
      tolerance: null,
    }
  }

  const delta = Math.abs(actual - expected)
  const tolerancePercent =
    field === 'shearStressMpa' || field === 'utilizationRatio'
      ? verificationCase.tolerance.stressTolerancePercent ?? verificationCase.tolerance.relativePercent
      : verificationCase.tolerance.relativePercent
  const relativeTolerance = Math.abs(expected) * (tolerancePercent / 100)
  const tolerance = Math.max(relativeTolerance, verificationCase.tolerance.absolute)

  return {
    field,
    expected,
    actual,
    passed: Number.isFinite(actual) && delta <= tolerance,
    delta,
    tolerance,
  }
}
