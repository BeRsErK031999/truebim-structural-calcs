import type { VerificationCase } from './verificationCase'

export function compareEccentricityVerification({
  expectedX,
  expectedY,
  actualX,
  actualY,
  toleranceMm,
  status,
}: {
  expectedX: number | null | undefined
  expectedY: number | null | undefined
  actualX: number
  actualY: number
  toleranceMm: number
  status: VerificationCase['status']
}) {
  const x = compareOptionalNumber('eccentricityX', expectedX, actualX, toleranceMm, status)
  const y = compareOptionalNumber('eccentricityY', expectedY, actualY, toleranceMm, status)
  const failed = [x, y].filter((item) => !item.passed)

  return {
    passed: failed.length === 0,
    items: [x, y],
    diffSummary:
      failed.length === 0
        ? ['Eccentricity comparison passed.']
        : failed.map((item) => `${item.field}: expected ${String(item.expected)}, actual ${item.actual}`),
  }
}

function compareOptionalNumber(
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
