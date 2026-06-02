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
  reportApplicabilityItems,
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
      ['verification level', result.verificationLevel],
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
      ['wall length', formatValueWithUnit(input.wall?.wallLength, 'mm')],
      ['wall thickness', formatValueWithUnit(input.wall?.wallThickness, 'mm')],
      ['wall length X', formatValueWithUnit(input.wallCorner?.wallLengthX, 'mm')],
      ['wall length Y', formatValueWithUnit(input.wallCorner?.wallLengthY, 'mm')],
      ['wall thickness X', formatValueWithUnit(input.wallCorner?.wallThicknessX, 'mm')],
      ['wall thickness Y', formatValueWithUnit(input.wallCorner?.wallThicknessY, 'mm')],
      ['wall corner orientation', input.wallCorner?.orientation ?? 'n/a'],
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
    <h2>Wall Geometry</h2>
    ${renderTable([
      ['enabled', String(input.caseType === 'wall-end')],
      ['wall length', formatValueWithUnit(input.wall?.wallLength, 'mm')],
      ['wall thickness', formatValueWithUnit(input.wall?.wallThickness, 'mm')],
      ['control perimeter', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['geometry warnings', result.perimeter.warnings.join('; ') || 'none'],
    ])}
    <h2>Wall Corner Geometry</h2>
    ${renderTable([
      ['enabled', String(input.caseType === 'wall-corner')],
      ['wall length X', formatValueWithUnit(input.wallCorner?.wallLengthX, 'mm')],
      ['wall length Y', formatValueWithUnit(input.wallCorner?.wallLengthY, 'mm')],
      ['wall thickness X', formatValueWithUnit(input.wallCorner?.wallThicknessX, 'mm')],
      ['wall thickness Y', formatValueWithUnit(input.wallCorner?.wallThicknessY, 'mm')],
      ['orientation', input.wallCorner?.orientation ?? 'n/a'],
      ['control perimeter', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['applicability', 'draft-only'],
      ['geometry warnings', result.perimeter.warnings.join('; ') || 'none'],
    ])}
    <h2>Boundary Effects</h2>
    ${renderTable([
      ['edge affected', String(result.perimeter.edgeAffected)],
      ['corner affected', String(result.perimeter.cornerAffected)],
      ['removed perimeter', formatValueWithUnit(result.perimeter.removedPerimeterMm, 'mm')],
      ['clipped perimeter', formatValueWithUnit(result.perimeter.clippedPerimeterMm, 'mm')],
    ])}
    <h2>Openings</h2>
    ${renderTable([
      ['opening count', String(input.openings.length)],
      ['affected openings', result.perimeter.clippingMetadata.affectedOpeningIds.join(', ') || 'none'],
      ['removed segments', String(result.perimeter.removedSegments.filter((segment) => segment.removedBy === 'opening').length)],
      ['tangent geometry', String(result.perimeter.openingTangents.length)],
    ])}
    <h2>Geometry Verification</h2>
    ${renderTable([
      ['clipped perimeter', formatValueWithUnit(result.perimeter.clippedPerimeterMm, 'mm')],
      ['removed perimeter', formatValueWithUnit(result.perimeter.removedPerimeterMm, 'mm')],
      ['removed segments', String(result.perimeter.removedSegments.length)],
      ['tangent count', String(result.perimeter.openingTangents.length)],
      ['opening affected', String(result.perimeter.openingAffected)],
      ['boundary classification', result.perimeter.clippingMetadata.boundaryCondition],
    ])}
    <h2>Multiple Control Perimeters</h2>
    <p class="draft">Multiple contour selection is draft-only and requires SP63 verification.</p>
    ${renderMultipleControlPerimeters(result)}
    <h2>Verification Readiness</h2>
    ${renderTable([
      ['geometry draft-ready', String(result.perimeter.perimeterMm > 0)],
      ['stress draft-ready', String(result.shearStressMpa !== null || result.stressDistribution !== null)],
      ['verified arithmetic available', String(result.verifiedFeatures.length > 0)],
      ['geometry verified', String(result.verifiedFeatures.includes('center-force-only'))],
      ['stress verified', String(result.verifiedFeatures.includes('center-force-only'))],
      ['moment transfer verified', String(result.verifiedFeatures.includes('center-moment-transfer'))],
    ])}
    <h2>Verification Capabilities</h2>
    <h3>Verified</h3>
    ${renderFeatureList(result.verifiedFeatures)}
    <h3>Draft</h3>
    ${renderFeatureList(result.draftFeatures)}
    <h2>Verification Evidence</h2>
    ${renderEvidence(result)}
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

    <h2>Moment Verification</h2>
    ${renderTable([
      ['eccentricity X', formatValueWithUnit(result.eccentricityX, 'mm', 3)],
      ['eccentricity Y', formatValueWithUnit(result.eccentricityY, 'mm', 3)],
      ['transfer factor X', 'draft metadata only'],
      ['transfer factor Y', 'draft metadata only'],
      ['max stress', formatValueWithUnit(result.maxShearStressMpa, 'MPa', 3)],
      ['min stress', formatValueWithUnit(result.minShearStressMpa, 'MPa', 3)],
      ['stress point count', String(result.stressDistribution?.points.length ?? 0)],
      ['stress distribution metadata', result.stressDiagramMetadata?.method ?? 'disabled'],
    ])}

    <h2>Stress Distribution</h2>
    ${renderTable([
      ['status', result.stressDistribution?.status ?? 'disabled'],
      ['point count', String(result.stressDistribution?.points.length ?? 0)],
      ['segment count', String(result.stressDistribution?.segmentStresses.length ?? 0)],
      ['base stress', formatValueWithUnit(result.stressDistribution?.baseStressMpa ?? result.shearStressMpa, 'MPa', 3)],
      ['method', result.stressDiagramMetadata?.method ?? 'draft-linear-perimeter-redistribution'],
      ['formulas verified', String(result.stressDiagramMetadata?.formulasVerified ?? false)],
    ])}

    <h2>Stress Regression</h2>
    ${renderTable([
      ['checksum', String(report.stressRegressionSummary.checksum)],
      ['drift detected', String(report.stressRegressionSummary.driftDetected)],
      ['expected vs actual', String(report.stressRegressionSummary.expectedVsActual)],
      ['tolerance', String(report.stressRegressionSummary.tolerance)],
      ['regression status', String(report.stressRegressionSummary.regressionStatus)],
    ])}

    <h2>Axis Convention</h2>
    ${renderTable([
      ['X positive direction', String(report.axisConventionSummary.xPositiveDirection)],
      ['Y positive direction', String(report.axisConventionSummary.yPositiveDirection)],
      ['Mx sign convention', String(report.axisConventionSummary.momentXSignConvention)],
      ['My sign convention', String(report.axisConventionSummary.momentYSignConvention)],
    ])}

    <h2>Assumptions</h2>
    <ul>${reportAssumptions.map((assumption) => `<li>${escapeHtml(assumption)}</li>`).join('')}</ul>

    <h2>Unsupported in this draft</h2>
    <ul>${unsupportedDraftFeatures.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>

    <h2>Warnings</h2>
    <ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>

    <h2>Verification Status</h2>
    <p class="note">Verification source: ${escapeHtml(reportMetadata.verificationSource)}</p>
    <p class="note">verification level: ${escapeHtml(result.verificationLevel)}</p>
    <p class="note">verified features: ${escapeHtml(formatInlineFeatures(result.verifiedFeatures))}</p>
    <p class="note">draft features: ${escapeHtml(formatInlineFeatures(result.draftFeatures))}</p>
    <p class="note">This report can be used to create a verified case only after checking with manual calculation, WebCAD, Excel, or another trusted source.</p>

    <h2>Applicability</h2>
    <ul>${reportApplicabilityItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    ${renderTable([
      ['verified features', formatInlineFeatures(result.verifiedFeatures)],
      ['partial features', formatInlineFeatures(getPartialReportFeatures(result))],
      ['draft features', formatInlineFeatures(result.draftFeatures)],
    ])}

    <h2>Source Report Notes</h2>
    <ul>${report.calculationSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
  </main>
</body>
</html>`
}

function renderMultipleControlPerimeters(result: PunchingShearResult) {
  if (result.contourComparison.length === 0) {
    return '<p class="note">Multiple control perimeters disabled.</p>'
  }

  return renderTable([
    ['contour id', 'offset | perimeter | draft stress | utilization | selected | warnings'],
    ...result.contourComparison.map((contour) => [
      contour.contourId,
      `${formatValueWithUnit(contour.offsetMm, 'mm')} | ${formatValueWithUnit(contour.perimeterMm, 'mm')} | ${formatValueWithUnit(contour.draftStressMpa, 'MPa', 3)} | ${formatUtilization(contour.utilization)} | ${contour.selected ? 'yes' : 'no'} | ${contour.warnings.join('; ') || 'none'}`,
    ] satisfies [string, string]),
  ])
}

function renderFeatureList(features: string[]) {
  return `<ul>${(features.length > 0 ? features : ['none'])
    .map((feature) => `<li>${escapeHtml(feature)}</li>`)
    .join('')}</ul>`
}

function renderEvidence(result: PunchingShearResult) {
  if (result.verificationEvidence.length === 0) {
    return '<p class="note">No verified evidence linked.</p>'
  }

  return renderTable([
    ['case ID', 'source | checkedBy | checkedAt | status'],
    ...result.verificationEvidence.map((evidence) => [
      evidence.id,
      `${evidence.verificationSource} | ${evidence.checkedBy ?? 'n/a'} | ${evidence.checkedAt ?? 'n/a'} | ${evidence.status}`,
    ] satisfies [string, string]),
  ])
}

function formatInlineFeatures(features: string[]) {
  return features.length > 0 ? features.join(', ') : 'none'
}

function getPartialReportFeatures(result: PunchingShearResult) {
  return result.verificationLevel === 'partial' ? result.draftFeatures : []
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
    const strokeWidth =
      element.role === 'stress-segment'
        ? 7
        : element.role === 'selected-control-contour'
          ? 5
          : element.role === 'control-contour'
            ? 1.5
            : 2
    const dashArray =
      element.role === 'control-perimeter' ||
      element.role === 'selected-control-contour' ||
      element.role === 'stress-segment'
        ? '0'
        : '6 6'

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
      'Openings and boundary clipping are draft geometry only.',
      'Wall-end punching support is draft geometry only.',
      'Wall-corner punching support is draft geometry only.',
      'Multiple contour selection is draft-only and requires SP63 verification.',
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
  }

  return colors[role]
}

function getStressColor(ratio: number) {
  const normalized = Math.max(0, Math.min(1, ratio))
  const hue = 200 - normalized * 200

  return `hsl(${hue.toFixed(0)} 82% 48%)`
}
