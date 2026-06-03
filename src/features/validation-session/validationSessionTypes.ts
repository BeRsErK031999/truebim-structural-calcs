import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'
import type { ReviewComparison, ReviewSession, VerificationCandidate } from '@/features/review-mode'

export type ValidationSessionChecklistKey =
  | 'reportExported'
  | 'reviewCompleted'
  | 'acceptedReview'
  | 'candidateCreated'
  | 'candidateCliValidationPassed'
  | 'candidateValidated'
  | 'engineerNotesAttached'
  | 'trustedSourceAttached'
  | 'regressionSnapshotFrozen'

export type ValidationSessionChecklistItem = {
  key: ValidationSessionChecklistKey
  label: string
  complete: boolean
  blocking: boolean
  missingText: string
}

export type ValidationSessionChecklistProgress = {
  items: ValidationSessionChecklistItem[]
  completeCount: number
  totalCount: number
  completePercent: number
  missingItems: ValidationSessionChecklistItem[]
  blockingItems: ValidationSessionChecklistItem[]
}

export type ValidationSessionExportStatus = {
  htmlReportExported: boolean
  markdownReportExported: boolean
  reviewSnapshotExported: boolean
  candidateJsonExported: boolean
  packageExported: boolean
}

export type ValidationSessionRegressionSnapshot = {
  id: string
  frozenAt: string
  status: 'not-frozen' | 'frozen' | 'drift-detected'
  driftCount: number
  notes: string
}

export type ValidationSessionCliValidationResult = {
  status: 'not-attached' | 'PASS' | 'FAIL'
  attachedAt: string | null
  notes: string
}

export type ValidationSessionEngineerNotes = {
  text: string
  attachedAt: string | null
  attachments: Array<{
    id: string
    name: string
    reference: string
    kind: 'trusted-source' | 'engineer-note' | 'regression' | 'other'
  }>
}

export type ValidationSession = {
  id: string
  createdAt: string
  updatedAt: string
  calculationId: string | null
  input: PunchingShearInput
  result: PunchingShearResult
  report: PunchingShearReportModel
  reviewSession: ReviewSession
  reviewComparison: ReviewComparison
  candidate: VerificationCandidate | null
  candidateValidated: boolean
  candidateCliValidation: ValidationSessionCliValidationResult
  exports: ValidationSessionExportStatus
  regressionSnapshot: ValidationSessionRegressionSnapshot
  engineerNotes: ValidationSessionEngineerNotes
}

export type ValidationSessionRecommendation =
  | 'keep partial'
  | 'ready for verification'
  | 'requires investigation'

export type ValidationSessionReviewerSummary = {
  currentVerificationLevel: PunchingShearResult['verificationLevel']
  verifiedFeatures: string[]
  draftFeatures: string[]
  missingTrustedEvidence: string[]
  openMismatches: string[]
  axisConventionStatus: 'missing' | 'documented'
  driftStatus: 'not-frozen' | 'stable' | 'drift-detected'
  recommendation: ValidationSessionRecommendation
}

export type ValidationSessionPackageFile = {
  path: string
  mimeType: string
  content: string
}

export type ValidationSessionPackage = {
  rootFolder: string
  generatedAt: string
  files: ValidationSessionPackageFile[]
}
