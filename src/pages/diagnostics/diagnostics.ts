import type { PunchingShearCheckStatus } from '@/calculations/punching-shear'
import type { AppMetadata } from '@/shared/config/appMetadata'

export type DiagnosticsModel = {
  appLoaded: 'yes'
  version: string
  commit: string
  buildTime: string
  environment: string
  localStorageAvailable: boolean
  savedCalculationsCount: number
  currentCalculationStatus: PunchingShearCheckStatus | 'none'
  warning: string
}

export function isLocalStorageAvailable(storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) {
    return false
  }

  const testKey = 'truebim-structural-calcs:diagnostics-test'

  try {
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function buildDiagnosticsModel({
  metadata,
  localStorageAvailable,
  savedCalculationsCount,
  currentCalculationStatus,
}: {
  metadata: AppMetadata
  localStorageAvailable: boolean
  savedCalculationsCount: number
  currentCalculationStatus?: PunchingShearCheckStatus
}): DiagnosticsModel {
  return {
    appLoaded: 'yes',
    version: metadata.version,
    commit: metadata.commit,
    buildTime: metadata.buildTime,
    environment: metadata.environment,
    localStorageAvailable,
    savedCalculationsCount,
    currentCalculationStatus: currentCalculationStatus ?? 'none',
    warning: 'Client-side diagnostics only',
  }
}
