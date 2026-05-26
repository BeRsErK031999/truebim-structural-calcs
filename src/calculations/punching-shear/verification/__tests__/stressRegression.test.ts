/// <reference types="node" />

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { defaultPunchingShearInput } from '../../defaults'
import { calculatePunchingShear } from '../../engine'
import {
  createStressDistributionChecksum,
} from '../stressDistributionComparison'
import {
  canPromoteCenterMomentTransferEvidence,
  runStressRegressionCase,
  type StressRegressionCase,
} from '../stressRegressionRunner'
import { summarizeStressRegressionResults } from '../stressRegressionSummary'
import { validateAxisConvention } from '../axisConventionValidation'
import { buildStressRegressionSnapshot } from '../stressRegressionSnapshot'
import { buildStressRegressionSnapshotHtml } from '../stressRegressionSnapshotHtml'
import { runVerificationCase } from '../verificationRunner'
import { punchingShearVerificationCases } from '../verificationDataset'
import { calculateVerificationTransferFactors } from '../transferFactorComparison'

describe('stress regression workflow', () => {
  it('creates deterministic stress checksums from ordered perimeter traversal', () => {
    const result = calculatePunchingShear(momentInput())
    const checksum = createStressDistributionChecksum(result.stressDistribution)

    expect(checksum).toBe(createStressDistributionChecksum(result.stressDistribution))
    expect(checksum).toContain('count=')
    expect(checksum).toContain('coords=')
    expect(checksum).toContain('stress=')
  })

  it('detects checksum drift', () => {
    const result = calculatePunchingShear(momentInput())
    const baseline = createBaselineStressRegressionCase({
      stressDistributionChecksum: `${createStressDistributionChecksum(result.stressDistribution)}-drift`,
    })

    expect(runStressRegressionCase(baseline)).toMatchObject({
      driftDetected: true,
      regressionStatus: 'drifted',
    })
  })

  it('allows trusted moment evidence to promote verification when all guards pass', () => {
    const regressionResult = runStressRegressionCase(createBaselineStressRegressionCase())

    expect(regressionResult).toMatchObject({
      sourceStatus: 'verified',
      sourceTrusted: true,
      driftDetected: false,
      draftPlaceholder: false,
      regressionStatus: 'passed',
      axisWarnings: [],
    })
    expect(canPromoteCenterMomentTransferEvidence(regressionResult)).toBe(true)
  })

  it('prevents promotion when trusted moment evidence mismatches actual arithmetic', () => {
    const regressionResult = runStressRegressionCase(createBaselineStressRegressionCase({
      maxStressMpa: 999,
    }))

    expect(regressionResult.regressionStatus).toBe('failed')
    expect(canPromoteCenterMomentTransferEvidence(regressionResult)).toBe(false)
  })

  it('blocks verified promotion when checksum drift is detected', () => {
    const result = calculatePunchingShear(momentInput())
    const regressionResult = runStressRegressionCase(createBaselineStressRegressionCase({
      stressDistributionChecksum: `${createStressDistributionChecksum(result.stressDistribution)}-drift`,
    }))

    expect(regressionResult).toMatchObject({
      driftDetected: true,
      regressionStatus: 'drifted',
    })
    expect(canPromoteCenterMomentTransferEvidence(regressionResult)).toBe(false)
  })

  it('blocks verified promotion when axis convention validation fails', () => {
    const regressionResult = runStressRegressionCase({
      ...createBaselineStressRegressionCase(),
      axisConvention: {
        traversal: 'clockwise',
      },
    })

    expect(regressionResult.regressionStatus).toBe('failed')
    expect(regressionResult.axisWarnings).toEqual([
      expect.stringContaining('perimeter traversal'),
    ])
    expect(canPromoteCenterMomentTransferEvidence(regressionResult)).toBe(false)
  })

  it('keeps draft evidence placeholders separate from failures', () => {
    const draftCase = createBaselineStressRegressionCase({
      maxStressMpa: null,
      minStressMpa: null,
      transferFactorX: null,
      transferFactorY: null,
      eccentricityX: null,
      eccentricityY: null,
      stressPointCount: null,
      stressDistributionChecksum: null,
    })

    expect(runStressRegressionCase(draftCase)).toMatchObject({
      draftPlaceholder: true,
      regressionStatus: 'draft-placeholder',
    })
  })

  it('loads the center Mx low eccentricity draft template', () => {
    const template = loadMomentTemplate('mx-low-eccentricity.json')

    expect(template).toMatchObject({
      id: 'moment-evidence-mx-low-eccentricity',
      status: 'draft',
      input: {
        caseType: 'center',
        forces: {
          axialForceKn: 420,
          momentXKnM: 50,
          momentYKnM: 0,
        },
      },
    })
  })

  it('does not turn draft placeholders into verified moment evidence', () => {
    const template = loadMomentTemplate('mx-low-eccentricity.json')
    const regressionResult = runStressRegressionCase(template)

    expect(template.status).toBe('draft')
    expect(template.expected.maxStressMpa).toBeNull()
    expect(regressionResult).toMatchObject({
      sourceStatus: 'draft',
      draftPlaceholder: true,
      regressionStatus: 'draft-placeholder',
    })
    expect(regressionResult.result.verificationLevel).toBe('partial')
    expect(regressionResult.result.verifiedFeatures).not.toContain('center-moment-transfer')
  })

  it('counts null expected values as placeholders without a verified claim', () => {
    const template = loadMomentTemplate('mx-low-eccentricity.json')
    const regressionResult = runStressRegressionCase(template)
    const summary = summarizeStressRegressionResults([regressionResult])

    expect(summary).toMatchObject({
      total: 1,
      passed: 0,
      failed: 0,
      drifted: 0,
      draftPlaceholders: 1,
    })
    expect(regressionResult.comparisons.every((comparison) => comparison.passed)).toBe(true)
  })

  it('summarizes regression statuses', () => {
    expect(
      summarizeStressRegressionResults([
        { regressionStatus: 'passed' },
        { regressionStatus: 'failed' },
        { regressionStatus: 'drifted' },
        { regressionStatus: 'draft-placeholder' },
      ]),
    ).toEqual({
      total: 4,
      passed: 1,
      failed: 1,
      drifted: 1,
      draftPlaceholders: 1,
    })
  })

  it('validates axis conventions and emits warnings for inconsistent assumptions', () => {
    expect(validateAxisConvention({ xPositiveDirection: 'right' }).passed).toBe(true)

    const inconsistent = validateAxisConvention({
      xPositiveDirection: 'left',
      traversal: 'clockwise',
    })

    expect(inconsistent.passed).toBe(false)
    expect(inconsistent.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('perimeter traversal'),
        expect.stringContaining('X positive direction'),
      ]),
    )
  })

  it('generates visual stress regression snapshots', () => {
    const regressionCase = createBaselineStressRegressionCase()
    const regressionResult = runStressRegressionCase(regressionCase)
    const snapshot = buildStressRegressionSnapshot(regressionCase, regressionResult)
    const html = buildStressRegressionSnapshotHtml(snapshot)

    expect(snapshot.currentStressPoints.length).toBeGreaterThan(0)
    expect(html).toContain('Stress Regression Snapshot')
    expect(html).toContain('Stress Overlay')
    expect(html).toContain('drift detected')
  })

  it('keeps verified center force-only case verified', () => {
    const verifiedCase = punchingShearVerificationCases.find(
      (verificationCase) => verificationCase.id === 'verified-center-rect-001',
    )

    expect(verifiedCase).toBeDefined()
    expect(runVerificationCase(verifiedCase!)).toMatchObject({
      status: 'verified',
      passed: true,
      verificationLevel: 'verified',
      verifiedFeatures: expect.arrayContaining(['center-force-only']),
    })
  })
})

