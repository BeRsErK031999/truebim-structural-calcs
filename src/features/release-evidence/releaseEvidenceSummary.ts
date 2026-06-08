import type { ReleaseEvidence } from './releaseEvidenceTypes'

export function buildReleaseEvidenceSummary(evidence: ReleaseEvidence) {
  const blockers = [
    ...evidence.knownWarnings,
    ...evidence.officeUrlsStatus
      .filter((urlStatus) => urlStatus.status === 'fail' || urlStatus.status === 'warning')
      .map((urlStatus) => `${urlStatus.url}: ${urlStatus.details}`),
  ]

  return {
    title: `Релизные материалы ${evidence.commitHash}`,
    commit: evidence.commitHash,
    version: evidence.appVersion,
    generatedAt: evidence.generatedAt,
    verificationMatrix: evidence.verificationCapabilityMatrix.map(
      (capability) => `${capability.label}: ${capability.status} (арифметика: ${capability.arithmeticSupport})`,
    ),
    serverUrls: evidence.officeUrlsStatus.map(
      (urlStatus) => `${urlStatus.url}: ${urlStatus.status} - ${urlStatus.details}`,
    ),
    diagnosticsSummary: [
      `среда: ${evidence.diagnosticsSummary.environment}`,
      `приложение загружено: ${evidence.diagnosticsSummary.appLoaded}`,
      `localStorage: ${String(evidence.diagnosticsSummary.localStorageAvailable)}`,
      `сохраненные расчеты: ${String(evidence.diagnosticsSummary.savedCalculationsCount)}`,
    ],
    validationSessionReadiness: [
      `поддержка: ${evidence.validationSessionStatus.support}`,
      `сессии: ${String(evidence.validationSessionStatus.sessionsCount)}`,
      `пакет инженера готов: ${evidence.validationSessionStatus.engineerPackageReady}`,
    ],
    knownBlockers: blockers.length > 0 ? blockers : ['нет'],
    exportFormats: ['html', 'md', 'json'],
  }
}

export function buildReleaseEvidenceMarkdown(evidence: ReleaseEvidence) {
  const summary = buildReleaseEvidenceSummary(evidence)

  return [
    `# ${summary.title}`,
    '',
    `- Коммит: ${evidence.commitHash}`,
    `- Версия: ${evidence.appVersion}`,
    `- Время сборки: ${evidence.buildTime}`,
    `- Сформировано: ${evidence.generatedAt}`,
    `- Статус тестов: ${evidence.testStatus.status} - ${evidence.testStatus.details}`,
    `- Предпроверка деплоя: ${evidence.deployPrecheckStatus.status} - ${evidence.deployPrecheckStatus.details}`,
    '',
    '## Количества',
    `- Проверено: ${evidence.counts.verified}`,
    `- Черновики: ${evidence.counts.draft}`,
    `- Частично: ${evidence.counts.partial}`,
    '',
    '## Матрица проверки',
    ...summary.verificationMatrix.map((item) => `- ${item}`),
    '',
    '## Офисные URL',
    ...summary.serverUrls.map((item) => `- ${item}`),
    '',
    '## Сводка диагностики',
    ...summary.diagnosticsSummary.map((item) => `- ${item}`),
    '',
    '## Готовность сессии валидации',
    ...summary.validationSessionReadiness.map((item) => `- ${item}`),
    '',
    '## Статус проверки и кандидата',
    `- Поддержка режима проверки: ${evidence.reviewCandidateStatus.reviewModeSupport}`,
    `- Поддержка кандидата: ${evidence.reviewCandidateStatus.candidateSupport}`,
    `- Автоповышение кандидата: ${evidence.reviewCandidateStatus.autoPromotion}`,
    `- Нужен ручной импорт набора данных: ${evidence.reviewCandidateStatus.manualDatasetImportRequired}`,
    '',
    '## Известные предупреждения',
    ...evidence.knownWarnings.map((warning) => `- ${warning}`),
    '',
    '## Заметки по откату',
    ...evidence.rollbackNotes.map((note) => `- ${note}`),
    '',
  ].join('\n')
}
