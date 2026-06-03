import type { PunchingShearInput, PunchingShearResult } from '@/calculations/punching-shear'

import type { KnowledgeCategory } from './knowledgeCategory'
import type { KnowledgeEntry } from './knowledgeEntry'
import { listKnowledgeEntries, mapCaseTypeToKnowledgeCategory } from './knowledgeEntry'
import { hasKnowledgeTag } from './knowledgeTags'

export type KnowledgeSearchFilters = {
  query?: string
  category?: KnowledgeCategory | 'all'
  tags?: string[]
  includeWarnings?: boolean
}

export function searchKnowledgeEntries(
  entries: KnowledgeEntry[],
  filters: KnowledgeSearchFilters,
) {
  const query = filters.query?.trim().toLowerCase() ?? ''
  const tags = filters.tags ?? []

  return entries.filter((entry) => {
    const categoryMatches = !filters.category || filters.category === 'all' || entry.category === filters.category
    const tagsMatch = tags.every((tag) => hasKnowledgeTag(entry.tags, tag))
    const warningMatches = filters.includeWarnings || entry.warnings.length === 0

    if (!categoryMatches || !tagsMatch || !warningMatches) {
      return false
    }

    if (query.length === 0) {
      return true
    }

    const haystack = [
      entry.title,
      entry.category,
      entry.sourceReference,
      entry.summary,
      ...entry.tags,
      ...entry.findings.map((finding) => finding.text),
      ...entry.warnings,
    ].join(' ').toLowerCase()

    return haystack.includes(query)
  })
}

export function getRelatedKnowledgeEntries({
  input,
  result,
  storage,
}: {
  input: PunchingShearInput
  result: PunchingShearResult
  storage?: Storage
}) {
  const entries = listKnowledgeEntries(storage)
  const category = mapCaseTypeToKnowledgeCategory(input.caseType)
  const evidenceIds = result.verificationEvidence.map((evidence) => evidence.id)
  const features = [...result.verifiedFeatures, ...result.draftFeatures].map(String)

  return entries.filter((entry) => {
    if (entry.category === category || entry.category === 'verification') {
      return true
    }

    if (entry.relatedVerificationCases.some((id) => evidenceIds.includes(id))) {
      return true
    }

    return entry.tags.some((tag) => features.includes(tag))
  })
}
