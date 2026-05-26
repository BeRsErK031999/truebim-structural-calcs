export type StressRegressionCaseStatus = 'passed' | 'failed' | 'drifted' | 'draft-placeholder'

export type StressRegressionSummary = {
  total: number
  passed: number
  failed: number
  drifted: number
  draftPlaceholders: number
}

export function summarizeStressRegressionResults(
  results: Array<{ regressionStatus: StressRegressionCaseStatus }>,
): StressRegressionSummary {
  return {
    total: results.length,
    passed: results.filter((result) => result.regressionStatus === 'passed').length,
    failed: results.filter((result) => result.regressionStatus === 'failed').length,
    drifted: results.filter((result) => result.regressionStatus === 'drifted').length,
    draftPlaceholders: results.filter((result) => result.regressionStatus === 'draft-placeholder').length,
  }
}
