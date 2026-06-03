export const knowledgeTagCatalog = [
  'accepted-review',
  'candidate',
  'evidence',
  'lesson-learned',
  'open-question',
  'release',
  'sp63-note',
  'trusted-source',
  'unresolved-mismatch',
  'verified-finding',
  'verification-case',
] as const

export type KnowledgeTag = string

export function normalizeKnowledgeTags(tags: KnowledgeTag[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => tag.toLowerCase()),
    ),
  ).sort()
}

export function hasKnowledgeTag(tags: KnowledgeTag[], tag: string) {
  return tags.some((item) => item.toLowerCase() === tag.toLowerCase())
}
