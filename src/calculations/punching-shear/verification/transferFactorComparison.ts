import type { ControlPerimeterResult } from '../types'
import { calculateDraftPerimeterInertia } from '../moments/polarInertia'
import { calculateDraftTransferFactors } from '../moments/transferFactors'
import type { VerificationCase } from './verificationCase'

export function calculateVerificationTransferFactors(perimeter: ControlPerimeterResult) {
  return calculateDraftTransferFactors(calculateDraftPerimeterInertia(perimeter))
}

export function compareTransferFactors({
  expectedFactorX,
  expectedFactorY,
  perimeter,
  tolerance,
  status,
}: {
  expectedFactorX: number | null | undefined
  expectedFactorY: number | null | undefined
  perimeter: ControlPerimeterResult
  tolerance: number
  status: VerificationCase['status']
}) {
  const actual = calculateVerificationTransferFactors(perimeter)
  const x = compareOptionalFactor('transferFactorX', expectedFactorX, actual.factorX, tolerance, status)
  const y = compareOptionalFactor('transferFactorY', expectedFactorY, actual.factorY, tolerance, status)
  const failed = [x, y].filter((item) => !item.passed)

  return {
    passed: failed.length === 0,
    actual,
    items: [x, y],
    diffSummary:
      failed.length === 0
        ? ['Transfer factor comparison passed.']
        : failed.map((item) => `${item.field}: expected ${String(item.expected)}, actual ${item.actual}`),
  }
}

function compareOptionalFactor(
  field: string,
  expected: number | null | undefined,
  actual: number,
  tolerance: number,
  status: VerificationCase['status'],
) {
  if (expected === null || expected === undefined) {
    return {
      field,
      expected: expected ?? null,
      actual,
      passed: status === 'draft',
      delta: null,
      tolerance: null,
    }
  }

  const delta = Math.abs(actual - expected)

  return {
    field,
    expected,
    actual,
    passed: delta <= tolerance,
    delta,
    tolerance,
  }
}
