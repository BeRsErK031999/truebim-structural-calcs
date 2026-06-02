import { describe, expect, it } from 'vitest'

import { buildReleaseEvidence } from '../releaseEvidenceBuilder'
import { getReleaseEvidenceExportContent } from '../releaseEvidenceExport'
import { buildReleaseEvidenceSummary } from '../releaseEvidenceSummary'

describe('release evidence', () => {
  it('includes commit and version in the evidence bundle', () => {
    const evidence = buildReleaseEvidence({
      commitHash: 'abc1234',
      appVersion: '1.2.3',
      buildTime: '2026-05-29T01:00:00.000Z',
      generatedAt: '2026-05-29T01:05:00.000Z',
    })

    expect(evidence.commitHash).toBe('abc1234')
    expect(evidence.appVersion).toBe('1.2.3')
    expect(evidence.buildTime).toBe('2026-05-29T01:00:00.000Z')
  })

  it('summarizes the verification matrix', () => {
    const evidence = buildReleaseEvidence({
      commitHash: 'abc1234',
      appVersion: '1.2.3',
      buildTime: '2026-05-29T01:00:00.000Z',
    })
    const summary = buildReleaseEvidenceSummary(evidence)

    expect(summary.verificationMatrix).toEqual(
      expect.arrayContaining([
        expect.stringContaining('центральная колонна, только сила: verified'),
        expect.stringContaining('центральная колонна с моментами: partial'),
      ]),
    )
  })

  it('exports known warnings', () => {
    const evidence = buildReleaseEvidence({
      commitHash: 'abc1234',
      appVersion: '1.2.3',
      buildTime: '2026-05-29T01:00:00.000Z',
      knownWarnings: ['office URL unavailable'],
    })

    expect(getReleaseEvidenceExportContent(evidence, 'md').content).toContain('office URL unavailable')
    expect(getReleaseEvidenceExportContent(evidence, 'json').content).toContain('office URL unavailable')
  })
})
