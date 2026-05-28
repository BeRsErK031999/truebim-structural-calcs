import type { ValidationSession } from './validationSessionTypes'

const storageKey = 'truebim-structural-calcs:validation-sessions'

export function listValidationSessions(
  storage: Storage | undefined = globalThis.localStorage,
): ValidationSession[] {
  if (!storage) {
    return []
  }

  try {
    const raw = storage.getItem(storageKey)

    return raw ? (JSON.parse(raw) as ValidationSession[]) : []
  } catch {
    return []
  }
}

export function saveValidationSession(
  session: ValidationSession,
  storage: Storage | undefined = globalThis.localStorage,
) {
  if (!storage) {
    return session
  }

  const sessions = listValidationSessions(storage).filter((item) => item.id !== session.id)

  storage.setItem(storageKey, JSON.stringify([...sessions, session]))

  return session
}

export function getLatestValidationSession(
  storage: Storage | undefined = globalThis.localStorage,
) {
  return listValidationSessions(storage).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
}

export function exportValidationSession(session: ValidationSession) {
  return JSON.stringify(session, null, 2)
}

export function importValidationSession(
  json: string,
  storage: Storage | undefined = globalThis.localStorage,
) {
  const session = JSON.parse(json) as ValidationSession

  return saveValidationSession(session, storage)
}

export function getValidationSessionDiagnostics(
  storage: Storage | undefined = globalThis.localStorage,
) {
  const sessions = listValidationSessions(storage)
  const latest = getLatestValidationSession(storage)

  return {
    validationSessionSupport: 'local-only' as const,
    validationPackageExportSupport: 'manifest' as const,
    checklistProgressSupport: 'yes' as const,
    engineerPackageReady: latest?.exports.packageExported ? 'yes' as const : 'no' as const,
    validationSessionsCount: sessions.length,
  }
}
