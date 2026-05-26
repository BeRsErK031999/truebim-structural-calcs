import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createServer } from 'vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const momentsDir = path.join(rootDir, 'examples', 'verification', 'moments')

async function loadMomentCases() {
  const filenames = (await readdir(momentsDir))
    .filter((filename) => filename.endsWith('.json'))
    .sort((first, second) => first.localeCompare(second))

  return Promise.all(
    filenames.map(async (filename) => ({
      filename,
      caseData: JSON.parse(await readFile(path.join(momentsDir, filename), 'utf-8')),
    })),
  )
}

function printSummary({ results, summary }) {
  console.log('Stress regression')
  console.log(`total: ${summary.total}`)
  console.log(`passed: ${summary.passed}`)
  console.log(`failed: ${summary.failed}`)
  console.log(`drifted: ${summary.drifted}`)
  console.log(`draft placeholders: ${summary.draftPlaceholders}`)
  console.log('')

  for (const result of results) {
    console.log(
      [
        result.caseId,
        result.regressionStatus,
        `sourceStatus=${result.sourceStatus}`,
        `points=${result.actual.stressPointCount}`,
        `checksum=${result.actual.stressDistributionChecksum}`,
      ].join(' | '),
    )
  }
}

async function run() {
  const server = await createServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })

  try {
    const [{ runStressRegressionCases }, momentCases] = await Promise.all([
      server.ssrLoadModule('/src/calculations/punching-shear/verification/stressRegressionRunner.ts'),
      loadMomentCases(),
    ])
    const { results, summary } = runStressRegressionCases(
      momentCases.map(({ caseData }) => caseData),
    )

    printSummary({ results, summary })

    if (summary.failed > 0 || summary.drifted > 0) {
      process.exitCode = 1
    }
  } finally {
    await server.close()
  }
}

await run()
