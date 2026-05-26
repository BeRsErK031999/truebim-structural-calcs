export type ReviewStatus =
  | 'pending-review'
  | 'reviewed'
  | 'accepted'
  | 'rejected'
  | 'needs-investigation'

export type ReviewDecisionMetadata = {
  decidedBy?: string
  decidedAt?: string
  reason?: string
}

const allowedTransitions: Record<ReviewStatus, ReviewStatus[]> = {
  'pending-review': ['reviewed', 'accepted', 'rejected', 'needs-investigation'],
  reviewed: ['accepted', 'rejected', 'needs-investigation', 'pending-review'],
  accepted: ['needs-investigation', 'rejected'],
  rejected: ['needs-investigation', 'pending-review'],
  'needs-investigation': ['reviewed', 'accepted', 'rejected', 'pending-review'],
}

export function canTransitionReviewStatus(from: ReviewStatus, to: ReviewStatus) {
  return from === to || allowedTransitions[from].includes(to)
}

export function transitionReviewStatus(from: ReviewStatus, to: ReviewStatus) {
  if (!canTransitionReviewStatus(from, to)) {
    throw new Error(`Review status transition from ${from} to ${to} is not allowed`)
  }

  return to
}

export function isReviewAccepted(status: ReviewStatus) {
  return status === 'accepted'
}
