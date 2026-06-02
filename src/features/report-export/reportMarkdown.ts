import { getAppMetadata } from '@/shared/config/appMetadata'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'

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

export function buildPunchingShearMarkdownReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
  reportMetadata: ReportMetadata = createReportMetadata(),
) {
  const metadata = getAppMetadata()
  const warnings = createReportWarnings(result)

  return [
    '# TrueBIM Structural Calculations - Punching Shear Report',
    '',
    '> DRAFT CALCULATION - NOT FOR DESIGN USE',
    '',
    'This report is a draft calculation export. Verify against SP63 before any design use.',
    '',
    '## Metadata',
    '',
    table([
      ['calculationId', reportMetadata.calculationId],
      ['generatedAt', reportMetadata.generatedAt],
      ['app version', metadata.version],
      ['commit', metadata.commit],
      ['build time', metadata.buildTime],
      ['calculation type', 'punching-shear'],
      ['status', result.status],
      ['verification level', result.verificationLevel],
      ['Verification source', reportMetadata.verificationSource],
    ]),
    '',
    '## Input Data',
    '',
    table([
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
    ]),
    '',
    '## Geometry',
    '',
    table([
      ['control perimeter', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['effective depth', formatValueWithUnit(result.effectiveDepthMm, 'mm')],
      ['segment count', String(result.perimeter.segments.length)],
      ['bounding box minX', formatValueWithUnit(result.perimeter.boundingBox.minX, 'mm')],
      ['bounding box minY', formatValueWithUnit(result.perimeter.boundingBox.minY, 'mm')],
      ['bounding box width', formatValueWithUnit(result.perimeter.boundingBox.width, 'mm')],
      ['bounding box height', formatValueWithUnit(result.perimeter.boundingBox.height, 'mm')],
    ]),
    '',
    '## Wall Geometry',
    '',
    table([
      ['enabled', String(input.caseType === 'wall-end')],
      ['wall length', formatValueWithUnit(input.wall?.wallLength, 'mm')],
      ['wall thickness', formatValueWithUnit(input.wall?.wallThickness, 'mm')],
      ['control perimeter', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['geometry warnings', result.perimeter.warnings.join('; ') || 'none'],
    ]),
    '',
    '## Wall Corner Geometry',
    '',
    table([
      ['enabled', String(input.caseType === 'wall-corner')],
      ['wall length X', formatValueWithUnit(input.wallCorner?.wallLengthX, 'mm')],
      ['wall length Y', formatValueWithUnit(input.wallCorner?.wallLengthY, 'mm')],
      ['wall thickness X', formatValueWithUnit(input.wallCorner?.wallThicknessX, 'mm')],
      ['wall thickness Y', formatValueWithUnit(input.wallCorner?.wallThicknessY, 'mm')],
      ['orientation', input.wallCorner?.orientation ?? 'n/a'],
      ['control perimeter', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['applicability', 'draft-only'],
      ['geometry warnings', result.perimeter.warnings.join('; ') || 'none'],
    ]),
    '',
    '## Boundary Effects',
    '',
    table([
      ['edge affected', String(result.perimeter.edgeAffected)],
      ['corner affected', String(result.perimeter.cornerAffected)],
      ['removed perimeter', formatValueWithUnit(result.perimeter.removedPerimeterMm, 'mm')],
      ['clipped perimeter', formatValueWithUnit(result.perimeter.clippedPerimeterMm, 'mm')],
    ]),
    '',
    '## Openings',
    '',
    table([
      ['opening count', String(input.openings.length)],
      ['affected openings', result.perimeter.clippingMetadata.affectedOpeningIds.join(', ') || 'none'],
      ['removed segments', String(result.perimeter.removedSegments.filter((segment) => segment.removedBy === 'opening').length)],
      ['tangent geometry', String(result.perimeter.openingTangents.length)],
    ]),
    '',
    '## Geometry Verification',
    '',
    table([
      ['clipped perimeter', formatValueWithUnit(result.perimeter.clippedPerimeterMm, 'mm')],
      ['removed perimeter', formatValueWithUnit(result.perimeter.removedPerimeterMm, 'mm')],
      ['removed segments', String(result.perimeter.removedSegments.length)],
      ['tangent count', String(result.perimeter.openingTangents.length)],
      ['opening affected', String(result.perimeter.openingAffected)],
      ['boundary classification', result.perimeter.clippingMetadata.boundaryCondition],
    ]),
    '',
    '## Multiple Control Perimeters',
    '',
    'Multiple contour selection is draft-only and requires SP63 verification.',
    '',
    result.contourComparison.length > 0
      ? table([
          ['contour id', 'offset | perimeter | draft stress | utilization | selected | warnings'],
          ...result.contourComparison.map((contour) => [
            contour.contourId,
            `${formatValueWithUnit(contour.offsetMm, 'mm')} | ${formatValueWithUnit(contour.perimeterMm, 'mm')} | ${formatValueWithUnit(contour.draftStressMpa, 'MPa', 3)} | ${formatUtilization(contour.utilization)} | ${contour.selected ? 'yes' : 'no'} | ${contour.warnings.join('; ') || 'none'}`,
          ] satisfies [string, string]),
        ])
      : 'Multiple control perimeters disabled.',
    '',
    '## Verification Readiness',
    '',
    table([
      ['geometry draft-ready', String(result.perimeter.perimeterMm > 0)],
      ['stress draft-ready', String(result.shearStressMpa !== null || result.stressDistribution !== null)],
      ['verified arithmetic available', String(result.verifiedFeatures.length > 0)],
      ['geometry verified', String(result.verifiedFeatures.includes('center-force-only'))],
      ['stress verified', String(result.verifiedFeatures.includes('center-force-only'))],
      ['moment transfer verified', String(result.verifiedFeatures.includes('center-moment-transfer'))],
    ]),
    '',
    '## Verification Capabilities',
    '',
    'Verified:',
    '',
    ...formatFeatureList(result.verifiedFeatures),
    '',
    'Draft:',
    '',
    ...formatFeatureList(result.draftFeatures),
    '',
    '## Verification Evidence',
    '',
    result.verificationEvidence.length > 0
      ? table([
          ['case ID', 'source | checkedBy | checkedAt | status'],
          ...result.verificationEvidence.map((evidence) => [
            evidence.id,
            `${evidence.verificationSource} | ${evidence.checkedBy ?? 'n/a'} | ${evidence.checkedAt ?? 'n/a'} | ${evidence.status}`,
          ] satisfies [string, string]),
        ])
      : 'No verified evidence linked.',
    '',
    '### Segments',
    '',
    result.perimeter.segments.length > 0
      ? table([
          ['id', 'kind | start | end | length'],
          ...result.perimeter.segments.map((segment) => [
            segment.id,
            `${segment.kind} | (${formatValueWithUnit(segment.start.x, 'mm')}, ${formatValueWithUnit(segment.start.y, 'mm')}) | (${formatValueWithUnit(segment.end.x, 'mm')}, ${formatValueWithUnit(segment.end.y, 'mm')}) | ${formatValueWithUnit(segment.lengthMm, 'mm')}`,
          ] satisfies [string, string]),
        ])
      : 'No segments available.',
    '',
    '## Calculation Summary',
    '',
    table([
      ['formula', 'v = N / (u * h0)'],
      ['N', formatValueWithUnit(result.designShearForceN, 'N')],
      ['u', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['h0', formatValueWithUnit(result.effectiveDepthMm, 'mm')],
      ['v', formatValueWithUnit(result.shearStressMpa, 'MPa', 3)],
      ['draft resistance', formatValueWithUnit(result.draftConcreteResistanceMpa, 'MPa', 3)],
      ['utilization ratio', formatUtilization(result.utilizationRatio)],
      ['passed', result.passed === null ? 'not evaluated' : String(result.passed)],
    ]),
    '',
    '## Moment Transfer',
    '',
    table([
      ['status', result.momentTransfer.status],
      ['Mx', formatValueWithUnit(input.forces.momentXKnM, 'kN*m')],
      ['My', formatValueWithUnit(input.forces.momentYKnM, 'kN*m')],
      ['eccentricity X', formatValueWithUnit(result.eccentricityX, 'mm', 3)],
      ['eccentricity Y', formatValueWithUnit(result.eccentricityY, 'mm', 3)],
      ['max stress', formatValueWithUnit(result.maxShearStressMpa, 'MPa', 3)],
      ['min stress', formatValueWithUnit(result.minShearStressMpa, 'MPa', 3)],
      ['redistribution notes', 'DRAFT provisional linear perimeter redistribution; not SP63 verified'],
    ]),
    '',
    '- Moment transfer draft-only',
    '- Verify against SP63',
    '- Stress redistribution is not verified',
    '',
    '## Moment Verification',
    '',
    table([
      ['eccentricity X', formatValueWithUnit(result.eccentricityX, 'mm', 3)],
      ['eccentricity Y', formatValueWithUnit(result.eccentricityY, 'mm', 3)],
      ['transfer factor X', 'draft metadata only'],
      ['transfer factor Y', 'draft metadata only'],
      ['max stress', formatValueWithUnit(result.maxShearStressMpa, 'MPa', 3)],
      ['min stress', formatValueWithUnit(result.minShearStressMpa, 'MPa', 3)],
      ['stress point count', String(result.stressDistribution?.points.length ?? 0)],
      ['stress distribution metadata', result.stressDiagramMetadata?.method ?? 'disabled'],
    ]),
    '',
    '## Stress Distribution',
    '',
    table([
      ['status', result.stressDistribution?.status ?? 'disabled'],
      ['point count', String(result.stressDistribution?.points.length ?? 0)],
      ['segment count', String(result.stressDistribution?.segmentStresses.length ?? 0)],
      ['base stress', formatValueWithUnit(result.stressDistribution?.baseStressMpa ?? result.shearStressMpa, 'MPa', 3)],
      ['method', result.stressDiagramMetadata?.method ?? 'draft-linear-perimeter-redistribution'],
      ['formulas verified', String(result.stressDiagramMetadata?.formulasVerified ?? false)],
    ]),
    '',
    '## Stress Regression',
    '',
    table([
      ['checksum', String(report.stressRegressionSummary.checksum)],
      ['drift detected', String(report.stressRegressionSummary.driftDetected)],
      ['expected vs actual', String(report.stressRegressionSummary.expectedVsActual)],
      ['tolerance', String(report.stressRegressionSummary.tolerance)],
      ['regression status', String(report.stressRegressionSummary.regressionStatus)],
    ]),
    '',
    '## Axis Convention',
    '',
    table([
      ['X positive direction', String(report.axisConventionSummary.xPositiveDirection)],
      ['Y positive direction', String(report.axisConventionSummary.yPositiveDirection)],
      ['Mx sign convention', String(report.axisConventionSummary.momentXSignConvention)],
      ['My sign convention', String(report.axisConventionSummary.momentYSignConvention)],
    ]),
    '',
    '## Assumptions',
    '',
    ...reportAssumptions.map((assumption) => `- ${assumption}`),
    '',
    '## Unsupported in this draft',
    '',
    ...unsupportedDraftFeatures.map((feature) => `- ${feature}`),
    '',
    '## Warnings',
    '',
    ...warnings.map((warning) => `- ${warning}`),
    '',
    '## Verification Status',
    '',
    `- Verification source: ${reportMetadata.verificationSource}`,
    `- verification level: ${result.verificationLevel}`,
    `- verified features: ${formatInlineFeatures(result.verifiedFeatures)}`,
    `- draft features: ${formatInlineFeatures(result.draftFeatures)}`,
    '- This report can be used to create a verified case only after checking with manual calculation, WebCAD, Excel, or another trusted source.',
    '',
    '## Applicability',
    '',
    ...reportApplicabilityItems.map((item) => `- ${item}`),
    `- verified features: ${formatInlineFeatures(result.verifiedFeatures)}`,
    `- partial features: ${formatInlineFeatures(getPartialReportFeatures(result))}`,
    `- draft features: ${formatInlineFeatures(result.draftFeatures)}`,
    '',
    '## Source Report Notes',
    '',
    ...report.calculationSteps.map((step) => `- ${step}`),
    '',
  ].join('\n')
}

function formatFeatureList(features: string[]) {
  return features.length > 0 ? features.map((feature) => `- ${feature}`) : ['- none']
}

function formatInlineFeatures(features: string[]) {
  return features.length > 0 ? features.join(', ') : 'none'
}

function getPartialReportFeatures(result: PunchingShearResult) {
  return result.verificationLevel === 'partial' ? result.draftFeatures : []
}

function createReportWarnings(result: PunchingShearResult) {
  return uniqueStrings([
    'DRAFT CALCULATION - NOT FOR DESIGN USE',
    ...result.warnings,
    'Moment transfer is draft-only where Mx/My are provided',
    'Openings and boundary clipping are draft geometry only.',
    'Wall-end punching support is draft geometry only.',
    'Wall-corner punching support is draft geometry only.',
    'Multiple contour selection is draft-only and requires SP63 verification.',
    'Shear reinforcement is unsupported in this draft',
    'Verify against SP63 before design use',
  ])
}

function table(rows: Array<[string, string]>) {
  return [
    '| Field | Value |',
    '| --- | --- |',
    ...rows.map(([field, value]) => `| ${escapeMarkdownCell(field)} | ${escapeMarkdownCell(value)} |`),
  ].join('\n')
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)))
}

function escapeMarkdownCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}
