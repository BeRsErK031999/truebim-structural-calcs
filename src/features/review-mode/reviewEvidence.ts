export type ReviewEvidenceSource = 'manual' | 'webcad' | 'excel' | 'hand-calculation' | 'other'

export type ReviewExpectedValues = Partial<Record<ReviewValueKey, number | string>>

export type ReviewValueKey =
  | 'controlPerimeterMm'
  | 'effectiveDepthMm'
  | 'shearStressMpa'
  | 'maxShearStressMpa'
  | 'minShearStressMpa'
  | 'eccentricityX'
  | 'eccentricityY'
  | 'transferFactorX'
  | 'transferFactorY'
  | 'stressPointCount'
  | 'stressChecksum'
  | 'verificationLevel'

export type ReviewAttachmentMetadata = {
  id: string
  name: string
  kind: 'screenshot' | 'spreadsheet' | 'pdf' | 'note' | 'other'
  reference: string
}

export type ReviewEvidence = {
  id: string
  source: ReviewEvidenceSource
  checkedBy: string
  checkedAt: string
  notes: string
  axisConventionNotes: string
  expectedValues: ReviewExpectedValues
  attachments: ReviewAttachmentMetadata[]
}

export function createEmptyReviewEvidence(now = new Date().toISOString()): ReviewEvidence {
  return {
    id: createReviewId('evidence'),
    source: 'manual',
    checkedBy: '',
    checkedAt: now,
    notes: '',
    axisConventionNotes: '',
    expectedValues: {},
    attachments: [],
  }
}

export function createReviewId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random()}`
}
