import { describe, expect, it } from 'vitest'

import { buildDiagnosticsModel, isLocalStorageAvailable } from '../diagnostics'

describe('diagnostics helpers', () => {
  it('builds a client-side diagnostics model', () => {
    const model = buildDiagnosticsModel({
      metadata: {
        version: '1.0.0',
        commit: 'abc1234',
        buildTime: '2026-05-25T09:00:00.000Z',
        environment: 'production',
      },
      localStorageAvailable: true,
      savedCalculationsCount: 3,
      currentCalculationStatus: 'draft_ok',
    })

    expect(model).toMatchObject({
      appLoaded: 'yes',
      version: '1.0.0',
      localStorageAvailable: true,
      savedCalculationsCount: 3,
      currentCalculationStatus: 'draft_ok',
      warning: 'Client-side diagnostics only',
      verification: {
        totalCases: 3,
        draftCases: 3,
        verifiedCases: 0,
        failedCases: 0,
        warning: 'No СП63 verified cases yet',
      },
    })
  })

  it('detects unavailable localStorage', () => {
    expect(isLocalStorageAvailable(undefined)).toBe(false)
  })

  it('detects writable localStorage-like storage', () => {
    const values = new Map<string, string>()
    const storage = {
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

    expect(isLocalStorageAvailable(storage)).toBe(true)
  })
})
