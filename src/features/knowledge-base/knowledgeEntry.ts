import type { VerificationCase } from '@/calculations/punching-shear/verification/verificationCase'
import type { ReleaseEvidence } from '@/features/release-evidence'
import type { ReviewDiffItem, ReviewSession, VerificationCandidate } from '@/features/review-mode'
import { isReviewAccepted } from '@/features/review-mode'
import type { ValidationSession } from '@/features/validation-session'

import type { KnowledgeCategory } from './knowledgeCategory'
import { isKnowledgeCategory } from './knowledgeCategory'
import { normalizeKnowledgeTags, type KnowledgeTag } from './knowledgeTags'

const storageKey = 'truebim-structural-calcs:knowledge-entries'

export type KnowledgeSourceType =
  | 'manual'
  | 'review-session'
  | 'accepted-review'
  | 'validation-session'
  | 'verification-candidate'
  | 'verified-case'
  | 'release-evidence'
  | 'lessons-learned'
  | 'sp63-note'

export type KnowledgeFindingStatus =
  | 'draft'
  | 'verified'
  | 'open-question'
  | 'unresolved-mismatch'
  | 'recommendation'

export type KnowledgeFinding = {
  id: string
  text: string
  status: KnowledgeFindingStatus
  evidence?: string
}

export type LessonsLearned = {
  issue: string
  rootCause: string
  engineerDecision: string
  evidence: string
  recommendation: string
}

export type Sp63Note = {
  clauseReference: string
  explanation: string
  verifiedInterpretation: string
}

export type KnowledgeEntry = {
  id: string
  title: string
  category: KnowledgeCategory
  tags: KnowledgeTag[]
  createdAt: string
  sourceType: KnowledgeSourceType
  sourceReference: string
  summary: string
  findings: KnowledgeFinding[]
  warnings: string[]
  relatedVerificationCases: string[]
  relatedReviews: string[]
  relatedCandidates: string[]
  lessonsLearned?: LessonsLearned
  sp63Note?: Sp63Note
}

export type KnowledgeEntryInput = Omit<KnowledgeEntry, 'id' | 'createdAt' | 'tags'> & {
  id?: string
  createdAt?: string
  tags?: KnowledgeTag[]
}

export function createKnowledgeEntry(input: KnowledgeEntryInput): KnowledgeEntry {
  return {
    ...input,
    id: input.id ?? createKnowledgeId('knowledge'),
    createdAt: input.createdAt ?? new Date().toISOString(),
    tags: normalizeKnowledgeTags(input.tags ?? []),
    findings: input.findings.map((finding, index) => ({
      ...finding,
      id: finding.id || `finding-${index + 1}`,
    })),
    warnings: uniqueStrings(input.warnings),
    relatedVerificationCases: uniqueStrings(input.relatedVerificationCases),
    relatedReviews: uniqueStrings(input.relatedReviews),
    relatedCandidates: uniqueStrings(input.relatedCandidates),
  }
}

export function createLessonsLearnedEntry({
  title,
  category,
  sourceReference,
  lessonsLearned,
  createdAt,
}: {
  title: string
  category: KnowledgeCategory
  sourceReference: string
  lessonsLearned: LessonsLearned
  createdAt?: string
}) {
  return createKnowledgeEntry({
    title,
    category,
    createdAt,
    tags: ['lesson-learned'],
    sourceType: 'lessons-learned',
    sourceReference,
    summary: lessonsLearned.issue,
    findings: [
      {
        id: 'lesson-recommendation',
        text: lessonsLearned.recommendation,
        status: 'recommendation',
        evidence: lessonsLearned.evidence,
      },
    ],
    warnings: [],
    relatedVerificationCases: [],
    relatedReviews: [],
    relatedCandidates: [],
    lessonsLearned,
  })
}

export function createSp63NoteEntry({
  title,
  clauseReference,
  explanation,
  verifiedInterpretation,
  category = 'SP63',
  createdAt,
}: {
  title: string
  clauseReference: string
  explanation: string
  verifiedInterpretation: string
  category?: KnowledgeCategory
  createdAt?: string
}) {
  return createKnowledgeEntry({
    title,
    category,
    createdAt,
    tags: ['sp63-note', verifiedInterpretation.trim().length > 0 ? 'verified-finding' : 'open-question'],
    sourceType: 'sp63-note',
    sourceReference: clauseReference,
    summary: explanation,
    findings: [
      {
        id: 'sp63-interpretation',
        text: verifiedInterpretation || 'Interpretation is not verified yet.',
        status: verifiedInterpretation.trim().length > 0 ? 'verified' : 'open-question',
        evidence: clauseReference,
      },
    ],
    warnings: [],
    relatedVerificationCases: [],
    relatedReviews: [],
    relatedCandidates: [],
    sp63Note: {
      clauseReference,
      explanation,
      verifiedInterpretation,
    },
  })
}

