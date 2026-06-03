import { buildPunchingShearHtmlReport, buildPunchingShearMarkdownReport } from '@/features/report-export'
import { createReportMetadata } from '@/features/report-export/reportMetadata'
import { buildCandidateJson, buildReviewSnapshot, serializeReviewSnapshot } from '@/features/review-mode'
import { downloadTextFile } from '@/features/report-export'

import { getValidationChecklistProgress, setValidationSessionExportStatus } from './validationSession'
import { buildValidationSessionSummaryText } from './validationSessionSummary'
import type { ValidationSession, ValidationSessionPackage } from './validationSessionTypes'

export function buildValidationSessionPackage(
  session: ValidationSession,
  generatedAt = new Date().toISOString(),
  options: { incompleteDebug?: boolean } = {},
): ValidationSessionPackage {
  const rootFolder = createPackageRoot(session)
  const reportMetadata = createReportMetadata(new Date(generatedAt), session.calculationId ?? undefined)
  const reviewSnapshot = buildReviewSnapshot({
    input: session.input,
    result: session.result,
    session: session.reviewSession,
    comparison: session.reviewComparison,
    exportedAt: generatedAt,
  })
  const checklist = getValidationChecklistProgress(session)
  const metadata = {
    generatedAt,
    sessionId: session.id,
    calculationId: session.calculationId,
    verificationLevel: session.result.verificationLevel,
    reviewStatus: session.reviewSession.status,
    candidateStatus: session.candidate?.candidateStatus ?? 'not-created',
    packageStatus: checklist.blockingItems.length === 0 ? 'complete' : 'incomplete',
    warning:
      checklist.blockingItems.length > 0
        ? 'INCOMPLETE PACKAGE: blocking checklist items remain unresolved. Use for debugging only.'
        : null,
    blockingItems: checklist.blockingItems.map((item) => item.key),
    incompleteDebug: options.incompleteDebug === true,
    deterministicPackage: true,
    candidateDoesNotImportDataset: true,
    acceptedReviewDoesNotPromoteVerified: true,
  }

  return {
    rootFolder,
    generatedAt,
    files: [
      {
        path: `${rootFolder}/reports/punching-shear-report.html`,
        mimeType: 'text/html',
        content: buildPunchingShearHtmlReport(session.input, session.result, session.report, reportMetadata),
      },
      {
        path: `${rootFolder}/reports/punching-shear-report.md`,
        mimeType: 'text/markdown',
        content: buildPunchingShearMarkdownReport(session.input, session.result, session.report, reportMetadata),
      },
      {
        path: `${rootFolder}/review/review-snapshot.json`,
        mimeType: 'application/json',
        content: serializeReviewSnapshot(reviewSnapshot),
      },
      {
        path: `${rootFolder}/candidate/verification-candidate.json`,
        mimeType: 'application/json',
        content: session.candidate ? buildCandidateJson(session.candidate) : '{}',
      },
      {
        path: `${rootFolder}/regression/regression-snapshot.json`,
        mimeType: 'application/json',
        content: JSON.stringify(session.regressionSnapshot, null, 2),
      },
      {
        path: `${rootFolder}/notes/engineer-notes.md`,
        mimeType: 'text/markdown',
        content: buildEngineerNotes(session),
      },
      {
        path: `${rootFolder}/metadata/checklist.json`,
        mimeType: 'application/json',
        content: JSON.stringify(checklist, null, 2),
      },
      {
        path: `${rootFolder}/metadata/summary.md`,
        mimeType: 'text/markdown',
        content: buildValidationSessionSummaryText(session),
      },
      {
        path: `${rootFolder}/metadata/package.json`,
        mimeType: 'application/json',
        content: JSON.stringify(metadata, null, 2),
      },
    ],
  }
}

export function buildValidationSessionPackageManifest(session: ValidationSession) {
  return JSON.stringify(buildValidationSessionPackage(session), null, 2)
}

export function canExportValidationSessionPackage(session: ValidationSession) {
  return getValidationChecklistProgress(session).blockingItems.length === 0
}

export function downloadValidationSessionPackageManifest(
  session: ValidationSession,
  options: { incompleteDebug?: boolean } = {},
) {
  if (!options.incompleteDebug && !canExportValidationSessionPackage(session)) {
    return session
  }

  const nextSession = setValidationSessionExportStatus(session, { packageExported: true })

  downloadTextFile(
    `${createPackageRoot(session)}${options.incompleteDebug ? '-incomplete-debug' : ''}.json`,
    JSON.stringify(buildValidationSessionPackage(nextSession, new Date().toISOString(), options), null, 2),
    'application/json',
  )

  return nextSession
}

function createPackageRoot(session: ValidationSession) {
  return `validation-session-${sanitizePathSegment(session.calculationId ?? session.id)}`
}

function buildEngineerNotes(session: ValidationSession) {
  return [
    '# Engineer Notes',
    '',
    session.engineerNotes.text.trim() || 'No engineer notes attached.',
    '',
    '## Attachments',
    ...(
      session.engineerNotes.attachments.length > 0
        ? session.engineerNotes.attachments.map(
            (attachment) => `- ${attachment.kind}: ${attachment.name} (${attachment.reference})`,
          )
        : ['- none']
    ),
    '',
  ].join('\n')
}

function sanitizePathSegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || 'unsaved'
}
