import { getAppMetadata } from '@/shared/config/appMetadata'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'

export function buildPunchingShearMarkdownReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
) {
  const metadata = getAppMetadata()
  const generatedAt = new Date().toISOString()
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
      ['generatedAt', generatedAt],
      ['app version', metadata.version],
      ['commit', metadata.commit],
      ['build time', metadata.buildTime],
      ['calculation type', 'punching-shear'],
      ['status', result.status],
    ]),
    '',
    '## Input Data',
    '',
    table([
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
    ]),
    '',
    '## Geometry',
    '',
    table([
      ['control perimeter, mm', formatNullable(result.controlPerimeterMm)],
      ['effective depth, mm', formatNullable(result.effectiveDepthMm)],
      ['segment count', String(result.perimeter.segments.length)],
      ['bounding box minX, mm', formatNumber(result.perimeter.boundingBox.minX)],
      ['bounding box minY, mm', formatNumber(result.perimeter.boundingBox.minY)],
      ['bounding box width, mm', formatNumber(result.perimeter.boundingBox.width)],
      ['bounding box height, mm', formatNumber(result.perimeter.boundingBox.height)],
    ]),
    '',
    '### Segments',
    '',
    result.perimeter.segments.length > 0
      ? table([
          ['id', 'kind | start | end | length, mm'],
          ...result.perimeter.segments.map((segment) => [
            segment.id,
            `${segment.kind} | (${formatNumber(segment.start.x)}, ${formatNumber(segment.start.y)}) | (${formatNumber(segment.end.x)}, ${formatNumber(segment.end.y)}) | ${formatNumber(segment.lengthMm)}`,
          ] satisfies [string, string]),
        ])
      : 'No segments available.',
    '',
    '## Calculation Summary',
    '',
    table([
      ['formula', 'v = N / (u * h0)'],
      ['N, N', formatNullable(result.designShearForceN)],
      ['u, mm', formatNullable(result.controlPerimeterMm)],
      ['h0, mm', formatNullable(result.effectiveDepthMm)],
      ['v, MPa', formatNullable(result.shearStressMpa)],
      ['draft resistance, MPa', formatNullable(result.draftConcreteResistanceMpa)],
      ['utilization ratio', formatNullable(result.utilizationRatio)],
      ['passed', result.passed === null ? 'not evaluated' : String(result.passed)],
    ]),
    '',
    '## Warnings',
    '',
    ...warnings.map((warning) => `- ${warning}`),
    '',
    '## Verification Status',
    '',
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

function formatNullable(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'not evaluated'
    : formatNumber(value)
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3)
}

function escapeMarkdownCell(value: string) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}
