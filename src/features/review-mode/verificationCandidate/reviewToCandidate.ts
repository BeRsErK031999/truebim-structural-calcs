import { createReviewId } from '../reviewEvidence'
import { defaultReviewTolerances } from '../reviewMismatch'
import type { ReviewSession } from '../reviewSession'

import type { VerificationCandidateCreationResult } from './candidateTypes'
import { validateReviewForVerificationCandidate } from './candidateValidation'

export function createVerificationCandidateFromReview(
  reviewSession: ReviewSession,
  now = new Date().toISOString(),
): VerificationCandidateCreationResult {
  const validation = validateReviewForVerificationCandidate(reviewSession)

  return {
    candidate: {
      id: createReviewId('verification-candidate'),
      createdAt: now,
      sourceReviewSessionId: reviewSession.id,
      calculationId: reviewSession.calculationId,
      input: reviewSession.input,
      expected: { ...reviewSession.evidence.expectedValues },
      tolerances: { ...defaultReviewTolerances },
      source: reviewSession.evidence.source,
      checkedBy: reviewSession.evidence.checkedBy,
      checkedAt: reviewSession.evidence.checkedAt,
      comparisonNotes: reviewSession.evidence.notes,
      axisConventionNotes: reviewSession.evidence.axisConventionNotes,
      attachments: [...reviewSession.evidence.attachments],
      candidateStatus: validation.valid ? 'ready-for-validation' : 'incomplete',
    },
    validation,
  }
}
