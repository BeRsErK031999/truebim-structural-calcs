import { getVerifiedCapabilityMatrix } from '@/calculations/punching-shear/verified/verifiedCapabilities'
import { punchingShearVerificationCases } from '@/calculations/punching-shear/verification/verificationDataset'
import { runVerificationCases } from '@/calculations/punching-shear/verification/verificationRunner'

import type {
  ReleaseEvidence,
  ReleaseEvidenceBuildInput,
  ReleaseEvidenceCounts,
  ReleaseEvidenceStatus,
  ReleaseEvidenceUrlStatus,
} from './releaseEvidenceTypes'

const defaultOfficeUrls = ['http://192.168.22.37', 'http://truebim-calc.local']

export function buildReleaseEvidence(input: ReleaseEvidenceBuildInput): ReleaseEvidence {
  const verificationSummary = runVerificationCases(punchingShearVerificationCases).summary
  const verificationCapabilityMatrix = getVerifiedCapabilityMatrix()
  const counts = buildReleaseEvidenceCounts()
  const knownWarnings = buildKnownWarnings(input.knownWarnings, verificationSummary.warning)

  return {
    commitHash: normalizeText(input.commitHash, 'unknown'),
    appVersion: normalizeText(input.appVersion, '0.0.0'),
    buildTime: normalizeText(input.buildTime, 'unknown'),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    testStatus: input.testStatus ?? unknownStatus('Test status', 'Attach the latest npm run test result for release audit.'),
    deployPrecheckStatus:
      input.deployPrecheckStatus ??
      unknownStatus('Deploy precheck', 'Attach the latest npm run deploy:precheck result for release audit.'),
    officeUrlsStatus: input.officeUrlsStatus ?? buildUnknownOfficeUrlStatuses(),
    diagnosticsSummary: {
      appLoaded: input.diagnosticsSummary?.appLoaded ?? 'unknown',
      environment: input.diagnosticsSummary?.environment ?? 'unknown',
      localStorageAvailable: input.diagnosticsSummary?.localStorageAvailable ?? 'unknown',
      savedCalculationsCount: input.diagnosticsSummary?.savedCalculationsCount ?? 'unknown',
      warning: input.diagnosticsSummary?.warning ?? 'Client-side diagnostics only',
    },
    verificationSummary,
    verificationCapabilityMatrix,
    counts,
    validationSessionStatus: {
      support: 'local-only',
      sessionsCount: input.validationSessionStatus?.sessionsCount ?? 'unknown',
      engineerPackageReady: input.validationSessionStatus?.engineerPackageReady ?? 'unknown',
      checklistProgressSupport: 'yes',
      packageExportSupport: 'manifest',
    },
    reviewCandidateStatus: {
      reviewModeSupport: 'local-only',
      candidateSupport: 'yes',
      autoPromotion: 'no',
      manualDatasetImportRequired: 'yes',
      frozenSnapshotsCount: input.reviewCandidateStatus?.frozenSnapshotsCount ?? 'unknown',
      pendingReviewsCount: input.reviewCandidateStatus?.pendingReviewsCount ?? 'unknown',
      acceptedReviewsCount: input.reviewCandidateStatus?.acceptedReviewsCount ?? 'unknown',
      rejectedReviewsCount: input.reviewCandidateStatus?.rejectedReviewsCount ?? 'unknown',
    },
    knownWarnings,
    rollbackNotes: input.rollbackNotes ?? [
      'Use the release evidence bundle to identify the deployed commit before rollback.',
      'Follow docs/release-checklist.md rollback commands for the project container only.',
      'After rollback, regenerate evidence and compare diagnostics, URLs, and verification matrix.',
    ],
  }
}

export function buildReleaseEvidenceFromDiagnostics({
  metadata,
  diagnostics,
}: {
  metadata: {
    version: string
    commit: string
    buildTime: string
  }
  diagnostics: {
    appLoaded: 'yes'
    environment: string
    localStorageAvailable: boolean
    savedCalculationsCount: number
    warning: string
    validationSessionsCount: number
    engineerPackageReady: 'yes' | 'no'
    frozenReviewSnapshotsCount: number
    pendingReviewsCount: number
    acceptedReviewsCount: number
    rejectedReviewsCount: number
  }
}) {
  return buildReleaseEvidence({
    commitHash: metadata.commit,
    appVersion: metadata.version,
    buildTime: metadata.buildTime,
    diagnosticsSummary: {
      appLoaded: diagnostics.appLoaded,
      environment: diagnostics.environment,
      localStorageAvailable: diagnostics.localStorageAvailable,
      savedCalculationsCount: diagnostics.savedCalculationsCount,
      warning: diagnostics.warning,
    },
    validationSessionStatus: {
      sessionsCount: diagnostics.validationSessionsCount,
      engineerPackageReady: diagnostics.engineerPackageReady,
    },
    reviewCandidateStatus: {
      frozenSnapshotsCount: diagnostics.frozenReviewSnapshotsCount,
      pendingReviewsCount: diagnostics.pendingReviewsCount,
      acceptedReviewsCount: diagnostics.acceptedReviewsCount,
      rejectedReviewsCount: diagnostics.rejectedReviewsCount,
    },
  })
}

function buildReleaseEvidenceCounts(): ReleaseEvidenceCounts {
  return {
    verified: punchingShearVerificationCases.filter((verificationCase) => verificationCase.status === 'verified').length,
    draft: punchingShearVerificationCases.filter((verificationCase) => verificationCase.status === 'draft').length,
    partial: getVerifiedCapabilityMatrix().filter((capability) => capability.status === 'partial').length,
  }
}

function buildKnownWarnings(userWarnings: string[] | undefined, verificationWarning: string | null) {
  const warnings = [
    ...(verificationWarning ? [verificationWarning] : []),
    'Evidence bundle is audit-only and does not promote draft or partial cases to VERIFIED.',
    'Server URL checks are warning-only and do not require backend availability.',
    ...(userWarnings ?? []),
  ]

  return Array.from(new Set(warnings))
}

function buildUnknownOfficeUrlStatuses(): ReleaseEvidenceUrlStatus[] {
  return defaultOfficeUrls.map((url) => ({
    ...unknownStatus('Office URL', 'Not checked by the browser evidence page. Run npm run release:evidence for local URL probes.'),
    url,
  }))
}

function unknownStatus(label: string, details: string): ReleaseEvidenceStatus {
  return {
    status: 'unknown',
    label,
    details,
  }
}

function normalizeText(value: string, fallback: string) {
  return value.trim().length > 0 ? value : fallback
}
