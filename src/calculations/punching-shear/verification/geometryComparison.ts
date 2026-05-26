import type { PunchingShearResult } from '../types'

import type { VerificationCase } from './verificationCase'

export type GeometryComparisonItem = {
  field: string
  expected: number | boolean | null | undefined
  actual: number | boolean
  passed: boolean
  delta: number | null
  tolerance: number | null
}

export type GeometryComparisonResult = {
  passed: boolean
  items: GeometryComparisonItem[]
  diffSummary: string[]
}

export function compareGeometryVerification(
  verificationCase: VerificationCase,
  result: PunchingShearResult,
): GeometryComparisonResult {
  const geometryToleranceMm =
    verificationCase.tolerance.geometryToleranceMm ?? verificationCase.tolerance.absolute
  const items: GeometryComparisonItem[] = [
    compareNumber(
      'clippedPerimeterMm',
      verificationCase.expected.clippedPerimeterMm,
      result.perimeter.clippedPerimeterMm,
      geometryToleranceMm,
      verificationCase.status,
    ),
    compareNumber(
      'removedPerimeterMm',
      verificationCase.expected.removedPerimeterMm,
      result.perimeter.removedPerimeterMm,
      geometryToleranceMm,
      verificationCase.status,
    ),
    compareNumber(
      'removedSegmentCount',
      verificationCase.expected.removedSegmentCount,
      result.perimeter.removedSegments.length,
      0,
      verificationCase.status,
    ),
    compareNumber(
      'tangentCount',
      verificationCase.expected.tangentCount,
      result.perimeter.openingTangents.length,
      0,
      verificationCase.status,
    ),
    compareBoolean(
      'openingAffected',
      verificationCase.expected.openingAffected,
      result.perimeter.openingAffected,
      verificationCase.status,
    ),
    compareBoolean(
      'edgeAffected',
      verificationCase.expected.edgeAffected,
      result.perimeter.edgeAffected,
      verificationCase.status,
    ),
    compareBoolean(
      'cornerAffected',
      verificationCase.expected.cornerAffected,
      result.perimeter.cornerAffected,
      verificationCase.status,
    ),
  ]

  return {
    passed: items.every((item) => item.passed),
    items,
    diffSummary: createDiffSummary(items),
  }
}

export function createDiffSummary(items: GeometryComparisonItem[]) {
  const failedItems = items.filter((item) => !item.passed)

  if (failedItems.length === 0) {
    return ['Geometry verification comparison passed.']
  }

  return failedItems.map((item) => {
    const delta = item.delta === null ? 'n/a' : item.delta.toFixed(6)
    const tolerance = item.tolerance === null ? 'n/a' : item.tolerance.toFixed(6)

    return `${item.field}: expected ${String(item.expected)}, actual ${String(item.actual)}, delta ${delta}, tolerance ${tolerance}`
  })
}

function compareNumber(
  field: string,
  expected: number | null | undefined,
  actual: number,
  tolerance: number,
  status: VerificationCase['status'],
): GeometryComparisonItem {
  if (expected === null || expected === undefined) {
    return {
      field,
      expected,
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

function compareBoolean(
  field: string,
  expected: boolean | null | undefined,
  actual: boolean,
  status: VerificationCase['status'],
): GeometryComparisonItem {
  if (expected === null || expected === undefined) {
    return {
      field,
      expected,
      actual,
      passed: status === 'draft',
      delta: null,
      tolerance: null,
    }
  }

  return {
    field,
    expected,
    actual,
    passed: actual === expected,
    delta: null,
    tolerance: null,
  }
}
