import { describe, expect, it } from 'vitest'

import { calculatePunchingShear } from '../../engine'
import { defaultPunchingShearInput } from '../../defaults'
import { compareEccentricityVerification } from '../eccentricityComparison'
import { compareMomentStressVerification } from '../stressComparison'
import { createStressDistributionChecksum } from '../stressDistributionComparison'
import { buildStressSnapshot } from '../stressSnapshot'
import { buildStressSnapshotHtml } from '../stressSnapshotHtml'
import { compareTransferFactors, calculateVerificationTransferFactors } from '../transferFactorComparison'
import { punchingShearVerificationCases } from '../verificationDataset'
import { runVerificationCase } from '../verificationRunner'
import type { VerificationCase } from '../verificationCase'

const momentInput = {
  ...defaultPunchingShearInput,
  forces: {
    axialForceKn: 420,
    momentXKnM: 12,
    momentYKnM: 8,
  },
}

function createMomentCase(): VerificationCase {
  const result = calculatePunchingShear(momentInput)
  const transferFactors = calculateVerificationTransferFactors(result.perimeter)

  return {
    id: 'test-center-mx-my',
    title: 'Test center Mx/My',
    source: 'internal draft arithmetic, not SP63 verified',
    standard: 'SP63 pending verification',
    caseType: 'center',
    input: momentInput,
    expected: {
      controlPerimeterMm: result.controlPerimeterMm,
      effectiveDepthMm: result.effectiveDepthMm,
      shearStressMpa: result.shearStressMpa,
      utilizationRatio: result.utilizationRatio,
      maxShearStressMpa: result.maxShearStressMpa,
      minShearStressMpa: result.minShearStressMpa,
      eccentricityX: result.eccentricityX,
      eccentricityY: result.eccentricityY,
      stressPointCount: result.stressDistribution?.points.length ?? 0,
      stressDistributionChecksum: createStressDistributionChecksum(result.stressDistribution),
      transferFactorX: transferFactors.factorX,
      transferFactorY: transferFactors.factorY,
      passed: result.passed,
    },
    tolerance: {
      relativePercent: 0.000001,
      absolute: 0.000001,
      stressTolerancePercent: 0.000001,
      eccentricityToleranceMm: 0.000001,
    },
    notes: 'Draft moment comparison fixture.',
    status: 'draft',
  }
}

describe('moment transfer verification comparison', () => {
  it('passes matching stress comparison values', () => {
    const verificationCase = createMomentCase()
    const result = calculatePunchingShear(verificationCase.input)
    const comparison = compareMomentStressVerification(verificationCase, result)

    expect(comparison.passed).toBe(true)
    expect(comparison.diffSummary).toContain('Stress scalar comparison passed.')
  })

  it('fails and reports readable stress diff summary', () => {
    const verificationCase = createMomentCase()
    const result = calculatePunchingShear(verificationCase.input)
    const comparison = compareMomentStressVerification(
      {
        ...verificationCase,
        expected: {
          ...verificationCase.expected,
          maxShearStressMpa: 999,
        },
      },
      result,
    )

    expect(comparison.passed).toBe(false)
    expect(comparison.diffSummary.some((item) => item.includes('maxShearStressMpa'))).toBe(true)
  })

  it('compares eccentricity with tolerance', () => {
    const result = calculatePunchingShear(momentInput)
    const comparison = compareEccentricityVerification({
      expectedX: result.eccentricityX,
      expectedY: result.eccentricityY,
      actualX: result.eccentricityX ?? 0,
      actualY: result.eccentricityY ?? 0,
      toleranceMm: 0.000001,
      status: 'draft',
    })

    expect(comparison.passed).toBe(true)
  })

  it('compares transfer factors', () => {
    const result = calculatePunchingShear(momentInput)
    const transferFactors = calculateVerificationTransferFactors(result.perimeter)
    const comparison = compareTransferFactors({
      expectedFactorX: transferFactors.factorX,
      expectedFactorY: transferFactors.factorY,
      perimeter: result.perimeter,
      tolerance: 0.000001,
      status: 'draft',
    })

    expect(comparison.passed).toBe(true)
  })

  it('generates stress snapshot HTML with overlay metadata', () => {
    const snapshot = buildStressSnapshot(createMomentCase())
    const html = buildStressSnapshotHtml(snapshot)

    expect(snapshot.metadata.format).toBe('Stress Distribution Snapshot')
    expect(html).toContain('SVG Stress Overlay')
    expect(html).toContain('eccentricity X')
    expect(html).toContain('transfer factor X')
    expect(html).toContain('stress point count')
    expect(html).toContain('Moment transfer and stress redistribution are draft-only.')
  })

  it('keeps verified center case green', () => {
    const verifiedCenter = punchingShearVerificationCases.find(
      (verificationCase) => verificationCase.id === 'verified-center-rect-001',
    )

    expect(verifiedCenter).toBeDefined()
    expect(runVerificationCase(verifiedCenter!).passed).toBe(true)
  })
})
