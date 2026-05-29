import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('generate-release-evidence CLI', () => {
  it('produces JSON and Markdown files', () => {
    const outputDir = mkdtempSync(path.join(tmpdir(), 'release-evidence-'))

    try {
      execFileSync('node', ['scripts/generate-release-evidence.mjs'], {
        cwd: rootDir,
        env: {
          ...process.env,
          RELEASE_EVIDENCE_OUTPUT_DIR: outputDir,
          RELEASE_EVIDENCE_SKIP_URL_CHECK: '1',
          RELEASE_EVIDENCE_DATE: '2026-05-29T02:00:00.000Z',
        },
        stdio: 'pipe',
      })

      const commit = getCommit()
      const json = readFileSync(path.join(outputDir, `release-evidence-${commit}-2026-05-29.json`), 'utf-8')
      const markdown = readFileSync(path.join(outputDir, `release-evidence-${commit}-2026-05-29.md`), 'utf-8')

      expect(JSON.parse(json)).toMatchObject({
        appVersion: '0.0.0',
        generatedAt: '2026-05-29T02:00:00.000Z',
      })
      expect(markdown).toContain('# Release Evidence')
    } finally {
      rmSync(outputDir, { force: true, recursive: true })
    }
  })

  it('does not crash when the server is unavailable', () => {
    const outputDir = mkdtempSync(path.join(tmpdir(), 'release-evidence-unavailable-'))

    try {
      execFileSync('node', ['scripts/generate-release-evidence.mjs'], {
        cwd: rootDir,
        env: {
          ...process.env,
          RELEASE_EVIDENCE_OUTPUT_DIR: outputDir,
          RELEASE_EVIDENCE_URLS: 'http://127.0.0.1:9',
          RELEASE_EVIDENCE_DATE: '2026-05-29T03:00:00.000Z',
        },
        stdio: 'pipe',
      })

      const json = JSON.parse(
        readFileSync(path.join(outputDir, `release-evidence-${getCommit()}-2026-05-29.json`), 'utf-8'),
      )

      expect(json.officeUrlsStatus[0]).toMatchObject({
        status: 'warning',
        url: 'http://127.0.0.1:9',
      })
    } finally {
      rmSync(outputDir, { force: true, recursive: true })
    }
  })
})

function getCommit() {
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}
