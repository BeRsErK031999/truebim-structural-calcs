import type { PunchingShearInput } from '@/calculations/punching-shear'

import type { ReviewAttachmentMetadata, ReviewExpectedValues, ReviewValueKey } from '../reviewEvidence'
import type { ReviewTolerance } from '../reviewMismatch'

export type VerificationCandidateStatus = 'ready-for-validation' | 'incomplete' | 'rejected'

export type VerificationCandidate = {
  id: string
  createdAt: string
  sourceReviewSessionId: string
  calculationId: string | null
  input: PunchingShearInput
  expected: ReviewExpectedValues
  tolerances: Partial<Record<ReviewValueKey, ReviewTolerance>>
  source: string
  checkedBy: string
  checkedAt: string
  comparisonNotes: string
  axisConventionNotes: string
  attachments: ReviewAttachmentMetadata[]
  candidateStatus: VerificationCandidateStatus
}

export type VerificationCandidateValidationResult = {
  valid: boolean
  errors: string[]
  missingRequirements: string[]
}

export type VerificationCandidateCreationResult = {
  candidate: VerificationCandidate
  validation: VerificationCandidateValidationResult
}
