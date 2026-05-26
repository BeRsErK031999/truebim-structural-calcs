import type { ControlPerimeterSegment } from '../types'

export type SegmentComparisonResult = {
  passed: boolean
  expectedCount: number | null
  actualCount: number
  expectedRemovedPerimeterMm: number | null
  actualRemovedPerimeterMm: number
  diffSummary: string[]
}

export function compareRemovedSegments({
  expectedCount,
  expectedRemovedPerimeterMm,
  actualSegments,
  toleranceMm,
}: {
  expectedCount: number | null | undefined
  expectedRemovedPerimeterMm: number | null | undefined
  actualSegments: ControlPerimeterSegment[]
  toleranceMm: number
}): SegmentComparisonResult {
  const actualCount = actualSegments.length
  const actualRemovedPerimeterMm = actualSegments.reduce(
    (sum, segment) => sum + segment.lengthMm,
    0,
  )
  const countPassed = expectedCount === null || expectedCount === undefined || expectedCount === actualCount
  const perimeterPassed =
    expectedRemovedPerimeterMm === null ||
    expectedRemovedPerimeterMm === undefined ||
    Math.abs(actualRemovedPerimeterMm - expectedRemovedPerimeterMm) <= toleranceMm
  const diffSummary = [
    countPassed
      ? null
      : `removedSegmentCount: expected ${expectedCount}, actual ${actualCount}`,
    perimeterPassed
      ? null
      : `removedPerimeterMm: expected ${expectedRemovedPerimeterMm}, actual ${actualRemovedPerimeterMm}`,
  ].filter((item): item is string => item !== null)

  return {
    passed: countPassed && perimeterPassed,
    expectedCount: expectedCount ?? null,
    actualCount,
    expectedRemovedPerimeterMm: expectedRemovedPerimeterMm ?? null,
    actualRemovedPerimeterMm,
    diffSummary: diffSummary.length > 0 ? diffSummary : ['Removed segment comparison passed.'],
  }
}
