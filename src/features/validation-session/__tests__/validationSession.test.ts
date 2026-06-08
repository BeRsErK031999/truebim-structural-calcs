import { describe, expect, it } from 'vitest'

import {
  buildPunchingShearReport,
  calculatePunchingShear,
  defaultPunchingShearInput,
} from '@/calculations/punching-shear'
import {
  createReviewSession,
  createVerificationCandidateFromReview,
  getAppReviewValues,
  type ReviewSession,
} from '@/features/review-mode'

import {
  buildValidationSessionPackage,
  canExportValidationSessionPackage,
  buildValidationSessionReviewerSummary,
  createValidationSession,
  freezeValidationRegressionSnapshot,
  getValidationChecklistProgress,
  markValidationCandidateValidated,
  setValidationCandidateCliResult,
  setValidationSessionEngineerNotes,
  setValidationSessionExportStatus,
} from '../index'

describe('validation session workflow', () => {
  it('creates a validation session around calculation, review, and candidate state', () => {
    const session = createValidationSession({
      input: defaultPunchingShearInput,
      result: calculatePunchingShear(defaultPunchingShearInput),
      now: '2026-05-28T01:00:00.000Z',
    })

    expect(session.reviewSession.status).toBe('pending-review')
    expect(session.candidate).toBeNull()
    expect(session.exports.htmlReportExported).toBe(false)
    expect(session.regressionSnapshot.status).toBe('not-frozen')
  })

  it('calculates checklist progress and blocking missing items', () => {
    const session = createValidationSession({
      input: defaultPunchingShearInput,
      result: calculatePunchingShear(defaultPunchingShearInput),
    })
    const progress = getValidationChecklistProgress(session)

    expect(progress.completePercent).toBe(0)
    expect(progress.blockingItems.map((item) => item.key)).toEqual(
      expect.arrayContaining(['reportExported', 'acceptedReview', 'candidateCreated']),
    )
  })

  it('marks a complete validation package ready after required evidence is present', () => {
    const session = prepareReadySession()
    const progress = getValidationChecklistProgress(session)

    expect(progress.completePercent).toBe(100)
    expect(progress.blockingItems).toHaveLength(0)
  })

  it('builds a deterministic package export structure', () => {
    const session = prepareReadySession()
    const validationPackage = buildValidationSessionPackage(session, '2026-05-28T01:00:00.000Z')

    expect(validationPackage.files.map((file) => file.path)).toEqual([
      `${validationPackage.rootFolder}/reports/punching-shear-report.html`,
      `${validationPackage.rootFolder}/reports/punching-shear-report.md`,
      `${validationPackage.rootFolder}/review/review-snapshot.json`,
      `${validationPackage.rootFolder}/candidate/verification-candidate.json`,
      `${validationPackage.rootFolder}/regression/regression-snapshot.json`,
      `${validationPackage.rootFolder}/notes/engineer-notes.md`,
      `${validationPackage.rootFolder}/metadata/checklist.json`,
      `${validationPackage.rootFolder}/metadata/summary.md`,
      `${validationPackage.rootFolder}/metadata/package.json`,
    ])
    expect(validationPackage.files.find((file) => file.path.endsWith('package.json'))?.content).toContain(
      'candidateDoesNotImportDataset',
    )
  })

  it('generates reviewer summary recommendations', () => {
    const pending = createValidationSession({
      input: defaultPunchingShearInput,
      result: calculatePunchingShear(defaultPunchingShearInput),
    })
    const ready = prepareReadySession()

    expect(buildValidationSessionReviewerSummary(pending).recommendation).toBe('keep partial')
    expect(buildValidationSessionReviewerSummary(ready).recommendation).toBe('ready for verification')
  })

  it('accepted review without candidate remains partial readiness', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      forces: {
        ...defaultPunchingShearInput.forces,
        momentXKnM: 25,
      },
    })
    const session = createValidationSession({
      input: defaultPunchingShearInput,
      result,
      reviewSession: createAcceptedReviewSession(result),
    })
    const summary = buildValidationSessionReviewerSummary(session)

    expect(result.verificationLevel).toBe('partial')
    expect(summary.recommendation).toBe('keep partial')
    expect(summary.missingTrustedEvidence).toContain('ready verification candidate')
  })

  it('cannot mark PASS without a candidate', () => {
    const session = createValidationSession({
      input: defaultPunchingShearInput,
      result: calculatePunchingShear(defaultPunchingShearInput),
    })

    expect(markValidationCandidateValidated(session, true).candidateValidated).toBe(false)
  })

  it('cannot mark PASS with an incomplete candidate', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const reviewSession = {
      ...createAcceptedReviewSession(result),
      evidence: {
        ...createAcceptedReviewSession(result).evidence,
        checkedBy: '',
      },
    }
    const candidate = createVerificationCandidateFromReview(reviewSession).candidate
    const session = setValidationCandidateCliResult(
      createValidationSession({
        input: defaultPunchingShearInput,
        result,
        reviewSession,
        candidate,
      }),
      'PASS',
    )

    expect(candidate.candidateStatus).toBe('incomplete')
    expect(markValidationCandidateValidated(session, true).candidateValidated).toBe(false)
  })

  it('cannot mark PASS without a CLI validation result', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const reviewSession = createAcceptedReviewSession(result)
    const candidate = createVerificationCandidateFromReview(reviewSession).candidate
    const session = createValidationSession({
      input: defaultPunchingShearInput,
      result,
      reviewSession,
      candidate,
    })

    expect(candidate.candidateStatus).toBe('ready-for-validation')
    expect(markValidationCandidateValidated(session, true).candidateValidated).toBe(false)
  })

  it('can mark PASS only with a ready candidate and CLI PASS result', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const reviewSession = createAcceptedReviewSession(result)
    const candidate = createVerificationCandidateFromReview(reviewSession).candidate
    const session = setValidationCandidateCliResult(
      createValidationSession({
        input: defaultPunchingShearInput,
        result,
        reviewSession,
        candidate,
      }),
      'PASS',
    )

    const passed = markValidationCandidateValidated(session, true)

    expect(passed.candidateValidated).toBe(true)
    expect(getValidationChecklistProgress(passed).items.find((item) => item.key === 'candidateCliValidationPassed')?.complete).toBe(true)
  })

  it('blocks normal package export with checklist blockers and marks incomplete debug packages', () => {
    const session = createValidationSession({
      input: defaultPunchingShearInput,
      result: calculatePunchingShear(defaultPunchingShearInput),
    })
    const debugPackage = buildValidationSessionPackage(session, '2026-05-28T01:00:00.000Z', {
      incompleteDebug: true,
    })
    const metadata = debugPackage.files.find((file) => file.path.endsWith('package.json'))?.content ?? ''

    expect(canExportValidationSessionPackage(session)).toBe(false)
    expect(metadata).toContain('НЕПОЛНЫЙ ПАКЕТ')
    expect(metadata).toContain('reportExported')
  })
})

