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
    '- draft / not verified',
    '- This report can be used to create a verified case only after checking with manual calculation, WebCAD, Excel, or another trusted source.',
    '',
    '## Source Report Notes',
    '',
    ...report.calculationSteps.map((step) => `- ${step}`),
    '',
  ].join('\n')
}

function createReportWarnings(result: PunchingShearResult) {
  return uniqueStrings([
    'DRAFT CALCULATION - NOT FOR DESIGN USE',
    ...result.warnings,
    'Moments are ignored in this draft',
    'Openings are unsupported in this draft',
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
