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
    testStatus: input.testStatus ?? unknownStatus('Статус тестов', 'Приложите последний результат npm run test для аудита релиза.'),
    deployPrecheckStatus:
      input.deployPrecheckStatus ??
      unknownStatus('Предпроверка деплоя', 'Приложите последний результат npm run deploy:precheck для аудита релиза.'),
    officeUrlsStatus: input.officeUrlsStatus ?? buildUnknownOfficeUrlStatuses(),
    diagnosticsSummary: {
      appLoaded: input.diagnosticsSummary?.appLoaded ?? 'unknown',
      environment: input.diagnosticsSummary?.environment ?? 'unknown',
      localStorageAvailable: input.diagnosticsSummary?.localStorageAvailable ?? 'unknown',
      savedCalculationsCount: input.diagnosticsSummary?.savedCalculationsCount ?? 'unknown',
      warning: input.diagnosticsSummary?.warning ?? 'Только клиентская диагностика',
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
      'Используйте пакет релизных материалов, чтобы определить развернутый коммит перед откатом.',
      'Выполняйте команды отката из docs/release-checklist.md только для контейнера проекта.',
      'После отката заново сформируйте материалы и сравните диагностику, URL и матрицу проверки.',
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
    'Пакет материалов нужен только для аудита и не повышает черновые или частичные случаи до VERIFIED.',
    'Проверки URL сервера являются только предупреждениями и не требуют доступности backend.',
    ...(userWarnings ?? []),
  ]

  return Array.from(new Set(warnings))
}

function buildUnknownOfficeUrlStatuses(): ReleaseEvidenceUrlStatus[] {
  return defaultOfficeUrls.map((url) => ({
    ...unknownStatus('Офисный URL', 'Не проверено браузерной страницей материалов. Запустите npm run release:evidence для локальных проверок URL.'),
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
