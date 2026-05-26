import type { StressRegressionCaseResult } from './stressRegressionRunner'
import type { StressRegressionSummary } from './stressRegressionSummary'

export function buildStressRegressionReport({
  results,
  summary,
}: {
  results: StressRegressionCaseResult[]
  summary: StressRegressionSummary
}) {
  return [
    '# Stress Regression',
    '',
    `total: ${summary.total}`,
    `passed: ${summary.passed}`,
    `failed: ${summary.failed}`,
    `drifted: ${summary.drifted}`,
    `draft placeholders: ${summary.draftPlaceholders}`,
    '',
    '| Case | Status | Checksum | Drift detected | Warnings |',
    '| --- | --- | --- | --- | --- |',
    ...results.map((result) =>
      [
        result.caseId,
        result.regressionStatus,
        String(result.actual.stressDistributionChecksum),
        result.driftDetected ? 'yes' : 'no',
        result.warnings.join('; ') || 'none',
      ].map(escapeMarkdownCell).join(' | '),
    ).map((row) => `| ${row} |`),
    '',
  ].join('\n')
}

function escapeMarkdownCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}
