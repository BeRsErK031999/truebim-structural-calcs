import type { AppMetadata } from '@/shared/config/appMetadata'

export const pilotFeedbackStorageKey = 'truebim-structural-calcs:pilot-feedback'

export const pilotIssueCategories = [
  'UI',
  'Geometry',
  'Stress',
  'Verification',
  'Export',
  'Review Workflow',
  'Documentation',
  'Other',
] as const

export type PilotIssueCategory = (typeof pilotIssueCategories)[number]

export type PilotFeedbackInput = {
  engineer: string
  date: string
  calculation: string
  category: PilotIssueCategory
  problem: string
  note: string
  suggestion: string
  calculationId: string
  reviewStatus: string
  verificationLevel: string
}

export type PilotFeedbackEntry = PilotFeedbackInput & {
  id: string
  createdAt: string
}

export type PilotFeedbackExport = {
  appVersion: string
  commit: string
  exportedAt: string
  feedback: Array<
    PilotFeedbackEntry & {
      notes: string
    }
  >
}

export function createEmptyPilotFeedbackInput(now = new Date()): PilotFeedbackInput {
  return {
    engineer: '',
    date: now.toISOString().slice(0, 10),
    calculation: '',
    category: 'UI',
    problem: '',
    note: '',
    suggestion: '',
    calculationId: '',
    reviewStatus: 'pending-review',
    verificationLevel: 'draft',
  }
}

export function listPilotFeedback(storage: Storage | undefined = globalThis.localStorage): PilotFeedbackEntry[] {
  if (!storage) {
    return []
  }

  try {
    const raw = storage.getItem(pilotFeedbackStorageKey)

    return raw ? (JSON.parse(raw) as PilotFeedbackEntry[]) : []
  } catch {
    return []
  }
}

export function savePilotFeedback(
  input: PilotFeedbackInput,
  storage: Storage | undefined = globalThis.localStorage,
  now = new Date(),
) {
  const entry: PilotFeedbackEntry = {
    ...input,
    id: `pilot-feedback-${now.getTime()}`,
    createdAt: now.toISOString(),
  }

  if (!storage) {
    return entry
  }

  storage.setItem(pilotFeedbackStorageKey, JSON.stringify([...listPilotFeedback(storage), entry]))

  return entry
}

export function buildPilotFeedbackExport(
  feedback: PilotFeedbackEntry[],
  metadata: AppMetadata,
  now = new Date(),
): PilotFeedbackExport {
  return {
    appVersion: metadata.version,
    commit: metadata.commit,
    exportedAt: now.toISOString(),
    feedback: feedback.map((entry) => ({
      ...entry,
      notes: [entry.problem, entry.note, entry.suggestion].filter((value) => value.trim().length > 0).join('\n'),
    })),
  }
}

export function buildPilotFeedbackExportJson(
  feedback: PilotFeedbackEntry[],
  metadata: AppMetadata,
  now = new Date(),
) {
  return JSON.stringify(buildPilotFeedbackExport(feedback, metadata, now), null, 2)
}

export function buildPilotFeedbackExportFileName(now = new Date()) {
  return `pilot-feedback-${now.toISOString().slice(0, 10)}.json`
}
