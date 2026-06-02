import { describe, expect, it } from 'vitest'

import {
  buildPilotFeedbackExport,
  buildPilotFeedbackExportFileName,
  pilotIssueCategories,
  savePilotFeedback,
} from '@/features/pilot-feedback'
import { createValidationSession, saveValidationSession } from '@/features/validation-session'
import { calculatePunchingShear, buildPunchingShearReport } from '@/calculations/punching-shear'
import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'

import {
  buildPilotDashboard,
  pilotNotDesignUseItems,
  pilotRoadmapItems,
  pilotRoute,
  pilotUsableItems,
  pilotWarnings,
} from '../pilotContent'

describe('pilot mode', () => {
  it('defines the pilot route', () => {
    expect(pilotRoute).toBe('/pilot')
  })

  it('renders the required issue categories through content data', () => {
    expect(pilotIssueCategories).toEqual([
      'UI',
      'Geometry',
      'Stress',
      'Verification',
      'Export',
      'Review Workflow',
      'Documentation',
      'Other',
    ])
  })

  it('renders pilot engineer warnings through content data', () => {
    expect(pilotWarnings).toEqual(
      expect.arrayContaining([
        'VERIFIED does not mean full SP63 support.',
        'Edge columns, corner columns, and openings are still DRAFT.',
        'Moment transfer is PARTIAL and requires trusted engineering evidence.',
        'Every pilot calculation requires manual review before engineering use.',
        'Trusted evidence must be returned with the validation package.',
      ]),
    )
  })

  it('exposes pilot readiness text and roadmap items', () => {
    expect(pilotUsableItems).toEqual(
      expect.arrayContaining([
        'Test the UI calculation flow and compare output against trusted engineering evidence.',
        'Export HTML/Markdown reports for review packages.',
        'Use review mode to record accepted, rejected, or mismatch evidence.',
      ]),
    )
    expect(pilotNotDesignUseItems).toEqual(
      expect.arrayContaining([
        'Do not use the app as the only source for a project design decision.',
        'Do not treat full SP63.13330.2018 support as implemented.',
      ]),
    )
    expect(pilotRoadmapItems).toEqual(
      expect.arrayContaining([
        'Verified center force-only',
        'Verified center moments',
        'Verified edge/corner',
        'Verified openings',
        'Wall/end-wall cases',
        'Multiple control perimeters',
        'Shear reinforcement',
        'DOCX/PDF official report',
        'Full SP63 trace',
        'Golden examples pack',
      ]),
    )
  })

  it('does not claim complete SP63 production coverage in pilot copy', () => {
    const pilotCopy = [
      ...pilotWarnings,
      ...pilotUsableItems,
      ...pilotNotDesignUseItems,
      ...pilotRoadmapItems,
    ].join('\n')

    expect(pilotCopy).not.toMatch(new RegExp(['full', 'SP63', 'production', 'support'].join(' '), 'i'))
    expect(pilotCopy).not.toMatch(new RegExp(['production', 'SP63', 'support', 'is', 'implemented'].join(' '), 'i'))
  })

  it('counts dashboard readiness data from local storage', () => {
    const storage = createMemoryStorage()
    const input = defaultPunchingShearInput
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const session = createValidationSession({ input, result, report })

    savePilotFeedback(
      {
        engineer: 'Engineer',
        date: '2026-06-02',
        calculation: 'center + Mx',
        category: 'Stress',
        problem: 'Check stress point',
        note: 'Needs review',
        suggestion: 'Return trusted comparison',
        calculationId: 'calc-1',
        reviewStatus: 'accepted',
        verificationLevel: 'partial',
      },
      storage,
      new Date('2026-06-02T08:00:00.000Z'),
    )
    saveValidationSession(
      {
        ...session,
        candidate: {
          id: 'candidate-1',
          createdAt: '2026-06-02T08:00:00.000Z',
          sourceReviewSessionId: 'review-1',
          calculationId: 'calc-1',
          input,
          expected: {},
          tolerances: {},
          source: 'manual',
          checkedBy: 'Engineer',
          checkedAt: '2026-06-02',
          comparisonNotes: '',
          axisConventionNotes: '',
          attachments: [],
          candidateStatus: 'incomplete',
        },
        exports: {
          ...session.exports,
          packageExported: true,
        },
      },
      storage,
    )

    const dashboard = buildPilotDashboard(storage)

    expect(dashboard.verifiedFeatures).toHaveLength(1)
    expect(dashboard.partialFeatures).toHaveLength(1)
    expect(dashboard.draftFeatures).toHaveLength(5)
    expect(dashboard.feedbackCount).toBe(1)
    expect(dashboard.validationSessionsCount).toBe(1)
    expect(dashboard.candidatesCount).toBe(1)
    expect(dashboard.releaseEvidenceStatus).toBe('ready')
  })

  it('exports feedback JSON with app and review metadata', () => {
    const storage = createMemoryStorage()
    const entry = savePilotFeedback(
      {
        engineer: 'Engineer',
        date: '2026-06-02',
        calculation: 'edge',
        category: 'Geometry',
        problem: 'Boundary clipping mismatch',
        note: 'Compare against manual sketch',
        suggestion: 'Add screenshot field to package',
        calculationId: 'calc-edge-1',
        reviewStatus: 'needs-investigation',
        verificationLevel: 'draft',
      },
      storage,
      new Date('2026-06-02T09:00:00.000Z'),
    )

    const exported = buildPilotFeedbackExport(
      [entry],
      {
        version: '1.2.3',
        commit: 'abc1234',
        buildTime: '2026-06-02T08:00:00.000Z',
        environment: 'production',
      },
      new Date('2026-06-02T10:00:00.000Z'),
    )

    expect(buildPilotFeedbackExportFileName(new Date('2026-06-02T10:00:00.000Z'))).toBe(
      'pilot-feedback-2026-06-02.json',
    )
    expect(exported.appVersion).toBe('1.2.3')
    expect(exported.commit).toBe('abc1234')
    expect(exported.feedback[0]).toMatchObject({
      category: 'Geometry',
      calculationId: 'calc-edge-1',
      reviewStatus: 'needs-investigation',
      verificationLevel: 'draft',
      notes: expect.stringContaining('Boundary clipping mismatch'),
    })
  })
})

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}
