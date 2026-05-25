export type AppMetadata = {
  version: string
  commit: string
  buildTime: string
  environment: string
}

type MetadataEnv = {
  VITE_APP_VERSION?: string
  VITE_GIT_COMMIT?: string
  VITE_BUILD_TIME?: string
  VITE_APP_ENV?: string
  MODE?: string
}

export function getAppMetadata(env: MetadataEnv = import.meta.env): AppMetadata {
  return {
    version: normalizeMetadataValue(env.VITE_APP_VERSION, '0.0.0'),
    commit: normalizeMetadataValue(env.VITE_GIT_COMMIT, 'unknown'),
    buildTime: normalizeMetadataValue(env.VITE_BUILD_TIME, 'unknown'),
    environment: normalizeMetadataValue(env.VITE_APP_ENV ?? env.MODE, 'development'),
  }
}

function normalizeMetadataValue(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback
}
