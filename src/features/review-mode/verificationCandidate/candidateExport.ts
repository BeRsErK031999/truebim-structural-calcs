import type { VerificationCandidate } from './candidateTypes'

const candidateFields = [
  'id',
  'createdAt',
  'sourceReviewSessionId',
  'calculationId',
  'input',
  'expected',
  'tolerances',
  'source',
  'checkedBy',
  'checkedAt',
  'comparisonNotes',
  'axisConventionNotes',
  'attachments',
  'candidateStatus',
] as const

export function buildCandidateJson(candidate: VerificationCandidate) {
  const exportable = Object.fromEntries(candidateFields.map((field) => [field, candidate[field]]))

  return JSON.stringify(exportable, null, 2)
}

export function downloadCandidateJson(candidate: VerificationCandidate) {
  const blob = new Blob([buildCandidateJson(candidate)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `${candidate.id}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function buildCandidateSummary(candidate: VerificationCandidate) {
  return [
    `Verification candidate: ${candidate.id}`,
    `Status: ${candidate.candidateStatus}`,
    `Source review session: ${candidate.sourceReviewSessionId}`,
    `Calculation: ${candidate.calculationId ?? 'not saved'}`,
    `Source: ${candidate.source}`,
    `Checked by: ${candidate.checkedBy}`,
    `Checked at: ${candidate.checkedAt}`,
    'Candidate is not VERIFIED and is not automatically added to the verification dataset.',
  ].join('\n')
}
