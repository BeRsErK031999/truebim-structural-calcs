import type { VerificationCase } from './verificationCase'

export type VerificationSummary = {
  totalCases: number
  draftCases: number
  verifiedCases: number
  rejectedCases: number
  passedCases: number
  failedCases: number
  warning: string | null
}

export type VerificationSummaryInput = {
  status: VerificationCase['status']
  passed?: boolean
}

export function summarizeVerificationResults(
  results: VerificationSummaryInput[],
): VerificationSummary {
  const verifiedCases = countByStatus(results, 'verified')

  return {
    totalCases: results.length,
    draftCases: countByStatus(results, 'draft'),
    verifiedCases,
    rejectedCases: countByStatus(results, 'rejected'),
    passedCases: results.filter((result) => result.passed === true).length,
    failedCases: results.filter((result) => result.passed === false).length,
    warning: verifiedCases === 0 ? 'Пока нет verified cases по СП63' : null,
  }
}

function countByStatus(results: VerificationSummaryInput[], status: VerificationCase['status']) {
  return results.filter((result) => result.status === status).length
}