export function createKnowledgeEntryFromAcceptedReview({
  reviewSession,
  comparisonItems = [],
  now,
}: {
  reviewSession: ReviewSession
  comparisonItems?: ReviewDiffItem[]
  now?: string
}) {
  if (!isReviewAccepted(reviewSession.status)) {
    throw new Error('Knowledge entries can only be created from accepted reviews.')
  }

  const mismatches = comparisonItems.filter((item) => item.severity === 'mismatch')
  const warnings = comparisonItems
    .filter((item) => item.severity === 'warning' || item.severity === 'missing')
    .map((item) => `${item.label}: ${item.severity}`)

  return createKnowledgeEntry({
    title: `Accepted review ${reviewSession.id}`,
    category: mapCaseTypeToKnowledgeCategory(reviewSession.input.caseType),
    createdAt: now,
    tags: [
      'accepted-review',
      'trusted-source',
      mismatches.length > 0 ? 'unresolved-mismatch' : 'verified-finding',
    ],
    sourceType: 'accepted-review',
    sourceReference: reviewSession.evidence.source || reviewSession.id,
    summary: reviewSession.evidence.notes || 'Accepted engineering review captured as knowledge.',
    findings: [
      {
        id: 'accepted-review-decision',
        text: reviewSession.decision.reason || 'Engineer accepted the review evidence for knowledge capture.',
        status: mismatches.length > 0 ? 'unresolved-mismatch' : 'verified',
        evidence: reviewSession.evidence.source,
      },
      ...mismatches.map((item) => ({
        id: `mismatch-${item.key}`,
        text: `${item.label}: приложение=${formatKnowledgeValue(item.appValue)}, ожидается=${formatKnowledgeValue(item.expectedValue)}`,
        status: 'unresolved-mismatch' as const,
        evidence: item.section,
      })),
    ],
    warnings,
    relatedVerificationCases: [],
    relatedReviews: [reviewSession.id],
    relatedCandidates: [],
  })
}

export function createKnowledgeEntryFromVerificationCandidate(candidate: VerificationCandidate, now?: string) {
  return createKnowledgeEntry({
    title: `Кандидат проверки ${candidate.id}`,
    category: mapCaseTypeToKnowledgeCategory(candidate.input.caseType),
    createdAt: now,
    tags: ['candidate', candidate.candidateStatus === 'ready-for-validation' ? 'trusted-source' : 'open-question'],
    sourceType: 'verification-candidate',
    sourceReference: candidate.source,
    summary: candidate.comparisonNotes || 'Кандидат сохранен для ручной валидации.',
    findings: [
      {
        id: 'candidate-status',
        text: `Статус кандидата: ${candidate.candidateStatus}`,
        status: candidate.candidateStatus === 'ready-for-validation' ? 'recommendation' : 'open-question',
        evidence: candidate.checkedAt,
      },
    ],
    warnings: candidate.candidateStatus === 'ready-for-validation' ? [] : ['Кандидат неполный.'],
    relatedVerificationCases: [],
    relatedReviews: [candidate.sourceReviewSessionId],
    relatedCandidates: [candidate.id],
  })
}

export function createKnowledgeEntryFromValidationSession(session: ValidationSession, now?: string) {
  return createKnowledgeEntry({
    title: `Сессия валидации ${session.id}`,
    category: mapCaseTypeToKnowledgeCategory(session.input.caseType),
    createdAt: now,
    tags: ['evidence', 'candidate'],
    sourceType: 'validation-session',
    sourceReference: session.id,
    summary: session.engineerNotes.text || 'Доказательства сессии валидации сохранены.',
    findings: [
      {
        id: 'validation-level',
        text: `Уровень проверки остается ${session.result.verificationLevel}.`,
        status: session.candidateValidated ? 'recommendation' : 'open-question',
        evidence: session.regressionSnapshot.status,
      },
    ],
    warnings: session.reviewComparison.items
      .filter((item) => item.severity === 'mismatch')
      .map((item) => `${item.label}: неразрешенное расхождение`),
    relatedVerificationCases: [],
    relatedReviews: [session.reviewSession.id],
    relatedCandidates: session.candidate ? [session.candidate.id] : [],
  })
}

