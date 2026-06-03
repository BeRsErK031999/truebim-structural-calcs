import type { KnowledgeEntry } from './knowledgeEntry'

export type KnowledgeSummary = {
  totalEntries: number
  recentEntries: KnowledgeEntry[]
  verifiedFindings: Array<{ entry: KnowledgeEntry; text: string }>
  openQuestions: Array<{ entry: KnowledgeEntry; text: string }>
  unresolvedMismatches: Array<{ entry: KnowledgeEntry; text: string }>
}

export function buildKnowledgeSummary(entries: KnowledgeEntry[]): KnowledgeSummary {
  const recentEntries = [...entries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  return {
    totalEntries: entries.length,
    recentEntries,
    verifiedFindings: entries.flatMap((entry) =>
      entry.findings
        .filter((finding) => finding.status === 'verified')
        .map((finding) => ({ entry, text: finding.text })),
    ),
    openQuestions: entries.flatMap((entry) =>
      entry.findings
        .filter((finding) => finding.status === 'open-question')
        .map((finding) => ({ entry, text: finding.text })),
    ),
    unresolvedMismatches: entries.flatMap((entry) => [
      ...entry.findings
        .filter((finding) => finding.status === 'unresolved-mismatch')
        .map((finding) => ({ entry, text: finding.text })),
      ...entry.warnings.map((warning) => ({ entry, text: warning })),
    ]),
  }
}
