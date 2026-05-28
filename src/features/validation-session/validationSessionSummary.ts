import type { ReviewDiffItem, VerificationCandidate } from '@/features/review-mode'

import { getValidationChecklistProgress } from './validationSession'
import type {
  ValidationSession,
  ValidationSessionRecommendation,
  ValidationSessionReviewerSummary,
} from './validationSessionTypes'

export function buildValidationSessionReviewerSummary(
  session: ValidationSession,
): ValidationSessionReviewerSummary {
  const checklist = getValidationChecklistProgress(session)
  const openMismatches = session.reviewComparison.items
    .filter((item) => item.severity === 'mismatch')
    .map(formatMismatch)
  const axisConventionStatus =
    session.reviewSession.evidence.axisConventionNotes.trim().length > 0 ? 'documented' : 'missing'
  const driftStatus =
    session.regressionSnapshot.status === 'drift-detected'
      ? 'drift-detected'
      : session.regressionSnapshot.status === 'frozen'
        ? 'stable'
        : 'not-frozen'

  return {
    currentVerificationLevel: session.result.verificationLevel,
    verifiedFeatures: [...session.result.verifiedFeatures],
    draftFeatures: [...session.result.draftFeatures],
    missingTrustedEvidence: getMissingTrustedEvidence(session.candidate),
    openMismatches,
    axisConventionStatus,
    driftStatus,
    recommendation: resolveRecommendation({
      hasBlockingItems: checklist.blockingItems.length > 0,
      openMismatchCount: openMismatches.length,
      driftStatus,
      candidate: session.candidate,
    }),
  }
}

export function buildValidationSessionSummaryText(session: ValidationSession) {
  const summary = buildValidationSessionReviewerSummary(session)
  const checklist = getValidationChecklistProgress(session)

  return [
    '# Validation Session Summary',
    '',
    `- Session: ${session.id}`,
    `- Calculation: ${session.calculationId ?? 'not saved'}`,
    `- Verification level: ${summary.currentVerificationLevel}`,
    `- Review status: ${session.reviewSession.status}`,
    `- Candidate status: ${session.candidate?.candidateStatus ?? 'not-created'}`,
    `- Checklist: ${checklist.completePercent}% (${checklist.completeCount}/${checklist.totalCount})`,
    `- Axis convention: ${summary.axisConventionStatus}`,
    `- Drift status: ${summary.driftStatus}`,
    `- Recommendation: ${summary.recommendation}`,
    '',
    '## Verified Features',
    ...formatList(summary.verifiedFeatures),
    '',
    '## Draft Features',
    ...formatList(summary.draftFeatures),
    '',
    '## Missing Trusted Evidence',
    ...formatList(summary.missingTrustedEvidence),
    '',
    '## Open Mismatches',
    ...formatList(summary.openMismatches),
    '',
    '## Blocking Checklist Items',
    ...formatList(checklist.blockingItems.map((item) => item.missingText)),
    '',
  ].join('\n')
}

function resolveRecommendation({
  hasBlockingItems,
  openMismatchCount,
  driftStatus,
  candidate,
}: {
  hasBlockingItems: boolean
  openMismatchCount: number
  driftStatus: ValidationSessionReviewerSummary['driftStatus']
  candidate: VerificationCandidate | null
}): ValidationSessionRecommendation {
  if (openMismatchCount > 0 || driftStatus === 'drift-detected') {
    return 'requires investigation'
  }

  if (!hasBlockingItems && candidate?.candidateStatus === 'ready-for-validation') {
    return 'ready for verification'
  }

  return 'keep partial'
}

function getMissingTrustedEvidence(candidate: VerificationCandidate | null) {
  if (!candidate || candidate.candidateStatus !== 'ready-for-validation') {
    return ['ready verification candidate']
  }

  return []
}

function formatMismatch(item: ReviewDiffItem) {
  return `${item.label}: app=${formatValue(item.appValue)}, trusted=${formatValue(item.expectedValue)}`
}

function formatValue(value: number | string | null) {
  return value === null ? 'missing' : String(value)
}

function formatList(values: string[]) {
  return values.length > 0 ? values.map((value) => `- ${value}`) : ['- none']
}
