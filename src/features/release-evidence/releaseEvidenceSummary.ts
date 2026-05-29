import type { ReleaseEvidence } from './releaseEvidenceTypes'

export function buildReleaseEvidenceSummary(evidence: ReleaseEvidence) {
  const blockers = [
    ...evidence.knownWarnings,
    ...evidence.officeUrlsStatus
      .filter((urlStatus) => urlStatus.status === 'fail' || urlStatus.status === 'warning')
      .map((urlStatus) => `${urlStatus.url}: ${urlStatus.details}`),
  ]

  return {
    title: `Release Evidence ${evidence.commitHash}`,
    commit: evidence.commitHash,
    version: evidence.appVersion,
    generatedAt: evidence.generatedAt,
    verificationMatrix: evidence.verificationCapabilityMatrix.map(
      (capability) => `${capability.label}: ${capability.status} (arithmetic: ${capability.arithmeticSupport})`,
    ),
    serverUrls: evidence.officeUrlsStatus.map(
      (urlStatus) => `${urlStatus.url}: ${urlStatus.status} - ${urlStatus.details}`,
    ),
    diagnosticsSummary: [
      `environment: ${evidence.diagnosticsSummary.environment}`,
      `app loaded: ${evidence.diagnosticsSummary.appLoaded}`,
      `localStorage: ${String(evidence.diagnosticsSummary.localStorageAvailable)}`,
      `saved calculations: ${String(evidence.diagnosticsSummary.savedCalculationsCount)}`,
    ],
    validationSessionReadiness: [
      `support: ${evidence.validationSessionStatus.support}`,
      `sessions: ${String(evidence.validationSessionStatus.sessionsCount)}`,
      `engineer package ready: ${evidence.validationSessionStatus.engineerPackageReady}`,
    ],
    knownBlockers: blockers.length > 0 ? blockers : ['none'],
    exportFormats: ['html', 'md', 'json'],
  }
}

export function buildReleaseEvidenceMarkdown(evidence: ReleaseEvidence) {
  const summary = buildReleaseEvidenceSummary(evidence)

  return [
    `# ${summary.title}`,
    '',
    `- Commit: ${evidence.commitHash}`,
    `- Version: ${evidence.appVersion}`,
    `- Build time: ${evidence.buildTime}`,
    `- Generated at: ${evidence.generatedAt}`,
    `- Test status: ${evidence.testStatus.status} - ${evidence.testStatus.details}`,
    `- Deploy precheck: ${evidence.deployPrecheckStatus.status} - ${evidence.deployPrecheckStatus.details}`,
    '',
    '## Counts',
    `- Verified: ${evidence.counts.verified}`,
    `- Draft: ${evidence.counts.draft}`,
    `- Partial: ${evidence.counts.partial}`,
    '',
    '## Verification Matrix',
    ...summary.verificationMatrix.map((item) => `- ${item}`),
    '',
    '## Office URLs',
    ...summary.serverUrls.map((item) => `- ${item}`),
    '',
    '## Diagnostics Summary',
    ...summary.diagnosticsSummary.map((item) => `- ${item}`),
    '',
    '## Validation Session Readiness',
    ...summary.validationSessionReadiness.map((item) => `- ${item}`),
    '',
    '## Review and Candidate Status',
    `- Review mode support: ${evidence.reviewCandidateStatus.reviewModeSupport}`,
    `- Candidate support: ${evidence.reviewCandidateStatus.candidateSupport}`,
    `- Candidate auto-promotion: ${evidence.reviewCandidateStatus.autoPromotion}`,
    `- Manual dataset import required: ${evidence.reviewCandidateStatus.manualDatasetImportRequired}`,
    '',
    '## Known Warnings',
    ...evidence.knownWarnings.map((warning) => `- ${warning}`),
    '',
    '## Rollback Notes',
    ...evidence.rollbackNotes.map((note) => `- ${note}`),
    '',
  ].join('\n')
}
