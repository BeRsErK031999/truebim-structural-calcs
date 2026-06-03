import { describe, expect, it } from 'vitest'

import {
  createKnowledgeEntry,
  createKnowledgeEntryFromAcceptedReview,
  createLessonsLearnedEntry,
  createSp63NoteEntry,
  getKnowledgeDiagnostics,
  saveKnowledgeEntry,
  searchKnowledgeEntries,
} from '@/features/knowledge-base'
import { createReviewSession } from '@/features/review-mode'
import type { ReviewDiffItem } from '@/features/review-mode'

import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'

describe('knowledge base domain', () => {
  it('creates a normalized knowledge entry', () => {
    const entry = createKnowledgeEntry({
      id: 'kb-1',
      createdAt: '2026-06-03T10:00:00.000Z',
      title: 'Center case evidence',
      category: 'center',
      tags: ['Verified-Finding', ' evidence ', 'evidence'],
      sourceType: 'manual',
      sourceReference: 'manual-note',
      summary: 'Manual evidence summary',
      findings: [{ id: '', text: 'Stress matches trusted calculation.', status: 'verified' }],
      warnings: ['', 'draft only', 'draft only'],
      relatedVerificationCases: ['center-1', 'center-1'],
      relatedReviews: [],
      relatedCandidates: [],
    })

    expect(entry.tags).toEqual(['evidence', 'verified-finding'])
    expect(entry.findings[0].id).toBe('finding-1')
    expect(entry.warnings).toEqual(['draft only'])
    expect(entry.relatedVerificationCases).toEqual(['center-1'])
  })

  it('filters by category and search text', () => {
    const entries = [
      createKnowledgeEntry({
        id: 'kb-center',
        createdAt: '2026-06-03T10:00:00.000Z',
        title: 'Center perimeter note',
        category: 'center',
        tags: ['verified-finding'],
        sourceType: 'manual',
        sourceReference: 'manual',
        summary: 'Perimeter agreement',
        findings: [],
        warnings: [],
        relatedVerificationCases: [],
        relatedReviews: [],
        relatedCandidates: [],
      }),
      createKnowledgeEntry({
        id: 'kb-edge',
        createdAt: '2026-06-03T10:00:00.000Z',
        title: 'Edge open issue',
        category: 'edge',
        tags: ['open-question'],
        sourceType: 'manual',
        sourceReference: 'manual',
        summary: 'Boundary clipping needs review',
        findings: [],
        warnings: [],
        relatedVerificationCases: [],
        relatedReviews: [],
        relatedCandidates: [],
      }),
    ]

    expect(searchKnowledgeEntries(entries, { category: 'center' })).toHaveLength(1)
    expect(searchKnowledgeEntries(entries, { query: 'clipping' })[0].id).toBe('kb-edge')
  })

  it('creates lessons learned entries', () => {
    const entry = createLessonsLearnedEntry({
      title: 'Moment convention lesson',
      category: 'moments',
      sourceReference: 'review-1',
      lessonsLearned: {
        issue: 'Moment sign mismatch',
        rootCause: 'Trusted source used opposite My convention.',
        engineerDecision: 'Document axis convention before candidate creation.',
        evidence: 'review-1',
        recommendation: 'Require axis convention notes in every moment review.',
      },
    })

    expect(entry.sourceType).toBe('lessons-learned')
    expect(entry.tags).toContain('lesson-learned')
    expect(entry.lessonsLearned?.rootCause).toContain('opposite My')
  })

  it('creates SP63 notes without storing standard text', () => {
    const entry = createSp63NoteEntry({
      title: 'Clause interpretation',
      clauseReference: 'SP63 clause 8.x',
      explanation: 'Internal explanation only.',
      verifiedInterpretation: 'Engineer confirmed this interpretation for center force-only cases.',
    })

    expect(entry.category).toBe('SP63')
    expect(entry.sp63Note?.clauseReference).toBe('SP63 clause 8.x')
    expect(entry.findings[0].status).toBe('verified')
  })

  it('converts accepted review into knowledge entry', () => {
    const baseReview = createReviewSession({ input: defaultPunchingShearInput })
    const review = {
      ...baseReview,
      status: 'accepted' as const,
      evidence: {
        ...baseReview.evidence,
        source: 'manual' as const,
        notes: 'Manual calculation agrees with the app within tolerance.',
      },
      decision: {
        reason: 'Accepted for knowledge capture.',
      },
    }
    const comparisonItems: ReviewDiffItem[] = [
      {
        key: 'controlPerimeterMm',
        label: 'Control perimeter',
        section: 'geometry',
        appValue: 1200,
        expectedValue: 1200,
        delta: 0,
        tolerance: 1,
        severity: 'match',
      },
    ]

    const entry = createKnowledgeEntryFromAcceptedReview({ reviewSession: review, comparisonItems })

    expect(entry.sourceType).toBe('accepted-review')
    expect(entry.relatedReviews).toEqual([review.id])
    expect(entry.findings[0].status).toBe('verified')
  })

  it('counts diagnostics from stored entries', () => {
    const storage = createMemoryStorage()
    saveKnowledgeEntry(
      createKnowledgeEntry({
        id: 'kb-count',
        createdAt: '2026-06-03T10:00:00.000Z',
        title: 'Counted entry',
        category: 'verification',
        tags: [],
        sourceType: 'manual',
        sourceReference: 'manual',
        summary: 'Count me',
        findings: [
          { id: 'verified', text: 'Verified finding', status: 'verified' },
          { id: 'open', text: 'Open question', status: 'open-question' },
        ],
        warnings: ['Unresolved warning'],
        relatedVerificationCases: [],
        relatedReviews: [],
        relatedCandidates: [],
      }),
      storage,
    )

    expect(getKnowledgeDiagnostics(storage)).toMatchObject({
      knowledgeBaseSupport: 'local-only',
      knowledgeEntriesCount: 1,
      verifiedFindingsCount: 1,
      unresolvedFindingsCount: 2,
    })
  })
})

function createMemoryStorage() {
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
  } satisfies Storage
}
