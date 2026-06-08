import { describe, expect, it } from 'vitest'

import { calculatePunchingShear, defaultPunchingShearInput } from '@/calculations/punching-shear'

import type { ReviewExpectedValues } from '../../reviewEvidence'
import { createReviewSession, type ReviewSession } from '../../reviewSession'
import { buildCandidateJson } from '../candidateExport'
import { validateVerificationCandidate } from '../candidateValidation'
import { createVerificationCandidateFromReview } from '../reviewToCandidate'

describe('verification candidate workflow', () => {
  it('accepted review with valid data creates candidate', () => {
    const session = createValidAcceptedReviewSession()
    const result = createVerificationCandidateFromReview(session, '2026-05-26T10:00:00.000Z')

    expect(result.validation.valid).toBe(true)
    expect(result.candidate.candidateStatus).toBe('ready-for-validation')
    expect(result.candidate.sourceReviewSessionId).toBe(session.id)
    expect(result.candidate.expected.controlPerimeterMm).toBe(1000)
  })

  it('missing trusted source blocks candidate', () => {
    const validSession = createValidAcceptedReviewSession()
    const session: ReviewSession = {
      ...validSession,
      evidence: {
        ...validSession.evidence,
        source: '' as ReviewSession['evidence']['source'],
      },
    }
    const result = createVerificationCandidateFromReview(session)

    expect(result.validation.valid).toBe(false)
    expect(result.validation.missingRequirements).toContain('trusted source')
    expect(result.candidate.candidateStatus).toBe('incomplete')
  })

  it('weak source rejected', () => {
    const validSession = createValidAcceptedReviewSession()
    const session: ReviewSession = {
      ...validSession,
      evidence: {
        ...validSession.evidence,
        source: 'other',
      },
    }
    const result = createVerificationCandidateFromReview(session)

    expect(result.validation.valid).toBe(false)
    expect(result.validation.errors.join('\n')).toContain('доверенную отметку')
    expect(result.candidate.candidateStatus).toBe('incomplete')
  })

  it('missing expected values blocks candidate', () => {
    const validSession = createValidAcceptedReviewSession()
    const session: ReviewSession = {
      ...validSession,
      evidence: {
        ...validSession.evidence,
        expectedValues: {
          controlPerimeterMm: 1000,
        },
      },
    }
    const result = createVerificationCandidateFromReview(session)

    expect(result.validation.valid).toBe(false)
    expect(result.validation.missingRequirements).toContain('expected.effectiveDepthMm')
    expect(result.candidate.candidateStatus).toBe('incomplete')
  })

  it('candidate export strips runtime UI state', () => {
    const { candidate } = createVerificationCandidateFromReview(createValidAcceptedReviewSession())
    const json = buildCandidateJson({
      ...candidate,
      transientUiOpen: true,
    } as typeof candidate & { transientUiOpen: boolean })
    const parsed = JSON.parse(json)

    expect(parsed.transientUiOpen).toBeUndefined()
    expect(parsed.candidateStatus).toBe('ready-for-validation')
  })

  it('candidate does not auto-promote VERIFIED', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      forces: {
        ...defaultPunchingShearInput.forces,
        momentXKnM: 25,
      },
    })
    const { candidate } = createVerificationCandidateFromReview(createValidAcceptedReviewSession())
    const candidateValidation = validateVerificationCandidate(candidate)

    expect(candidateValidation.valid).toBe(true)
    expect(candidate.candidateStatus).toBe('ready-for-validation')
    expect(result.verifiedFeatures).not.toContain('center-moment-transfer')
    expect(result.verificationLevel).not.toBe('verified')
  })
})

function createValidAcceptedReviewSession() {
  const expectedValues: ReviewExpectedValues = {
    controlPerimeterMm: 1000,
    effectiveDepthMm: 180,
    shearStressMpa: 0.75,
    maxShearStressMpa: 0.92,
    minShearStressMpa: 0.58,
    eccentricityX: 12,
    eccentricityY: 4,
    transferFactorX: 0.4,
    transferFactorY: 0.6,
    stressPointCount: 12,
  }

  return {
    ...createReviewSession({ input: defaultPunchingShearInput, calculationId: 'calc-1' }),
    status: 'accepted' as const,
    evidence: {
      ...createReviewSession({ input: defaultPunchingShearInput }).evidence,
      source: 'manual' as const,
      checkedBy: 'Engineer',
      checkedAt: '2026-05-26T09:00:00.000Z',
      notes: 'Compared with trusted manual worksheet.',
      axisConventionNotes: 'Mx follows the app X axis convention.',
      expectedValues,
    },
  }
}