function prepareReadySession() {
  const input = defaultPunchingShearInput
  const result = calculatePunchingShear(input)
  const report = buildPunchingShearReport(input, result)
  const reviewSession = createAcceptedReviewSession(result)
  const candidate = createVerificationCandidateFromReview(reviewSession, '2026-05-28T01:00:00.000Z').candidate
  const baseSession = createValidationSession({
    input,
    result,
    report,
    reviewSession,
    candidate,
    now: '2026-05-28T01:00:00.000Z',
  })
  const exported = setValidationSessionExportStatus(baseSession, {
    htmlReportExported: true,
    markdownReportExported: true,
    reviewSnapshotExported: true,
    candidateJsonExported: true,
  })
  const withNotes = setValidationSessionEngineerNotes(exported, {
    text: 'Engineer compared the report with a manual worksheet.',
    attachedAt: '2026-05-28T01:00:00.000Z',
    attachments: [
      {
        id: 'trusted-source-1',
        name: 'manual worksheet',
        reference: 'manual-calculation.xlsx',
        kind: 'trusted-source',
      },
    ],
  })

  const withCliPass = setValidationCandidateCliResult(
    freezeValidationRegressionSnapshot(withNotes, '2026-05-28T01:00:00.000Z'),
    'PASS',
    '',
    '2026-05-28T01:00:00.000Z',
  )

  return markValidationCandidateValidated(
    withCliPass,
    true,
    '2026-05-28T01:00:00.000Z',
  )
}

function createAcceptedReviewSession(result = calculatePunchingShear(defaultPunchingShearInput)): ReviewSession {
  const appValues = getAppReviewValues(result)

  return {
    ...createReviewSession({
      input: defaultPunchingShearInput,
      calculationId: 'calc-validation-session',
      now: '2026-05-28T01:00:00.000Z',
    }),
    status: 'accepted',
    evidence: {
      ...createReviewSession({ input: defaultPunchingShearInput }).evidence,
      source: 'manual',
      checkedBy: 'Engineer',
      checkedAt: '2026-05-28T01:00:00.000Z',
      notes: 'Compared with trusted manual worksheet.',
      axisConventionNotes: 'Mx and My axes match the app convention.',
      expectedValues: {
        controlPerimeterMm: Number(appValues.controlPerimeterMm),
        effectiveDepthMm: Number(appValues.effectiveDepthMm),
        shearStressMpa: Number(appValues.shearStressMpa),
        maxShearStressMpa: Number(appValues.maxShearStressMpa),
        minShearStressMpa: Number(appValues.minShearStressMpa),
        eccentricityX: Number(appValues.eccentricityX),
        eccentricityY: Number(appValues.eccentricityY),
        transferFactorX: Number(appValues.transferFactorX),
        transferFactorY: Number(appValues.transferFactorY),
        stressPointCount: Number(appValues.stressPointCount),
      },
    },
  }
}