function createBaselineStressRegressionCase(
  expectedOverride: Partial<StressRegressionCase['expected']> = {},
): StressRegressionCase {
  const input = momentInput()
  const result = calculatePunchingShear(input)
  const transferFactors = calculateVerificationTransferFactors(result.perimeter)

  return {
    id: 'stress-regression-test-case',
    title: 'Stress regression test case',
    source: 'trusted regression test fixture',
    status: 'verified',
    input,
    expected: {
      maxStressMpa: result.maxShearStressMpa,
      minStressMpa: result.minShearStressMpa,
      transferFactorX: transferFactors.factorX,
      transferFactorY: transferFactors.factorY,
      eccentricityX: result.eccentricityX,
      eccentricityY: result.eccentricityY,
      stressPointCount: result.stressDistribution?.points.length ?? 0,
      stressDistributionChecksum: createStressDistributionChecksum(result.stressDistribution),
      ...expectedOverride,
    },
    tolerance: {
      relativePercent: 0.1,
      absolute: 0.000001,
      stressTolerancePercent: 0.1,
      eccentricityToleranceMm: 0.001,
    },
  }
}

function momentInput() {
  return {
    ...defaultPunchingShearInput,
    forces: {
      axialForceKn: 420,
      momentXKnM: 12,
      momentYKnM: 8,
    },
  }
}

function loadMomentTemplate(filename: string): StressRegressionCase {
  const templatePath = path.resolve(process.cwd(), 'examples', 'verification', 'moments', filename)

  return JSON.parse(readFileSync(templatePath, 'utf-8')) as StressRegressionCase
}
