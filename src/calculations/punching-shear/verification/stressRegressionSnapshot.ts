import type { StressPoint } from '../types'
import type { StressRegressionCase, StressRegressionCaseResult } from './stressRegressionRunner'

export type StressRegressionSnapshot = {
  title: string
  caseId: string
  regressionStatus: StressRegressionCaseResult['regressionStatus']
  currentStressPoints: StressPoint[]
  expectedStressPoints: StressRegressionExpectedPoint[]
  diffMarkers: StressRegressionDiffMarker[]
  metadata: {
    source: string
    checksum: string | null
    driftDetected: boolean
    eccentricityX: number | null
    eccentricityY: number | null
    transferFactorX: number | null
    transferFactorY: number | null
    warnings: string[]
  }
  result: StressRegressionCaseResult['result']
}

export type StressRegressionExpectedPoint = {
  id: string
  x: number
  y: number
  stressMpa: number
}

export type StressRegressionDiffMarker = {
  id: string
  x: number
  y: number
  deltaStressMpa: number
}

export function buildStressRegressionSnapshot(
  regressionCase: StressRegressionCase,
  regressionResult: StressRegressionCaseResult,
): StressRegressionSnapshot {
  const expectedStressPoints = getExpectedStressPoints(regressionCase)

  return {
    title: `Stress Regression Snapshot - ${regressionCase.title}`,
    caseId: regressionCase.id,
    regressionStatus: regressionResult.regressionStatus,
    currentStressPoints: regressionResult.result.stressDistribution?.points ?? [],
    expectedStressPoints,
    diffMarkers: buildDiffMarkers(regressionResult.result.stressDistribution?.points ?? [], expectedStressPoints),
    metadata: {
      source: regressionCase.source,
      checksum: regressionResult.actual.stressDistributionChecksum,
      driftDetected: regressionResult.driftDetected,
      eccentricityX: regressionResult.actual.eccentricityX,
      eccentricityY: regressionResult.actual.eccentricityY,
      transferFactorX: regressionResult.actual.transferFactorX,
      transferFactorY: regressionResult.actual.transferFactorY,
      warnings: regressionResult.warnings,
    },
    result: regressionResult.result,
  }
}

function getExpectedStressPoints(regressionCase: StressRegressionCase) {
  const maybeExpectedPoints = (
    regressionCase.expected as StressRegressionCase['expected'] & {
      stressPoints?: StressRegressionExpectedPoint[]
    }
  ).stressPoints

  return maybeExpectedPoints ?? []
}

function buildDiffMarkers(
  currentStressPoints: StressPoint[],
  expectedStressPoints: StressRegressionExpectedPoint[],
) {
  return expectedStressPoints.flatMap((expectedPoint) => {
    const currentPoint = currentStressPoints.find((point) => point.id === expectedPoint.id)

    if (!currentPoint) {
      return []
    }

    const deltaStressMpa = currentPoint.stressMpa - expectedPoint.stressMpa

    return Math.abs(deltaStressMpa) > 0.000001
      ? [{
          id: expectedPoint.id,
          x: expectedPoint.x,
          y: expectedPoint.y,
          deltaStressMpa,
        }]
      : []
  })
}
