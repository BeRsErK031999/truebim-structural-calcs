import { pointsToSvg } from '../sketch/svg'
import { viewBoxToString } from '../sketch/viewport'
import type { SvgSketchElement } from '../sketch/svg'
import type { StressRegressionSnapshot } from './stressRegressionSnapshot'

export function buildStressRegressionSnapshotHtml(snapshot: StressRegressionSnapshot) {
  const result = snapshot.result

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(snapshot.title)}</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    main { max-width: 1080px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { margin: 0 0 12px; font-size: 30px; }
    h2 { margin: 28px 0 12px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #cbd5e1; padding: 9px 10px; text-align: left; vertical-align: top; }
    th { background: #e2e8f0; }
    .warning { margin: 18px 0; padding: 16px; border: 2px solid #b45309; background: #fffbeb; color: #78350f; font-weight: 700; }
    .svg-wrap { background: #fff; border: 1px solid #cbd5e1; padding: 12px; overflow: auto; }
    svg { max-width: 100%; height: auto; background: #fff; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(snapshot.title)}</h1>
    <div class="warning">Stress regression evidence only. Draft stress formulas remain unchanged.</div>
    <h2>Verification Metadata</h2>
    ${renderTable([
      ['case id', snapshot.caseId],
      ['regression status', snapshot.regressionStatus],
      ['source', snapshot.metadata.source],
      ['checksum', snapshot.metadata.checksum ?? 'disabled'],
      ['drift detected', snapshot.metadata.driftDetected ? 'yes' : 'no'],
      ['eccentricity X', `${snapshot.metadata.eccentricityX ?? 0} mm`],
      ['eccentricity Y', `${snapshot.metadata.eccentricityY ?? 0} mm`],
      ['transfer factor X', String(snapshot.metadata.transferFactorX ?? 'n/a')],
      ['transfer factor Y', String(snapshot.metadata.transferFactorY ?? 'n/a')],
    ])}
    <h2>Expected vs Actual</h2>
    ${renderTable([
      ['current stress points', String(snapshot.currentStressPoints.length)],
      ['expected stress points', String(snapshot.expectedStressPoints.length)],
      ['diff markers', String(snapshot.diffMarkers.length)],
      ['max stress', `${result.maxShearStressMpa ?? 0} MPa`],
      ['min stress', `${result.minShearStressMpa ?? 0} MPa`],
    ])}
    <h2>Warnings</h2>
    <ul>${(snapshot.metadata.warnings.length > 0 ? snapshot.metadata.warnings : ['none'])
      .map((warning) => `<li>${escapeHtml(warning)}</li>`)
      .join('')}</ul>
    <h2>Stress Overlay</h2>
    ${renderSvg(snapshot)}
  </main>
</body>
</html>`
}

function renderSvg(snapshot: StressRegressionSnapshot) {
  const svgModel = snapshot.result.svgModel

  return `<div class="svg-wrap"><svg role="img" viewBox="${escapeHtml(viewBoxToString(svgModel.viewBox))}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${svgModel.viewBox.minX}" y="${svgModel.viewBox.minY}" width="${svgModel.viewBox.width}" height="${svgModel.viewBox.height}" fill="#f8fafc" />
    ${svgModel.elements.map(renderSvgElement).join('\n')}
    ${snapshot.expectedStressPoints.map(renderExpectedPoint).join('\n')}
    ${snapshot.diffMarkers.map(renderDiffMarker).join('\n')}
  </svg></div>`
}

function renderExpectedPoint(point: { id: string; x: number; y: number; stressMpa: number }) {
  return `<circle data-expected-id="${escapeHtml(point.id)}" cx="${point.x}" cy="${point.y}" r="8" fill="none" stroke="#2563eb" stroke-width="3" vector-effect="non-scaling-stroke"><title>expected ${escapeHtml(point.id)}: ${point.stressMpa} MPa</title></circle>`
}

function renderDiffMarker(marker: { id: string; x: number; y: number; deltaStressMpa: number }) {
  return `<path data-diff-id="${escapeHtml(marker.id)}" d="M ${marker.x - 10} ${marker.y - 10} L ${marker.x + 10} ${marker.y + 10} M ${marker.x + 10} ${marker.y - 10} L ${marker.x - 10} ${marker.y + 10}" stroke="#f97316" stroke-width="4" vector-effect="non-scaling-stroke"><title>diff ${escapeHtml(marker.id)}: ${marker.deltaStressMpa.toFixed(6)} MPa</title></path>`
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
    return `<line x1="${element.start.x}" y1="${element.start.y}" x2="${element.end.x}" y2="${element.end.y}" stroke="${stroke}" stroke-width="${element.role === 'stress-segment' ? 7 : 2}" stroke-dasharray="${element.role === 'control-perimeter' || element.role === 'stress-segment' ? '0' : '6 6'}" vector-effect="non-scaling-stroke" />`
  }
  if (element.type === 'circle') {
    return `<circle cx="${element.center.x}" cy="${element.center.y}" r="${element.radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" vector-effect="non-scaling-stroke" />`
  }

  return `<text x="${element.position.x}" y="${element.position.y}" fill="#475569" font-size="18">${escapeHtml(element.text)}</text>`
}

function renderTable(rows: Array<[string, string]>) {
  return `<table><tbody>${rows
    .map(([field, value]) => `<tr><th>${escapeHtml(field)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('')}</tbody></table>`
}

function getStroke(role: SvgSketchElement['role']) {
  return {
    slab: '#cbd5e1',
    'slab-boundary': '#64748b',
    column: '#020617',
    'control-perimeter': '#0f766e',
    'removed-perimeter': '#dc2626',
    opening: '#ef4444',
    'opening-tangent': '#94a3b8',
    label: '#475569',
    dimension: '#64748b',
    'stress-segment': '#dc2626',
    'stress-marker': '#dc2626',
    'moment-arrow': '#7c3aed',
    eccentricity: '#0891b2',
  }[role]
}

function getFill(role: SvgSketchElement['role']) {
  return {
    slab: '#f1f5f9',
    'slab-boundary': 'none',
    column: '#1e293b',
    'control-perimeter': 'none',
    'removed-perimeter': 'none',
    opening: '#ffedd5',
    'opening-tangent': 'none',
    label: 'none',
    dimension: 'none',
    'stress-segment': 'none',
    'stress-marker': '#dc2626',
    'moment-arrow': 'none',
    eccentricity: '#cffafe',
  }[role]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
