import { describe, expect, it } from 'vitest'

import { getAppMetadata } from '../appMetadata'

describe('app metadata', () => {
  it('reads build metadata from Vite env values', () => {
    expect(
      getAppMetadata({
        VITE_APP_VERSION: '1.2.3',
        VITE_GIT_COMMIT: 'abc1234',
        VITE_BUILD_TIME: '2026-05-25T09:00:00.000Z',
        VITE_APP_ENV: 'production',
      }),
    ).toEqual({
      version: '1.2.3',
      commit: 'abc1234',
      buildTime: '2026-05-25T09:00:00.000Z',
      environment: 'production',
    })
  })

  it('falls back when metadata values are absent', () => {
    expect(getAppMetadata({})).toEqual({
      version: '0.0.0',
      commit: 'unknown',
      buildTime: 'unknown',
      environment: 'development',
    })
  })
})
