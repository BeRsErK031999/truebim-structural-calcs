import {
  pointsToSvg,
  viewBoxToString,
  type PunchingShearInput,
  type PunchingShearReportModel,
  type PunchingShearResult,
  type SvgSketchElement,
} from '@/calculations/punching-shear'
import { getAppMetadata } from '@/shared/config/appMetadata'

export function buildPunchingShearHtmlReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
) {
  const metadata = getAppMetadata()
  const generatedAt = new Date().toISOString()
  const warnings = createReportWarnings(result)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TrueBIM Structural Calculations - Punching Shear Report</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    main { max-width: 1040px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { margin: 0 0 12px; font-size: 30px; }
    h2 { margin: 28px 0 12px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #cbd5e1; padding: 9px 10px; text-align: left; vertical-align: top; }
    th { background: #e2e8f0; }
    .warning { margin: 18px 0; padding: 18px; border: 2px solid #b45309; background: #fffbeb; color: #78350f; font-size: 20px; font-weight: 700; }
    .note { color: #475569; line-height: 1.55; }
    .svg-wrap { background: #fff; border: 1px solid #cbd5e1; padding: 12px; overflow: auto; }
    svg { max-width: 100%; height: auto; background: #fff; }
    code { background: #e2e8f0; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    <h1>TrueBIM Structural Calculations - Punching Shear Report</h1>
    <div class="warning">DRAFT CALCULATION - NOT FOR DESIGN USE</div>
    <p class="note">This report is a draft calculation export. Verify against SP63 before any design use.</p>

    <h2>Metadata</h2>
    ${renderTable([
      ['generatedAt', generatedAt],
      ['app version', metadata.version],
      ['commit', metadata.commit],
      ['build time', metadata.buildTime],
      ['calculation type', 'punching-shear'],
      ['status', result.status],
    ])}

    <h2>Input Data</h2>
    ${renderTable([
      ['case type', input.caseType],
      ['N, kN', formatNumber(input.forces.axialForceKn)],
      ['Mx, kN*m', formatNumber(input.forces.momentXKnM)],
      ['My, kN*m', formatNumber(input.forces.momentYKnM)],
      ['slab thickness, mm', formatNumber(input.slab.thicknessMm)],
      ['effective depth, mm', formatNumber(input.slab.effectiveDepthMm)],
      ['concrete cover, mm', formatNumber(input.slab.concreteCoverMm)],
      ['column width, mm', formatNullable(input.rectColumn?.widthXMm ?? input.roundColumn?.diameterMm)],
      ['column height, mm', formatNullable(input.rectColumn?.widthYMm ?? input.roundColumn?.diameterMm)],
      ['concrete class', input.concrete.className],
      ['shear reinforcement enabled', String(input.shearReinforcement.enabled)],
    ])}

    <h2>Geometry</h2>
    ${renderTable([
      ['control perimeter, mm', formatNullable(result.controlPerimeterMm)],
      ['effective depth, mm', formatNullable(result.effectiveDepthMm)],
      ['segment count', String(result.perimeter.segments.length)],
      ['bounding box minX, mm', formatNumber(result.perimeter.boundingBox.minX)],
      ['bounding box minY, mm', formatNumber(result.perimeter.boundingBox.minY)],
      ['bounding box width, mm', formatNumber(result.perimeter.boundingBox.width)],
      ['bounding box height, mm', formatNumber(result.perimeter.boundingBox.height)],
    ])}
    ${renderSegments(result)}
    ${renderSvg(result)}

    <h2>Calculation Summary</h2>
    ${renderTable([
      ['formula', 'v = N / (u * h0)'],
      ['N, N', formatNullable(result.designShearForceN)],
      ['u, mm', formatNullable(result.controlPerimeterMm)],
      ['h0, mm', formatNullable(result.effectiveDepthMm)],
      ['v, MPa', formatNullable(result.shearStressMpa)],
      ['draft resistance, MPa', formatNullable(result.draftConcreteResistanceMpa)],
      ['utilization ratio', formatNullable(result.utilizationRatio)],
      ['passed', result.passed === null ? 'not evaluated' : String(result.passed)],
    ])}

    <h2>Warnings</h2>
    <ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>

    <h2>Verification Status</h2>
    <p class="note">draft / not verified</p>
    <p class="note">This report can be used to create a verified case only after checking with manual calculation, WebCAD, Excel, or another trusted source.</p>

    <h2>Source Report Notes</h2>
    <ul>${report.calculationSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
  </main>
</body>
</html>`
}

function renderSegments(result: PunchingShearResult) {
  if (result.perimeter.segments.length === 0) {
    return '<p class="note">No segments available.</p>'
  }

  return `<h2>Segments</h2>${renderTable([
    ['id', 'kind | start | end | length, mm'],
    ...result.perimeter.segments.map((segment) => [
      segment.id,
      `${segment.kind} | (${formatNumber(segment.start.x)}, ${formatNumber(segment.start.y)}) | (${formatNumber(segment.end.x)}, ${formatNumber(segment.end.y)}) | ${formatNumber(segment.lengthMm)}`,
    ] satisfies [string, string]),
  ])}`
}

function renderSvg(result: PunchingShearResult) {
  const svgModel = result.svgModel

  if (!svgModel) {
    return ''
  }

  return `<h2>SVG Preview</h2><div class="svg-wrap"><svg role="img" viewBox="${escapeHtml(viewBoxToString(svgModel.viewBox))}" xmlns="http://www.w3.org/2000/svg">
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
    const label = element.label
      ? `<text x="${(element.start.x + element.end.x) / 2}" y="${(element.start.y + element.end.y) / 2 - 8}" fill="#475569" font-size="18" text-anchor="middle">${escapeHtml(element.label)}</text>`
      : ''

    return `<line x1="${element.start.x}" y1="${element.start.y}" x2="${element.end.x}" y2="${element.end.y}" stroke="${stroke}" stroke-width="2" stroke-dasharray="6 6" vector-effect="non-scaling-stroke" />${label}`
  }

  return `<text x="${element.position.x}" y="${element.position.y}" fill="#475569" font-size="18">${escapeHtml(element.text)}</text>`
}

function renderTable(rows: Array<[string, string]>) {
  return `<table><tbody>${rows
    .map(([field, value]) => `<tr><th>${escapeHtml(field)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('')}</tbody></table>`
}

function createReportWarnings(result: PunchingShearResult) {
  return Array.from(
    new Set([
      'DRAFT CALCULATION - NOT FOR DESIGN USE',
      ...result.warnings,
      'Moments are ignored in this draft',
      'Openings are unsupported in this draft',
      'Shear reinforcement is unsupported in this draft',
      'Verify against SP63 before design use',
    ]),
  )
}

function formatNullable(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'not evaluated'
    : formatNumber(value)
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3)
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
    column: '#020617',
    'control-perimeter': '#0f766e',
    opening: '#d97706',
    label: '#475569',
    dimension: '#64748b',
  }

  return colors[role]
}

function getFill(role: SvgSketchElement['role']) {
  const colors: Record<SvgSketchElement['role'], string> = {
    slab: '#f1f5f9',
    column: '#1e293b',
    'control-perimeter': '#ccfbf1',
    opening: '#fef3c7',
    label: 'none',
    dimension: 'none',
  }

  return colors[role]
}
