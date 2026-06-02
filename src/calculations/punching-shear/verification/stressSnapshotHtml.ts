import { pointsToSvg } from '../sketch/svg'
import { viewBoxToString } from '../sketch/viewport'
import type { SvgSketchElement } from '../sketch/svg'
import type { StressSnapshot } from './stressSnapshot'

export function buildStressSnapshotHtml(snapshot: StressSnapshot) {
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
    <div class="warning">${escapeHtml(snapshot.metadata.warning)}</div>
    <h2>Verification Metadata</h2>
    ${renderTable([
      ['case id', snapshot.caseId],
      ['status', snapshot.status],
      ['source', snapshot.source],
      ['verified arithmetic available', String(snapshot.metadata.verifiedArithmeticAvailable)],
      ['stress distribution checksum', snapshot.metadata.stressDistributionChecksum],
    ])}
    <h2>Moment Verification</h2>
    ${renderTable([
      ['eccentricity X', `${result.eccentricityX ?? 0} mm`],
      ['eccentricity Y', `${result.eccentricityY ?? 0} mm`],
      ['transfer factor X', String(snapshot.metadata.transferFactorX)],
      ['transfer factor Y', String(snapshot.metadata.transferFactorY)],
      ['max stress', `${result.maxShearStressMpa ?? 0} MPa`],
      ['min stress', `${result.minShearStressMpa ?? 0} MPa`],
      ['stress point count', String(snapshot.metadata.stressPointCount)],
      ['stress distribution metadata', JSON.stringify(result.stressDiagramMetadata ?? {})],
    ])}
    <h2>Diff Summary</h2>
    <ul>${snapshot.stressComparison.diffSummary.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    <h2>SVG Stress Overlay</h2>
    ${renderSvg(snapshot)}
  </main>
</body>
</html>`
}

function renderSvg(snapshot: StressSnapshot) {
  const svgModel = snapshot.result.svgModel

  return `<div class="svg-wrap"><svg role="img" viewBox="${escapeHtml(viewBoxToString(svgModel.viewBox))}" xmlns="http://www.w3.org/2000/svg">
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
    const width = element.role === 'stress-segment' ? 7 : 2
    const dashArray = element.role === 'moment-arrow' || element.role === 'eccentricity' ? '8 6' : '0'
    const label = element.label
      ? `<text x="${(element.start.x + element.end.x) / 2}" y="${(element.start.y + element.end.y) / 2 - 8}" fill="#475569" font-size="18" text-anchor="middle">${escapeHtml(element.label)}</text>`
      : ''

    return `<line x1="${element.start.x}" y1="${element.start.y}" x2="${element.end.x}" y2="${element.end.y}" stroke="${stroke}" stroke-width="${width}" stroke-dasharray="${dashArray}" vector-effect="non-scaling-stroke" />${label}`
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
  }[role]
}

function getFill(role: SvgSketchElement['role']) {
  return {
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
