import type { VerificationCase } from './verificationCase'

export type ClippingComparisonResult = {
  passed: boolean
  clippedDeltaMm: number | null
  removedDeltaMm: number | null
  diffSummary: string[]
}

export function compareClippingVerification({
  expectedClippedPerimeterMm,
  expectedRemovedPerimeterMm,
  actualClippedPerimeterMm,
  actualRemovedPerimeterMm,
  toleranceMm,
  status,
}: {
  expectedClippedPerimeterMm: number | null | undefined
  expectedRemovedPerimeterMm: number | null | undefined
  actualClippedPerimeterMm: number
  actualRemovedPerimeterMm: number
  toleranceMm: number
  status: VerificationCase['status']
}): ClippingComparisonResult {
  const clipped = compareOptionalLength(
    expectedClippedPerimeterMm,
    actualClippedPerimeterMm,
    toleranceMm,
    status,
  )
  const removed = compareOptionalLength(
    expectedRemovedPerimeterMm,
    actualRemovedPerimeterMm,
    toleranceMm,
    status,
  )
  const diffSummary = [
    clipped.passed
      ? null
      : `clippedPerimeterMm: expected ${expectedClippedPerimeterMm}, actual ${actualClippedPerimeterMm}`,
    removed.passed
      ? null
      : `removedPerimeterMm: expected ${expectedRemovedPerimeterMm}, actual ${actualRemovedPerimeterMm}`,
  ].filter((item): item is string => item !== null)

  return {
    passed: clipped.passed && removed.passed,
    clippedDeltaMm: clipped.delta,
    removedDeltaMm: removed.delta,
    diffSummary: diffSummary.length > 0 ? diffSummary : ['Clipping comparison passed.'],
  }
}

function compareOptionalLength(
  expected: number | null | undefined,
  actual: number,
  toleranceMm: number,
  status: VerificationCase['status'],
) {
  if (expected === null || expected === undefined) {
    return {
      passed: status === 'draft',
      delta: null,
    }
  }

  const delta = Math.abs(actual - expected)

  return {
    passed: delta <= toleranceMm,
    delta,
  }
}
