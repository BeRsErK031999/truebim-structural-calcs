import type { VerifiedCapability } from '@/calculations/punching-shear/verified/verifiedCapabilities'
import type { VerificationSummary } from '@/calculations/punching-shear/verification/verificationSummary'

export type ReleaseEvidenceCheckStatus = 'pass' | 'warning' | 'fail' | 'unknown'

export type ReleaseEvidenceStatus = {
  status: ReleaseEvidenceCheckStatus
  label: string
  details: string
  checkedAt?: string
}

export type ReleaseEvidenceUrlStatus = ReleaseEvidenceStatus & {
  url: string
}

export type ReleaseEvidenceCounts = {
  verified: number
  draft: number
  partial: number
}

export type ReleaseEvidenceDiagnosticsSummary = {
  appLoaded: 'yes' | 'unknown'
  environment: string
  localStorageAvailable: boolean | 'unknown'
  savedCalculationsCount: number | 'unknown'
  warning: string
}

export type ReleaseEvidenceValidationSessionStatus = {
  support: 'local-only'
  sessionsCount: number | 'unknown'
  engineerPackageReady: 'yes' | 'no' | 'unknown'
  checklistProgressSupport: 'yes'
  packageExportSupport: 'manifest'
}

export type ReleaseEvidenceReviewCandidateStatus = {
  reviewModeSupport: 'local-only'
  candidateSupport: 'yes'
  autoPromotion: 'no'
  manualDatasetImportRequired: 'yes'
  frozenSnapshotsCount: number | 'unknown'
  pendingReviewsCount: number | 'unknown'
  acceptedReviewsCount: number | 'unknown'
  rejectedReviewsCount: number | 'unknown'
}

export type ReleaseEvidence = {
  commitHash: string
  appVersion: string
  buildTime: string
  generatedAt: string
  testStatus: ReleaseEvidenceStatus
  deployPrecheckStatus: ReleaseEvidenceStatus
  officeUrlsStatus: ReleaseEvidenceUrlStatus[]
  diagnosticsSummary: ReleaseEvidenceDiagnosticsSummary
  verificationSummary: VerificationSummary
  verificationCapabilityMatrix: VerifiedCapability[]
  counts: ReleaseEvidenceCounts
  validationSessionStatus: ReleaseEvidenceValidationSessionStatus
  reviewCandidateStatus: ReleaseEvidenceReviewCandidateStatus
  knownWarnings: string[]
  rollbackNotes: string[]
}

export type ReleaseEvidenceBuildInput = {
  commitHash: string
  appVersion: string
  buildTime: string
  generatedAt?: string
  testStatus?: ReleaseEvidenceStatus
  deployPrecheckStatus?: ReleaseEvidenceStatus
  officeUrlsStatus?: ReleaseEvidenceUrlStatus[]
  diagnosticsSummary?: Partial<ReleaseEvidenceDiagnosticsSummary>
  validationSessionStatus?: Partial<ReleaseEvidenceValidationSessionStatus>
  reviewCandidateStatus?: Partial<ReleaseEvidenceReviewCandidateStatus>
  knownWarnings?: string[]
  rollbackNotes?: string[]
}
