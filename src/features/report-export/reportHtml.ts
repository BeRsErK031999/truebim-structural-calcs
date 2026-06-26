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

import { createReportMetadata, type ReportMetadata } from './reportMetadata'

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
  ]

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Расчет на продавливание</title>
  <style>
    @page { size: A4; margin: 18mm 20mm; }
    body { margin: 0; font-family: Georgia, "Times New Roman", serif; color: #111; background: #fff; }
    main { max-width: 190mm; margin: 0 auto; padding: 18mm 12mm 22mm; }
    h1 { margin: 0 0 5mm; font-size: 24pt; font-weight: 700; }
    h2 { margin: 9mm 0 3mm; font-size: 15pt; border-bottom: 1px solid #222; padding-bottom: 1.5mm; }
    h3 { margin: 5mm 0 2mm; font-size: 12.5pt; }
    p { margin: 0 0 3mm; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #777; padding: 2mm 2.5mm; text-align: left; vertical-align: top; }
    th { width: 34%; font-weight: 700; }
    td, th, .formula, .svg-legend, footer { overflow-wrap: anywhere; word-break: normal; }
    details { margin: 3mm 0; padding: 0; border: 0; }
    summary { cursor: pointer; font-weight: 700; }
    .status-line { margin: 0 0 5mm; font-weight: 700; }
    .formula-list { margin: 2mm 0 5mm; display: grid; gap: 2mm; }
    .formula { break-inside: avoid; padding: 1.5mm 0; line-height: 1.45; }
    .muted { color: #555; }
    .strong { font-weight: 700; }
    .svg-wrap { break-inside: avoid; margin: 4mm 0 7mm; overflow: hidden; border: 1px solid #cbd5e1; padding: 3mm; background: #fff; }
    .svg-wrap svg { display: block; width: 100%; max-width: 100%; height: auto; max-height: 155mm; background: #fff; }
    .svg-legend { margin-top: 2mm; padding-top: 2mm; border-top: 1px solid #ddd; font-size: 9pt; line-height: 1.35; color: #333; }
    footer { margin-top: 9mm; padding-top: 3mm; border-top: 1px solid #777; font-size: 9pt; color: #333; }
    .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; padding: 8px 0; background: #fff; }
    .toolbar button { border: 1px solid #555; background: #fff; padding: 7px 12px; font: inherit; cursor: pointer; }
    @media print {
      main { padding: 0; max-width: none; }
      .toolbar, details { display: none; }
      h2, h3, .formula, .svg-wrap, .svg-legend { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main>
    <div class="toolbar"><button type="button" onclick="window.print()">Печать / Сохранить PDF</button></div>
    <h1>Расчет на продавливание</h1>
    <p class="status-line">${escapeHtml(listing.resultSummary.verificationText)}. ${escapeHtml(listing.resultSummary.statusText)}. η = ${escapeHtml(listing.resultSummary.utilizationText)}.</p>

    <h2>1. Допущения и предпосылки</h2>
    <p>${escapeHtml(listing.assumptionsText)}</p>

    <h2>2. Исходные данные</h2>
    <p>${escapeHtml(listing.inputText)}</p>

    <h2>3. Расчет</h2>
    ${renderSvg(result)}
    ${listing.calculationSections.map((section) => `
      <h3>${escapeHtml(section.title)}</h3>
      ${renderCalculationLines(section.lines)}
    `).join('')}

    <h2>4. Проверка условия</h2>
    ${renderCalculationLines(listing.conditionLines)}

    <h2>5. Вывод</h2>
    ${renderCalculationLines(listing.conclusionLines)}

    <footer>
      calculationId: ${escapeHtml(reportMetadata.calculationId)}; версия расчетного движка: ${escapeHtml(metadata.version)}; дата формирования: ${escapeHtml(reportMetadata.generatedAt)}; commit: ${escapeHtml(metadata.commit)}; verificationStatus: ${escapeHtml(result.verificationStatus)}.
    </footer>

    <h2>Техническое приложение</h2>
    ${serviceBlocks.map(renderServiceBlock).join('')}
  </main>
</body>
</html>`
}

function renderCalculationLines(lines: EngineeringReportLine[]) {
  return `<div class="formula-list">${lines.map((line) => {
    const className = line.tone === 'muted' ? ' muted' : line.tone === 'strong' ? ' strong' : ''

    return `<div class="formula${className}">${escapeHtml(cleanReportText(line.text))}</div>`
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

  return `<div class="svg-wrap"><svg role="img" viewBox="${escapeHtml(viewBoxToString(svgModel.viewBox))}" xmlns="http://www.w3.org/2000/svg">
    <title>Расчетная схема продавливания</title>
    <desc>Колонна, контрольный контур, оси и поперечная арматура по расчетной модели.</desc>
    <defs>
      <marker id="dimension-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
      </marker>
    </defs>
    <rect x="${svgModel.viewBox.minX}" y="${svgModel.viewBox.minY}" width="${svgModel.viewBox.width}" height="${svgModel.viewBox.height}" fill="#fff" />
    ${svgModel.elements.map(renderSvgElement).join('\n')}
  </svg><div class="svg-legend">Легенда: темный прямоугольник - колонна; зеленая линия - контрольный контур; зеленые точки - поперечная арматура.</div></div>`
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
    const label = element.label ? renderLineLabel(element) : ''
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

  return `<text x="${element.position.x}" y="${element.position.y}" fill="#333" font-size="18">${escapeHtml(cleanReportText(element.text))}</text>`
}

function renderLineLabel(element: Extract<SvgSketchElement, { type: 'line' }>) {
  const midX = (element.start.x + element.end.x) / 2
  const midY = (element.start.y + element.end.y) / 2
  const dx = element.end.x - element.start.x
  const dy = element.end.y - element.start.y
  const isVerticalDimension = element.role === 'dimension' && Math.abs(dy) > Math.abs(dx)
  const x = isVerticalDimension ? midX + 18 : midX
  const y = isVerticalDimension ? midY : midY - 14
  const label = escapeHtml(cleanReportText(element.label ?? ''))
  const labelWidth = Math.max(30, (element.label?.length ?? 0) * 9.5 + 18)
  const labelHeight = 26
  const transform = isVerticalDimension ? `translate(${x} ${y}) rotate(-90)` : `translate(${x} ${y})`

  return `<g transform="${transform}"><rect x="${-labelWidth / 2}" y="${-labelHeight / 2}" width="${labelWidth}" height="${labelHeight}" rx="3" fill="#fff" fill-opacity="0.9" stroke="#fff" vector-effect="non-scaling-stroke" /><text x="0" y="0" fill="#333" font-size="18" text-anchor="middle" dominant-baseline="middle">${label}</text></g>`
}

function cleanReportText(value: string) {
  return value.replace(/\bn\/a\b/gi, unavailableParameterText())
}

function cleanServiceText(value: string) {
  return cleanReportText(value)
}

function formatVerificationSource(value: string) {
  const labels: Record<string, string> = {
    'NOT VERIFIED': 'не проверено',
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
    slab: '#d4d4d4',
    'slab-boundary': '#666',
    column: '#111',
    wall: '#111',
    'control-perimeter': '#047857',
    'control-contour': '#059669',
    'selected-control-contour': '#065f46',
    'removed-perimeter': '#b91c1c',
    opening: '#b91c1c',
    'opening-tangent': '#777',
    label: '#333',
    dimension: '#555',
    'stress-segment': '#b91c1c',
    'stress-marker': '#b91c1c',
    'moment-arrow': '#6d28d9',
    eccentricity: '#0369a1',
    'reinforcement-marker': '#047857',
    'reinforcement-row': '#059669',
  }

  return colors[role]
}

function getFill(role: SvgSketchElement['role']) {
  const colors: Record<SvgSketchElement['role'], string> = {
    slab: '#fff',
    'slab-boundary': 'none',
    column: '#222',
    wall: '#333',
    'control-perimeter': 'none',
    'control-contour': 'none',
    'selected-control-contour': 'none',
    'removed-perimeter': 'none',
    opening: '#fff',
    'opening-tangent': 'none',
    label: 'none',
    dimension: 'none',
    'stress-segment': 'none',
    'stress-marker': '#b91c1c',
    'moment-arrow': 'none',
    eccentricity: 'none',
    'reinforcement-marker': '#10b981',
    'reinforcement-row': 'none',
  }

  return colors[role]
}

function getStressColor(ratio: number) {
  const normalized = Math.max(0, Math.min(1, ratio))
  const hue = 200 - normalized * 200

  return `hsl(${hue.toFixed(0)} 82% 40%)`
}
