import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const roots = ['src', 'docs', 'scripts']
const checkedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.html', '.css'])
const ignoredDirectories = new Set(['node_modules', 'dist', '.git'])
const mojibakePatterns = [
  '\u0420\u00a0\u0421\u045f',
  '\u0420\u00a0\u0420\u040b',
  '\u0420\u00a0\u0421\u2018',
  '\u0420\u00a0\u0412\u00b5',
  '\u0413\u0452',
  '\u0413\u2018',
]

const findings = []

for (const root of roots) {
  await scan(root)
}

if (findings.length > 0) {
  console.error('Mojibake signatures found:')
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}: ${finding.pattern}`)
  }
  process.exit(1)
}

console.log('No mojibake signatures found.')

async function scan(filePath) {
  const entries = await readdir(filePath, { withFileTypes: true })

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue
    }

    const nextPath = path.join(filePath, entry.name)

    if (entry.isDirectory()) {
      await scan(nextPath)
      continue
    }

    if (!checkedExtensions.has(path.extname(nextPath))) {
      continue
    }

    const text = await readFile(nextPath, 'utf8')
    const lines = text.split(/\r?\n/)

    lines.forEach((lineText, index) => {
      for (const pattern of mojibakePatterns) {
        if (lineText.includes(pattern)) {
          findings.push({ file: nextPath, line: index + 1, pattern })
        }
      }
    })
  }
}
