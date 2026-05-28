import { buildPunchingShearReport } from '@/calculations/punching-shear'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'
import {
  buildReviewComparison,
  createReviewSession,
  createVerificationCandidateFromReview,
  hasTrustedVerificationCandidateSource,
  type ReviewSession,
} from '@/features/review-mode'

import type {
  ValidationSession,
  ValidationSessionChecklistItem,
  ValidationSessionChecklistProgress,
  ValidationSessionEngineerNotes,
  ValidationSessionExportStatus,
  ValidationSessionRegressionSnapshot,
} from './validationSessionTypes'

const checklistDefinitions: Array<Omit<ValidationSessionChecklistItem, 'complete'>> = [
  {
    key: 'reportExported',
    label: 'Report exported',
    blocking: true,
    missingText: 'Export both HTML and Markdown reports.',
  },
  {
    key: 'reviewCompleted',
    label: 'Review completed',
    blocking: true,
    missingText: 'Move review out of pending status.',
  },
  {
    key: 'acceptedReview',
    label: 'Accepted review',
    blocking: true,
    missingText: 'Accepted engineering review is required before candidate validation.',
  },
  {
    key: 'candidateCreated',
    label: 'Candidate created',
    blocking: true,
    missingText: 'Create a verification candidate from the accepted review.',
  },
  {
    key: 'candidateValidated',
    label: 'Candidate validated',
    blocking: true,
    missingText: 'Run the candidate CLI and attach the PASS result.',
  },
  {
    key: 'engineerNotesAttached',
    label: 'Engineer notes attached',
    blocking: false,
    missingText: 'Attach engineer notes or comparison comments.',
  },
  {
    key: 'trustedSourceAttached',
    label: 'Trusted source attached',
    blocking: true,
    missingText: 'Attach manual, WebCAD, Excel, or normative evidence.',
  },
  {
    key: 'regressionSnapshotFrozen',
    label: 'Regression snapshot frozen',
    blocking: true,
    missingText: 'Freeze a regression snapshot for drift tracking.',
  },
]

export function createValidationSession({
  input,
  result,
  report = buildPunchingShearReport(input, result),
  reviewSession = createReviewSession({ input }),
  candidate = null,
  now = new Date().toISOString(),
}: {
  input: PunchingShearInput
  result: PunchingShearResult
  report?: PunchingShearReportModel
  reviewSession?: ReviewSession
  candidate?: ValidationSession['candidate']
  now?: string
}): ValidationSession {
  const reviewComparison = buildReviewComparison(result, reviewSession.evidence)

  return {
    id: createValidationSessionId('validation-session'),
    createdAt: now,
    updatedAt: now,
    calculationId: reviewSession.calculationId,
    input,
    result,
    report,
    reviewSession,
    reviewComparison,
    candidate,
    candidateValidated: false,
    exports: createEmptyExportStatus(),
    regressionSnapshot: createEmptyRegressionSnapshot(),
    engineerNotes: createEmptyEngineerNotes(),
  }
}

export function syncValidationSessionReview(
  session: ValidationSession,
  reviewSession: ReviewSession,
  now = new Date().toISOString(),
): ValidationSession {
  const candidateResult = createVerificationCandidateFromReview(reviewSession, now)

  return {
    ...session,
    updatedAt: now,
    calculationId: reviewSession.calculationId,
    reviewSession,
    reviewComparison: buildReviewComparison(session.result, reviewSession.evidence),
    candidate: candidateResult.validation.valid ? candidateResult.candidate : session.candidate,
  }
}

export function setValidationSessionExportStatus(
  session: ValidationSession,
  exports: Partial<ValidationSessionExportStatus>,
  now = new Date().toISOString(),
): ValidationSession {
  return {
    ...session,
    updatedAt: now,
    exports: {
      ...session.exports,
      ...exports,
    },
  }
}

export function setValidationSessionEngineerNotes(
  session: ValidationSession,
  engineerNotes: ValidationSessionEngineerNotes,
  now = new Date().toISOString(),
): ValidationSession {
  return {
    ...session,
    updatedAt: now,
    engineerNotes,
  }
}

export function markValidationCandidateValidated(
  session: ValidationSession,
  candidateValidated: boolean,
  now = new Date().toISOString(),
): ValidationSession {
  return {
    ...session,
    updatedAt: now,
    candidateValidated,
  }
}

export function freezeValidationRegressionSnapshot(
  session: ValidationSession,
  now = new Date().toISOString(),
): ValidationSession {
  const driftCount = session.reviewSession.frozenSnapshots.flatMap((snapshot) =>
    Object.entries(snapshot.result).filter(([field, value]) => {
      if (field === 'warnings') {
        return false
      }

      const resultValue = session.result[field as keyof PunchingShearResult]

      return resultValue !== value
    }),
  ).length

  return {
    ...session,
    updatedAt: now,
    regressionSnapshot: {
      id: createValidationSessionId('regression-snapshot'),
      frozenAt: now,
      status: driftCount > 0 ? 'drift-detected' : 'frozen',
      driftCount,
      notes:
        driftCount > 0
          ? 'Frozen review snapshot differs from current result.'
          : 'Current result is frozen for validation session drift tracking.',
    },
  }
}

export function getValidationChecklistProgress(
  session: ValidationSession,
): ValidationSessionChecklistProgress {
  const completeByKey: Record<ValidationSessionChecklistItem['key'], boolean> = {
    reportExported: session.exports.htmlReportExported && session.exports.markdownReportExported,
    reviewCompleted: session.reviewSession.status !== 'pending-review',
    acceptedReview: session.reviewSession.status === 'accepted',
    candidateCreated: session.candidate?.candidateStatus === 'ready-for-validation',
    candidateValidated: session.candidateValidated,
    engineerNotesAttached:
      session.engineerNotes.text.trim().length > 0 ||
      session.engineerNotes.attachments.some((attachment) => attachment.kind === 'engineer-note'),
    trustedSourceAttached:
      hasTrustedVerificationCandidateSource(session.reviewSession.evidence.source) &&
      session.engineerNotes.attachments.some((attachment) => attachment.kind === 'trusted-source'),
    regressionSnapshotFrozen: session.regressionSnapshot.status === 'frozen',
  }
  const items = checklistDefinitions.map((item) => ({
    ...item,
    complete: completeByKey[item.key],
  }))
  const completeCount = items.filter((item) => item.complete).length

  return {
    items,
    completeCount,
    totalCount: items.length,
    completePercent: Math.round((completeCount / items.length) * 100),
    missingItems: items.filter((item) => !item.complete),
    blockingItems: items.filter((item) => !item.complete && item.blocking),
  }
}

function createEmptyExportStatus(): ValidationSessionExportStatus {
  return {
    htmlReportExported: false,
    markdownReportExported: false,
    reviewSnapshotExported: false,
    candidateJsonExported: false,
    packageExported: false,
  }
}

function createEmptyRegressionSnapshot(): ValidationSessionRegressionSnapshot {
  return {
    id: 'not-frozen',
    frozenAt: '',
    status: 'not-frozen',
    driftCount: 0,
    notes: 'No regression snapshot frozen for this validation session.',
  }
}

function createEmptyEngineerNotes(): ValidationSessionEngineerNotes {
  return {
    text: '',
    attachedAt: null,
    attachments: [],
  }
}

function createValidationSessionId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random()}`
}
