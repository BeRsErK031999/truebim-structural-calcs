import type { ReviewSession } from './reviewSession'

const storageKey = 'truebim-structural-calcs:review-sessions'

export function listReviewSessions(storage: Storage | undefined = globalThis.localStorage): ReviewSession[] {
  if (!storage) {
    return []
  }

  try {
    const raw = storage.getItem(storageKey)

    return raw ? (JSON.parse(raw) as ReviewSession[]) : []
  } catch {
    return []
  }
}

export function saveReviewSession(session: ReviewSession, storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) {
    return session
  }

  const sessions = listReviewSessions(storage).filter((item) => item.id !== session.id)
  const updated = [...sessions, session]

  storage.setItem(storageKey, JSON.stringify(updated))

  return session
}

export function importReviewSession(json: string, storage: Storage | undefined = globalThis.localStorage) {
  const session = JSON.parse(json) as ReviewSession

  return saveReviewSession(session, storage)
}

export function exportReviewSession(session: ReviewSession) {
  return JSON.stringify(session, null, 2)
}

export function getReviewDiagnostics(storage: Storage | undefined = globalThis.localStorage) {
  const sessions = listReviewSessions(storage)

  return {
    reviewModeSupport: 'local-only' as const,
    frozenReviewSnapshotsCount: sessions.reduce(
      (count, session) => count + session.frozenSnapshots.length,
      0,
    ),
    pendingReviewsCount: sessions.filter((session) => session.status === 'pending-review').length,
    acceptedReviewsCount: sessions.filter((session) => session.status === 'accepted').length,
    rejectedReviewsCount: sessions.filter((session) => session.status === 'rejected').length,
  }
}
