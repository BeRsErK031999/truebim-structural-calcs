import type { PunchingShearInput, PunchingShearResult } from '@/calculations/punching-shear'

import type { ReviewEvidence } from './reviewEvidence'
import { createEmptyReviewEvidence, createReviewId } from './reviewEvidence'
import type { ReviewDiffItem } from './reviewMismatch'
import type { ReviewNote } from './reviewNotes'
import type { ReviewDecisionMetadata, ReviewStatus } from './reviewStatus'

export type ReviewFrozenSnapshot = {
  id: string
  frozenAt: string
  result: Pick<
    PunchingShearResult,
    | 'controlPerimeterMm'
    | 'effectiveDepthMm'
    | 'shearStressMpa'
    | 'maxShearStressMpa'
    | 'minShearStressMpa'
    | 'eccentricityX'
    | 'eccentricityY'
    | 'verificationLevel'
    | 'warnings'
  >
  comparisonItems: ReviewDiffItem[]
}

export type ReviewSession = {
  id: string
  calculationId: string | null
  createdAt: string
  updatedAt: string
  status: ReviewStatus
  input: PunchingShearInput
  evidence: ReviewEvidence
  notes: ReviewNote[]
  mismatchExplanations: Partial<Record<string, string>>
  decision: ReviewDecisionMetadata
  frozenSnapshots: ReviewFrozenSnapshot[]
}

export function createReviewSession({
  input,
  calculationId = null,
  now = new Date().toISOString(),
}: {
  input: PunchingShearInput
  calculationId?: string | null
  now?: string
}): ReviewSession {
  return {
    id: createReviewId('review'),
    calculationId,
    createdAt: now,
    updatedAt: now,
    status: 'pending-review',
    input,
    evidence: createEmptyReviewEvidence(now),
    notes: [],
    mismatchExplanations: {},
    decision: {},
    frozenSnapshots: [],
  }
}

export function freezeReviewSnapshot({
  session,
  result,
  comparisonItems,
  now = new Date().toISOString(),
}: {
  session: ReviewSession
  result: PunchingShearResult
  comparisonItems: ReviewDiffItem[]
  now?: string
}): ReviewSession {
  return {
    ...session,
    updatedAt: now,
    frozenSnapshots: [
      ...session.frozenSnapshots,
      {
        id: createReviewId('freeze'),
        frozenAt: now,
        result: {
          controlPerimeterMm: result.controlPerimeterMm,
          effectiveDepthMm: result.effectiveDepthMm,
          shearStressMpa: result.shearStressMpa,
          maxShearStressMpa: result.maxShearStressMpa,
          minShearStressMpa: result.minShearStressMpa,
          eccentricityX: result.eccentricityX,
          eccentricityY: result.eccentricityY,
          verificationLevel: result.verificationLevel,
          warnings: result.warnings,
        },
        comparisonItems,
      },
    ],
  }
}

export function compareFrozenReviewSnapshot(
  snapshot: ReviewFrozenSnapshot,
  result: PunchingShearResult,
) {
  const fields = [
    'controlPerimeterMm',
    'effectiveDepthMm',
    'shearStressMpa',
    'maxShearStressMpa',
    'minShearStressMpa',
    'eccentricityX',
    'eccentricityY',
    'verificationLevel',
  ] as const

  return fields
    .map((field) => ({
      field,
      frozen: snapshot.result[field],
      current: result[field],
      drifted: snapshot.result[field] !== result[field],
    }))
    .filter((item) => item.drifted)
}
