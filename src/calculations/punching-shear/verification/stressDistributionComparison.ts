import type { StressDistribution } from '../types'

export function createStressDistributionChecksum(distribution: StressDistribution | null) {
  if (!distribution) {
    return 'disabled'
  }

  return distribution.points
    .map((point) => `${point.position.x.toFixed(3)},${point.position.y.toFixed(3)},${point.stressMpa.toFixed(6)}`)
    .join('|')
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
