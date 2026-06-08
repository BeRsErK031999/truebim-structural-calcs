import { downloadTextFile } from '@/features/report-export/downloadFile'

import { buildReleaseEvidenceMarkdown } from './releaseEvidenceSummary'
import type { ReleaseEvidence } from './releaseEvidenceTypes'

export type ReleaseEvidenceExportFormat = 'html' | 'md' | 'json'

export function buildReleaseEvidenceFilename(evidence: ReleaseEvidence, format: ReleaseEvidenceExportFormat) {
  const commit = sanitizeFileSegment(evidence.commitHash).slice(0, 12) || 'unknown'
  const date = evidence.generatedAt.slice(0, 10)

  return `release-evidence-${commit}-${date}.${format}`
}

export function serializeReleaseEvidenceJson(evidence: ReleaseEvidence) {
  return JSON.stringify(evidence, null, 2)
}

export function buildReleaseEvidenceHtml(evidence: ReleaseEvidence) {
  const markdown = buildReleaseEvidenceMarkdown(evidence)

  return [
    '<!doctype html>',
    '<html lang="ru">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Релизные материалы ${escapeHtml(evidence.commitHash)}</title>`,
    '<style>body{font-family:Arial,sans-serif;line-height:1.5;margin:32px;color:#0f172a}pre{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px}</style>',
    '</head>',
    '<body>',
    `<h1>Релизные материалы ${escapeHtml(evidence.commitHash)}</h1>`,
    `<pre>${escapeHtml(markdown)}</pre>`,
    '</body>',
    '</html>',
  ].join('\n')
}

export function getReleaseEvidenceExportContent(evidence: ReleaseEvidence, format: ReleaseEvidenceExportFormat) {
  if (format === 'json') {
    return {
      filename: buildReleaseEvidenceFilename(evidence, format),
      content: serializeReleaseEvidenceJson(evidence),
      mimeType: 'application/json',
    }
  }

  if (format === 'html') {
    return {
      filename: buildReleaseEvidenceFilename(evidence, format),
      content: buildReleaseEvidenceHtml(evidence),
      mimeType: 'text/html',
    }
  }

  return {
    filename: buildReleaseEvidenceFilename(evidence, format),
    content: buildReleaseEvidenceMarkdown(evidence),
    mimeType: 'text/markdown',
  }
}

export function downloadReleaseEvidence(evidence: ReleaseEvidence, format: ReleaseEvidenceExportFormat) {
  const exportContent = getReleaseEvidenceExportContent(evidence, format)

  downloadTextFile(exportContent.filename, exportContent.content, exportContent.mimeType)
}

function sanitizeFileSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
