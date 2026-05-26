import type { StressDistribution, StressPoint } from '../types'

export function createStressDistributionChecksum(distribution: StressDistribution | null) {
  if (!distribution) {
    return 'disabled'
  }

  const orderedPoints = orderStressPointsByPerimeterTraversal(distribution.points)
  const stressValues = orderedPoints
    .map((point) => `${point.id}:${roundChecksumValue(point.stressMpa, 6)}`)
    .join('|')
  const coordinates = orderedPoints
    .map((point) => `${roundChecksumValue(point.position.x, 3)},${roundChecksumValue(point.position.y, 3)}`)
    .join('|')

  return `count=${orderedPoints.length};coords=${coordinates};stress=${stressValues}`
}

export function compareStressDistributionChecksum({
  expectedChecksum,
  actualDistribution,
  status,
}: {
  expectedChecksum: string | null | undefined
  actualDistribution: StressDistribution | null
  status: 'draft' | 'verified' | 'rejected'
}) {
  const actualChecksum = createStressDistributionChecksum(actualDistribution)

  if (expectedChecksum === null || expectedChecksum === undefined) {
    return {
      passed: status === 'draft',
      expectedChecksum: expectedChecksum ?? null,
      actualChecksum,
      diffSummary: ['Stress distribution checksum is waiting for trusted validation.'],
    }
  }

  const passed = expectedChecksum === actualChecksum

  return {
    passed,
    expectedChecksum,
    actualChecksum,
    diffSummary: passed
      ? ['Stress distribution checksum comparison passed.']
      : [`stressDistributionChecksum: expected ${expectedChecksum}, actual ${actualChecksum}`],
  }
}

function orderStressPointsByPerimeterTraversal(points: StressPoint[]) {
  return [...points].sort((first, second) => {
    const segmentOrder = first.sourceSegmentId.localeCompare(second.sourceSegmentId)

    if (segmentOrder !== 0) {
      return segmentOrder
    }

    return first.id.localeCompare(second.id)
  })
}

function roundChecksumValue(value: number, digits: number) {
  return value.toFixed(digits)
}
