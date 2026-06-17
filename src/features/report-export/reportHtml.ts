import {
  pointsToSvg,
  viewBoxToString,
  type PunchingShearInput,
  type PunchingShearReportModel,
  type PunchingShearResult,
  type SvgSketchElement,
} from '@/calculations/punching-shear'
import {
  buildEngineeringReportListing,
  type EngineeringReportLine,
  type EngineeringReportServiceBlock,
  unavailableParameterText,
} from '@/calculations/punching-shear/trace/engineeringReportLines'
import { getAppMetadata } from '@/shared/config/appMetadata'

import {
  createReportMetadata,
  reportApplicabilityItems,
  type ReportMetadata,
} from './reportMetadata'

export function buildPunchingShearHtmlReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
  reportMetadata: ReportMetadata = createReportMetadata(),
) {
  const metadata = getAppMetadata()
  const listing = buildEngineeringReportListing(input, result, report)
  const serviceBlocks: EngineeringReportServiceBlock[] = [
    ...listing.serviceBlocks,
    {
      id: 'metadata',
      title: 'Метаданные',
      rows: [
        { label: 'calculationId', value: reportMetadata.calculationId },
        { label: 'generatedAt', value: reportMetadata.generatedAt },
        { label: 'версия приложения', value: metadata.version },
        { label: 'commit', value: metadata.commit },
        { label: 'время сборки', value: metadata.buildTime },
        { label: 'источник проверки', value: formatVerificationSource(reportMetadata.verificationSource) },
      ],
    },
    {
      id: 'applicability',
      title: 'Применимость',
      items: [
        'Подходит для пилотной проверки, сравнения и сбора доказательств.',
        'Это не финальный проектный документ.',
        ...reportApplicabilityItems.map(cleanServiceText),
      ],
    },
  ]

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TrueBIM: отчет по продавливанию</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    main { max-width: 980px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { margin: 0 0 8px; font-size: 30px; }
    h2 { margin: 34px 0 14px; font-size: 21px; border-bottom: 2px solid #cbd5e1; padding-bottom: 7px; }
    h3 { margin: 22px 0 10px; font-size: 17px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #cbd5e1; padding: 9px 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; width: 30%; }
    details { margin: 12px 0; padding: 12px; border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; }
    summary { cursor: pointer; font-weight: 700; }
    .warning { margin: 16px 0 22px; padding: 14px; border: 1px solid #b45309; background: #fffbeb; color: #78350f; font-weight: 700; }
    .result { padding: 18px; border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; }
    .result p { margin: 7px 0; }
    .calc-lines { margin: 10px 0 22px; font-family: Consolas, monospace; font-size: 14px; line-height: 1.75; white-space: pre-wrap; }
    .muted { color: #64748b; }
    .strong { font-weight: 700; }
    .svg-wrap { background: #fff; border: 1px solid #cbd5e1; padding: 12px; overflow: auto; }
    svg { max-width: 100%; height: auto; background: #fff; }
  </style>
</head>
<body>
  <main>
    <h1>TrueBIM: отчет по продавливанию</h1>
    <div class="warning">ЧЕРНОВОЙ РАСЧЕТ - НЕ ДЛЯ ПРОЕКТНОГО ПРИМЕНЕНИЯ</div>

    <h2>1. Итог проверки</h2>
    <div class="result">
      <p><strong>${escapeHtml(listing.resultSummary.statusText)}</strong></p>
      <p>η = ${escapeHtml(listing.resultSummary.utilizationText)}</p>
      <p>Запас = ${escapeHtml(listing.resultSummary.reservePercentText)}</p>
      <p><strong>${escapeHtml(listing.resultSummary.conditionText)}</strong></p>
    </div>

    <h2>2. Исходные данные</h2>
    ${renderTable(listing.inputRows.map((row) => [row.label, row.value]))}

    <h2>3. Ход расчета</h2>
    ${listing.calculationSections.map((section) => `
      <h3>${escapeHtml(section.title)}</h3>
      ${renderCalculationLines(section.lines)}
    `).join('')}

    <h2>4. Проверка условия</h2>
    ${renderCalculationLines(listing.conditionLines)}

    <h2>5. Заключение</h2>
    ${renderCalculationLines(listing.conclusionLines)}

    ${renderSvg(result)}

    <h2>6. Служебная информация</h2>
    ${serviceBlocks.map(renderServiceBlock).join('')}
  </main>
</body>
</html>`
}

function renderCalculationLines(lines: EngineeringReportLine[]) {
  return `<div class="calc-lines">${lines.map((line) => {
    const className = line.tone === 'muted' ? ' class="muted"' : line.tone === 'strong' ? ' class="strong"' : ''

    return `<div${className}>${escapeHtml(cleanReportText(line.text))}</div>`
  }).join('')}</div>`
}

function renderServiceBlock(block: EngineeringReportServiceBlock) {
  const rows = block.rows ? renderTable(block.rows.map((row) => [row.label, cleanServiceText(row.value)])) : ''
  const items = block.items
    ? `<ul>${block.items.map((item) => `<li>${escapeHtml(cleanServiceText(item))}</li>`).join('')}</ul>`
    : ''

  return `<details><summary>${escapeHtml(block.title)}</summary>${rows}${items}</details>`
}

function renderTable(rows: Array<[string, string]>) {
  return `<table><tbody>${rows
    .map(([field, value]) => `<tr><th>${escapeHtml(field)}</th><td>${escapeHtml(cleanReportText(value))}</td></tr>`)
    .join('')}</tbody></table>`
}

function renderSvg(result: PunchingShearResult) {
  const svgModel = result.svgModel

  if (!svgModel) {
    return ''
  }

  return `<h2>Схема геометрии</h2><div class="svg-wrap"><svg role="img" viewBox="${escapeHtml(viewBoxToString(svgModel.viewBox))}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="dimension-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
      </marker>
    </defs>
    <rect x="${svgModel.viewBox.minX}" y="${svgModel.viewBox.minY}" width="${svgModel.viewBox.width}" height="${svgModel.viewBox.height}" fill="#f8fafc" />
    ${svgModel.elements.map(renderSvgElement).join('\n')}
  </svg></div>`
}

function renderSvgElement(element: SvgSketchElement): string {
  const stroke = getStroke(element.role)
  const fill = getFill(element.role)

  if (element.type === 'polygon') {
    return `<polygon points="${escapeHtml(pointsToSvg(element.points))}" fill="${fill}" stroke="${stroke}" stroke-width="2" vector-effect="non-scaling-stroke" />`
  }

  if (element.type === 'rect') {
    return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="${fill}" stroke="${stroke}" stroke-width="2" vector-effect="non-scaling-stroke" />`
  }

  if (element.type === 'line') {
    const stressColor =
      element.role === 'stress-segment' ? getStressColor(element.stressRatio ?? 0) : stroke
    const label = element.label
      ? `<text x="${(element.start.x + element.end.x) / 2}" y="${(element.start.y + element.end.y) / 2 - 8}" fill="#475569" font-size="18" text-anchor="middle">${escapeHtml(cleanReportText(element.label))}</text>`
      : ''
    const marker =
      element.role === 'dimension' ||
      element.role === 'moment-arrow' ||
      element.role === 'eccentricity'
        ? ' marker-start="url(#dimension-arrow)" marker-end="url(#dimension-arrow)"'
        : ''

    return `<line x1="${element.start.x}" y1="${element.start.y}" x2="${element.end.x}" y2="${element.end.y}" stroke="${stressColor}" stroke-width="2" vector-effect="non-scaling-stroke"${marker} />${label}`
  }

  if (element.type === 'circle') {
    const fillColor =
      element.role === 'stress-marker' ? getStressColor(element.stressRatio ?? 0) : fill

    return `<circle cx="${element.center.x}" cy="${element.center.y}" r="${element.radius}" fill="${fillColor}" stroke="${stroke}" stroke-width="2" vector-effect="non-scaling-stroke" />`
  }

  return `<text x="${element.position.x}" y="${element.position.y}" fill="#475569" font-size="18">${escapeHtml(cleanReportText(element.text))}</text>`
}

function cleanReportText(value: string) {
  return value.replace(/\bn\/a\b/gi, unavailableParameterText())
}

function cleanServiceText(value: string) {
  return cleanReportText(value)
}

function formatVerificationSource(value: string) {
  const labels: Record<string, string> = {
    'NOT VERIFIED': 'НЕ ПРОВЕРЕНО',
    'WebCAD checked': 'проверено в WebCAD',
    'Manual engineer calculation': 'ручной инженерный расчет',
    'Verified Excel': 'проверенный Excel',
    'Normative example': 'нормативный пример',
  }

  return labels[value] ?? value
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getStroke(role: SvgSketchElement['role']) {
  const colors: Record<SvgSketchElement['role'], string> = {
    slab: '#cbd5e1',
    'slab-boundary': '#64748b',
    column: '#020617',
    wall: '#020617',
    'control-perimeter': '#0f766e',
    'control-contour': '#14b8a6',
    'selected-control-contour': '#115e59',
    'removed-perimeter': '#dc2626',
    opening: '#ef4444',
    'opening-tangent': '#94a3b8',
    label: '#475569',
    dimension: '#64748b',
    'stress-segment': '#dc2626',
    'stress-marker': '#dc2626',
    'moment-arrow': '#7c3aed',
    eccentricity: '#0891b2',
    'reinforcement-marker': '#047857',
    'reinforcement-row': '#059669',
  }

  return colors[role]
}

function getFill(role: SvgSketchElement['role']) {
  const colors: Record<SvgSketchElement['role'], string> = {
    slab: '#f1f5f9',
    'slab-boundary': 'none',
    column: '#1e293b',
    wall: '#334155',
    'control-perimeter': 'none',
    'control-contour': 'none',
    'selected-control-contour': 'none',
    'removed-perimeter': 'none',
    opening: '#ffedd5',
    'opening-tangent': 'none',
    label: 'none',
    dimension: 'none',
    'stress-segment': 'none',
    'stress-marker': '#dc2626',
    'moment-arrow': 'none',
    eccentricity: '#cffafe',
    'reinforcement-marker': '#34d399',
    'reinforcement-row': 'none',
  }

  return colors[role]
}

function getStressColor(ratio: number) {
  const normalized = Math.max(0, Math.min(1, ratio))
  const hue = 200 - normalized * 200

  return `hsl(${hue.toFixed(0)} 82% 48%)`
}
