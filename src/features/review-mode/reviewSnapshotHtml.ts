import type { ReviewSnapshot } from './reviewSnapshot'

export function buildReviewSnapshotHtml(snapshot: ReviewSnapshot) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(snapshot.title)}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    main { max-width: 1120px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { margin: 0 0 10px; font-size: 30px; }
    h2 { margin: 28px 0 12px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #cbd5e1; padding: 9px 10px; text-align: left; vertical-align: top; }
    th { background: #e2e8f0; }
    .warning { margin: 18px 0; padding: 16px; border: 2px solid #b45309; background: #fffbeb; color: #78350f; font-weight: 700; }
    .match { background: #ecfdf5; }
    .warning-row { background: #fffbeb; }
    .mismatch { background: #fef2f2; }
    .missing { background: #f8fafc; color: #64748b; }
    .note { color: #475569; line-height: 1.55; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(snapshot.title)}</h1>
    <p class="note">Exported at ${escapeHtml(snapshot.exportedAt)}. Review status: ${escapeHtml(snapshot.session.status)}.</p>
    <div class="warning">Accepted review is manual evidence only and does not automatically promote VERIFIED.</div>
    <h2>Metadata</h2>
    ${renderTable([
      ['verification level', snapshot.result.verificationLevel],
      ['evidence source', snapshot.session.evidence.source],
      ['checked by', snapshot.session.evidence.checkedBy || 'n/a'],
      ['checked at', snapshot.session.evidence.checkedAt || 'n/a'],
      ['axis convention notes', snapshot.session.evidence.axisConventionNotes || 'n/a'],
    ])}
    <h2>Side-by-side comparison</h2>
    <table>
      <thead><tr><th>Section</th><th>Field</th><th>App result</th><th>Trusted value</th><th>Delta</th><th>Status</th></tr></thead>
      <tbody>
        ${snapshot.comparison.items.map(renderDiffRow).join('')}
      </tbody>
    </table>
    <h2>Reviewer notes</h2>
    <p class="note">${escapeHtml(snapshot.session.evidence.notes || 'No notes recorded.')}</p>
    <ul>${snapshot.session.notes.map((note) => `<li>${escapeHtml(note.createdAt)} | ${escapeHtml(note.author)}: ${escapeHtml(note.text)}</li>`).join('')}</ul>
    <h2>Evidence attachments</h2>
    <ul>${snapshot.session.evidence.attachments.map((item) => `<li>${escapeHtml(item.kind)} | ${escapeHtml(item.name)} | ${escapeHtml(item.reference)}</li>`).join('') || '<li>No attachment metadata.</li>'}</ul>
    <h2>Draft warnings</h2>
    <ul>${snapshot.result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>
  </main>
</body>
</html>`
}

function renderDiffRow(item: ReviewSnapshot['comparison']['items'][number]) {
  const className = item.severity === 'warning' ? 'warning-row' : item.severity

  return `<tr class="${className}"><td>${escapeHtml(item.section)}</td><td>${escapeHtml(item.label)}</td><td>${escapeHtml(formatValue(item.appValue))}</td><td>${escapeHtml(formatValue(item.expectedValue))}</td><td>${escapeHtml(formatValue(item.delta))}</td><td>${escapeHtml(item.severity)}</td></tr>`
}

function renderTable(rows: Array<[string, string]>) {
  return `<table><tbody>${rows
    .map(([field, value]) => `<tr><th>${escapeHtml(field)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('')}</tbody></table>`
}

function formatValue(value: number | string | null) {
  if (value === null) {
    return 'n/a'
  }

  return typeof value === 'number' ? value.toFixed(6) : value
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
