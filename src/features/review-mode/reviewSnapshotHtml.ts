import type { ReviewSnapshot } from './reviewSnapshot'

export function buildReviewSnapshotHtml(snapshot: ReviewSnapshot) {
  return `<!doctype html>
<html lang="ru">
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
    <p class="note">Выгружено: ${escapeHtml(snapshot.exportedAt)}. Статус проверки: ${escapeHtml(snapshot.session.status)}.</p>
    <div class="warning">Принятая проверка является только ручным доказательством и не повышает статус до VERIFIED автоматически.</div>
    <h2>Метаданные</h2>
    ${renderTable([
      ['уровень проверки', snapshot.result.verificationLevel],
      ['источник доказательств', snapshot.session.evidence.source],
      ['проверил', snapshot.session.evidence.checkedBy || 'н/д'],
      ['дата проверки', snapshot.session.evidence.checkedAt || 'н/д'],
      ['заметки по осям', snapshot.session.evidence.axisConventionNotes || 'н/д'],
    ])}
    <h2>Сравнение рядом</h2>
    <table>
      <thead><tr><th>Раздел</th><th>Поле</th><th>Результат приложения</th><th>Доверенное значение</th><th>Отклонение</th><th>Статус</th></tr></thead>
      <tbody>
        ${snapshot.comparison.items.map(renderDiffRow).join('')}
      </tbody>
    </table>
    <h2>Заметки проверяющего</h2>
    <p class="note">${escapeHtml(snapshot.session.evidence.notes || 'Заметок нет.')}</p>
    <ul>${snapshot.session.notes.map((note) => `<li>${escapeHtml(note.createdAt)} | ${escapeHtml(note.author)}: ${escapeHtml(note.text)}</li>`).join('')}</ul>
    <h2>Приложения с доказательствами</h2>
    <ul>${snapshot.session.evidence.attachments.map((item) => `<li>${escapeHtml(item.kind)} | ${escapeHtml(item.name)} | ${escapeHtml(item.reference)}</li>`).join('') || '<li>Метаданных приложений нет.</li>'}</ul>
    <h2>Черновые предупреждения</h2>
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
    return 'н/д'
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
