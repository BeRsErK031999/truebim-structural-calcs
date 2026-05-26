import type { PunchingShearInput, PunchingShearResult } from '@/calculations/punching-shear'

import type { ReviewComparison } from './reviewMismatch'
import type { ReviewSession } from './reviewSession'

export type ReviewSnapshot = {
  title: string
  exportedAt: string
  input: PunchingShearInput
  result: PunchingShearResult
  session: ReviewSession
  comparison: ReviewComparison
  metadata: {
    format: 'Engineering Review Snapshot'
    verificationLevel: PunchingShearResult['verificationLevel']
    acceptedDoesNotPromoteVerified: true
    draftWarnings: string[]
  }
}

export function buildReviewSnapshot({
  input,
  result,
  session,
  comparison,
  exportedAt = new Date().toISOString(),
}: {
  input: PunchingShearInput
  result: PunchingShearResult
  session: ReviewSession
  comparison: ReviewComparison
  exportedAt?: string
}): ReviewSnapshot {
  return {
    title: 'Engineering Review Snapshot',
    exportedAt,
    input,
    result,
    session,
    comparison,
    metadata: {
      format: 'Engineering Review Snapshot',
      verificationLevel: result.verificationLevel,
      acceptedDoesNotPromoteVerified: true,
      draftWarnings: result.warnings,
    },
  }
}

export function serializeReviewSnapshot(snapshot: ReviewSnapshot) {
  return JSON.stringify(snapshot, null, 2)
}
