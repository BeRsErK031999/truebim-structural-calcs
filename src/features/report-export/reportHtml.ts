import {
  pointsToSvg,
  viewBoxToString,
  type PunchingShearInput,
  type PunchingShearReportModel,
  type PunchingShearResult,
  type SvgSketchElement,
} from '@/calculations/punching-shear'
import { getAppMetadata } from '@/shared/config/appMetadata'

import {
  formatUtilization,
  formatValueWithUnit,
} from './reportFormatting'
import {
  createReportMetadata,
  reportAssumptions,
  unsupportedDraftFeatures,
  type ReportMetadata,
} from './reportMetadata'

export function buildPunchingShearHtmlReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
  reportMetadata: ReportMetadata = createReportMetadata(),
) {
  const metadata = getAppMetadata()
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
    .draft { color: #b45309; font-weight: 700; }
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
      ['calculationId', reportMetadata.calculationId],
      ['generatedAt', reportMetadata.generatedAt],
      ['app version', metadata.version],
      ['commit', metadata.commit],
      ['build time', metadata.buildTime],
      ['calculation type', 'punching-shear'],
      ['status', result.status],
      ['Verification source', reportMetadata.verificationSource],
    ])}

    <h2>Input Data</h2>
    ${renderTable([
      ['case type', input.caseType],
      ['N', formatValueWithUnit(input.forces.axialForceKn, 'kN')],
      ['Mx', formatValueWithUnit(input.forces.momentXKnM, 'kN*m')],
      ['My', formatValueWithUnit(input.forces.momentYKnM, 'kN*m')],
      ['slab thickness', formatValueWithUnit(input.slab.thicknessMm, 'mm')],
      ['effective depth', formatValueWithUnit(input.slab.effectiveDepthMm, 'mm')],
      ['concrete cover', formatValueWithUnit(input.slab.concreteCoverMm, 'mm')],
      ['column width', formatValueWithUnit(input.rectColumn?.widthXMm ?? input.roundColumn?.diameterMm, 'mm')],
      ['column height', formatValueWithUnit(input.rectColumn?.widthYMm ?? input.roundColumn?.diameterMm, 'mm')],
      ['concrete class', input.concrete.className],
      ['shear reinforcement enabled', String(input.shearReinforcement.enabled)],
    ])}

    <h2>Geometry</h2>
    ${renderTable([
      ['control perimeter', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['effective depth', formatValueWithUnit(result.effectiveDepthMm, 'mm')],
      ['segment count', String(result.perimeter.segments.length)],
      ['bounding box minX', formatValueWithUnit(result.perimeter.boundingBox.minX, 'mm')],
      ['bounding box minY', formatValueWithUnit(result.perimeter.boundingBox.minY, 'mm')],
      ['bounding box width', formatValueWithUnit(result.perimeter.boundingBox.width, 'mm')],
      ['bounding box height', formatValueWithUnit(result.perimeter.boundingBox.height, 'mm')],
    ])}
    ${renderSegments(result)}
    ${renderSvg(result)}

    <h2>Calculation Summary</h2>
    ${renderTable([
      ['formula', 'v = N / (u * h0)'],
      ['N', formatValueWithUnit(result.designShearForceN, 'N')],
      ['u', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['h0', formatValueWithUnit(result.effectiveDepthMm, 'mm')],
      ['v', formatValueWithUnit(result.shearStressMpa, 'MPa', 3)],
      ['draft resistance', formatValueWithUnit(result.draftConcreteResistanceMpa, 'MPa', 3)],
      ['utilization ratio', formatUtilization(result.utilizationRatio)],
      ['passed', result.passed === null ? 'not evaluated' : String(result.passed)],
    ])}

    <h2>Moment Transfer</h2>
    ${renderTable([
      ['status', result.momentTransfer.status],
      ['Mx', formatValueWithUnit(input.forces.momentXKnM, 'kN*m')],
      ['My', formatValueWithUnit(input.forces.momentYKnM, 'kN*m')],
      ['eccentricity X', formatValueWithUnit(result.eccentricityX, 'mm', 3)],
      ['eccentricity Y', formatValueWithUnit(result.eccentricityY, 'mm', 3)],
      ['max stress', formatValueWithUnit(result.maxShearStressMpa, 'MPa', 3)],
      ['min stress', formatValueWithUnit(result.minShearStressMpa, 'MPa', 3)],
      ['redistribution notes', 'DRAFT provisional linear perimeter redistribution; not SP63 verified'],
    ])}
    <p class="draft">Moment transfer draft-only. Verify against SP63. Stress redistribution is not verified.</p>

    <h2>Stress Distribution</h2>
    ${renderTable([
      ['status', result.stressDistribution?.status ?? 'disabled'],
      ['point count', String(result.stressDistribution?.points.length ?? 0)],
      ['segment count', String(result.stressDistribution?.segmentStresses.length ?? 0)],
      ['base stress', formatValueWithUnit(result.stressDistribution?.baseStressMpa ?? result.shearStressMpa, 'MPa', 3)],
      ['method', result.stressDiagramMetadata?.method ?? 'draft-linear-perimeter-redistribution'],
      ['formulas verified', String(result.stressDiagramMetadata?.formulasVerified ?? false)],
    ])}

    <h2>Assumptions</h2>
    <ul>${reportAssumptions.map((assumption) => `<li>${escapeHtml(assumption)}</li>`).join('')}</ul>

    <h2>Unsupported in this draft</h2>
    <ul>${unsupportedDraftFeatures.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>

    <h2>Warnings</h2>
    <ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>

    <h2>Verification Status</h2>
    <p class="note">Verification source: ${escapeHtml(reportMetadata.verificationSource)}</p>
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
    ['id', 'kind | start | end | length'],
    ...result.perimeter.segments.map((segment) => [
      segment.id,
      `${segment.kind} | (${formatValueWithUnit(segment.start.x, 'mm')}, ${formatValueWithUnit(segment.start.y, 'mm')}) | (${formatValueWithUnit(segment.end.x, 'mm')}, ${formatValueWithUnit(segment.end.y, 'mm')}) | ${formatValueWithUnit(segment.lengthMm, 'mm')}`,
    ] satisfies [string, string]),
  ])}`
}

function renderSvg(result: PunchingShearResult) {
  const svgModel = result.svgModel

  if (!svgModel) {
    return ''
  }

  return `<h2>SVG Preview</h2><div class="svg-wrap"><svg role="img" viewBox="${escapeHtml(viewBoxToString(svgModel.viewBox))}" xmlns="http://www.w3.org/2000/svg">
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
      ? `<text x="${(element.start.x + element.end.x) / 2}" y="${(element.start.y + element.end.y) / 2 - 8}" fill="#475569" font-size="18" text-anchor="middle">${escapeHtml(element.label)}</text>`
      : ''

    const marker =
      element.role === 'dimension' ||
      element.role === 'moment-arrow' ||
      element.role === 'eccentricity'
        ? ' marker-start="url(#dimension-arrow)" marker-end="url(#dimension-arrow)"'
        : ''
    const strokeWidth = element.role === 'stress-segment' ? 7 : 2
    const dashArray = element.role === 'stress-segment' ? '0' : '6 6'

    return `<line x1="${element.start.x}" y1="${element.start.y}" x2="${element.end.x}" y2="${element.end.y}" stroke="${stressColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}" vector-effect="non-scaling-stroke"${marker} />${label}`
  }

  if (element.type === 'circle') {
    const fillColor =
      element.role === 'stress-marker' ? getStressColor(element.stressRatio ?? 0) : fill

    return `<circle cx="${element.center.x}" cy="${element.center.y}" r="${element.radius}" fill="${fillColor}" stroke="${stroke}" stroke-width="2" vector-effect="non-scaling-stroke" />`
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
      'Moment transfer is draft-only where Mx/My are provided',
      'Openings are unsupported in this draft',
      'Shear reinforcement is unsupported in this draft',
      'Verify against SP63 before design use',
    ]),
  )
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
    'stress-segment': '#dc2626',
    'stress-marker': '#dc2626',
    'moment-arrow': '#7c3aed',
    eccentricity: '#0891b2',
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
    'stress-segment': 'none',
    'stress-marker': '#dc2626',
    'moment-arrow': 'none',
    eccentricity: '#cffafe',
  }

  return colors[role]
}

function getStressColor(ratio: number) {
  const normalized = Math.max(0, Math.min(1, ratio))
  const hue = 200 - normalized * 200

  return `hsl(${hue.toFixed(0)} 82% 48%)`
}