export function createKnowledgeEntryFromVerifiedCase(verificationCase: VerificationCase, now?: string) {
  return createKnowledgeEntry({
    title: `Проверенный случай ${verificationCase.id}`,
    category: mapCaseTypeToKnowledgeCategory(verificationCase.caseType),
    createdAt: now,
    tags: ['verification-case', verificationCase.status === 'verified' ? 'verified-finding' : 'open-question'],
    sourceType: 'verified-case',
    sourceReference: verificationCase.id,
    summary: verificationCase.notes || verificationCase.title,
    findings: [
      {
        id: 'case-status',
        text: `Статус случая в наборе данных: ${verificationCase.status}.`,
        status: verificationCase.status === 'verified' ? 'verified' : 'draft',
        evidence: verificationCase.verificationSource ?? verificationCase.source,
      },
    ],
    warnings: verificationCase.status === 'verified' ? [] : ['Случай черновой и не подтверждает статус ПРОВЕРЕНО.'],
    relatedVerificationCases: [verificationCase.id],
    relatedReviews: [],
    relatedCandidates: [],
  })
}

export function createKnowledgeEntryFromReleaseEvidence(evidence: ReleaseEvidence, now?: string) {
  return createKnowledgeEntry({
    title: `Доказательства релиза ${evidence.commitHash}`,
    category: 'verification',
    createdAt: now,
    tags: ['release', 'evidence'],
    sourceType: 'release-evidence',
    sourceReference: evidence.commitHash,
    summary: `Доказательства релиза сохранили ${evidence.counts.verified} проверенных и ${evidence.counts.draft} черновых случаев.`,
    findings: [
      {
        id: 'release-counts',
        text: `Проверено=${evidence.counts.verified}, черновик=${evidence.counts.draft}, частично=${evidence.counts.partial}.`,
        status: evidence.counts.verified > 0 ? 'recommendation' : 'open-question',
        evidence: evidence.generatedAt,
      },
    ],
    warnings: evidence.knownWarnings,
    relatedVerificationCases: [],
    relatedReviews: [],
    relatedCandidates: [],
  })
}

export function listKnowledgeEntries(storage: Storage | undefined = globalThis.localStorage): KnowledgeEntry[] {
  if (!storage) {
    return []
  }

  try {
    const raw = storage.getItem(storageKey)

    return raw ? (JSON.parse(raw) as KnowledgeEntry[]) : []
  } catch {
    return []
  }
}

export function saveKnowledgeEntry(
  entry: KnowledgeEntry,
  storage: Storage | undefined = globalThis.localStorage,
) {
  if (!storage) {
    return entry
  }

  const entries = listKnowledgeEntries(storage).filter((item) => item.id !== entry.id)

  storage.setItem(storageKey, JSON.stringify([...entries, entry]))

  return entry
}

export function importKnowledgeEntry(json: string, storage: Storage | undefined = globalThis.localStorage) {
  const entry = JSON.parse(json) as KnowledgeEntry

  return saveKnowledgeEntry(entry, storage)
}

export function exportKnowledgeEntry(entry: KnowledgeEntry) {
  return JSON.stringify(entry, null, 2)
}

export function getKnowledgeDiagnostics(storage: Storage | undefined = globalThis.localStorage) {
  const entries = listKnowledgeEntries(storage)

  return {
    knowledgeBaseSupport: 'local-only' as const,
    knowledgeEntriesCount: entries.length,
    verifiedFindingsCount: entries.reduce(
      (count, entry) => count + entry.findings.filter((finding) => finding.status === 'verified').length,
      0,
    ),
    unresolvedFindingsCount: entries.reduce(
      (count, entry) =>
        count +
        entry.findings.filter(
          (finding) => finding.status === 'open-question' || finding.status === 'unresolved-mismatch',
        ).length +
        entry.warnings.length,
      0,
    ),
  }
}

export function mapCaseTypeToKnowledgeCategory(caseType: string): KnowledgeCategory {
  if (caseType === 'center' || caseType === 'edge' || caseType === 'corner' || caseType === 'wall-end' || caseType === 'wall-corner' || caseType === 'round') {
    return caseType
  }

  return isKnowledgeCategory(caseType) ? caseType : 'verification'
}

function createKnowledgeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)))
}

function formatKnowledgeValue(value: number | string | null) {
  if (value === null) {
    return 'missing'
  }

  return typeof value === 'number' ? value.toFixed(6) : value
}
