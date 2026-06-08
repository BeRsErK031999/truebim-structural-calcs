import { getAppMetadata } from '@/shared/config/appMetadata'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'
import { formatTraceSourceLabel } from '@/calculations/punching-shear/trace/traceLabels'
import { getRelatedKnowledgeEntries } from '@/features/knowledge-base'
import { formatFeatureLabel } from '@/shared/labels/featureLabels'

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

const helpRows: Array<[string, string]> = [
  ['h', 'Полная толщина плиты, мм.'],
  ['h0', 'Рабочая высота сечения, задается напрямую пользователем.'],
  ['Rbt', 'Расчетное сопротивление бетона растяжению.'],
  ['Rsw', 'Расчетное сопротивление поперечной арматуры.'],
  ['Ab', 'Площадь расчетного контура продавливания.'],
  ['Wx', 'Момент сопротивления контура для проверки момента Mx.'],
  ['Wy', 'Момент сопротивления контура для проверки момента My.'],
  ['Fb.ult', 'Предельное усилие по бетону на расчетном контуре.'],
  ['Mx.ult', 'Предельный момент в плоскости оси X.'],
  ['My.ult', 'Предельный момент в плоскости оси Y.'],
  ['Fult', 'Предельное усилие с учетом поперечной арматуры.'],
  ['utilization', 'Коэффициент использования: расчетное воздействие / предельная несущая способность.'],
]

export function buildPunchingShearMarkdownReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
  reportMetadata: ReportMetadata = createReportMetadata(),
) {
  const metadata = getAppMetadata()
  const warnings = createReportWarnings(result)
  const relatedKnowledge = getRelatedKnowledgeEntries({ input, result })

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
    '## Исходные данные',
    '',
    '### Материалы',
    '',
    table([
      ['concrete class', input.concrete.className],
      ['shear reinforcement steel', result.shearReinforcement.steelClass ?? 'n/a'],
    ]),
    '',
    '### Плита',
    '',
    table([
      ['h', formatValueWithUnit(input.slab.thicknessMm, 'mm')],
      ['h0', formatValueWithUnit(input.slab.effectiveDepthMm, 'mm')],
    ]),
    '',
    '### Колонна',
    '',
    table(getColumnRows(input)),
    '',
    ...renderOptionalInputGeometry(input),
    '### Нагрузки',
    '',
    table([
      ['N', formatValueWithUnit(input.forces.axialForceKn, 'kN')],
      ['Mx - moment in X-axis plane', formatValueWithUnit(input.forces.momentXKnM, 'kN*m')],
      ['My - moment in Y-axis plane', formatValueWithUnit(input.forces.momentYKnM, 'kN*m')],
      ['Mx convention', 'direction of the smaller column dimension'],
      ['My convention', 'direction of the larger column dimension'],
    ]),
    '',
    '## Справочные данные',
    '',
    table([
      ['Rbt', formatValueWithUnit(result.sp63Interaction?.Rbt, 'MPa', 3)],
      ['Rsw', formatValueWithUnit(result.sp63Interaction?.Rsw, 'MPa', 3)],
      ['assumptions', reportAssumptions.join('; ')],
    ]),
    '',
    '### Engineering Help',
    '',
    table(helpRows),
    '',
    '## Вычисления',
    '',
    '### Контур продавливания',
    '',
    table([
      ['control perimeter u', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['effective depth h0', formatValueWithUnit(result.effectiveDepthMm, 'mm')],
      ['segment count', String(result.perimeter.segments.length)],
      ['bounding box width', formatValueWithUnit(result.perimeter.boundingBox.width, 'mm')],
      ['bounding box height', formatValueWithUnit(result.perimeter.boundingBox.height, 'mm')],
      ['draft formula', 'v = N / (u * h0)'],
    ]),
    '',
    '### Ab / Ix / Iy / Wx / Wy',
    '',
    renderSp63Geometry(result),
    '',
    '## Предельные усилия по бетону',
    '',
    renderConcreteLimitForces(result),
    '',
    '## Поперечная арматура',
    '',
    renderShearReinforcement(result),
    '',
    '## Проверка без поперечной арматуры',
    '',
    renderConcreteOnlyCheck(result),
    '',
    '## Проверка с поперечной арматурой',
    '',
    renderReinforcedCheck(result),
    '',
    '## Проверка за зоной усиления',
    '',
    renderOuterContourCheck(result),
    '',
    ...renderMultipleContours(result),
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
      ['utilization with reinforcement', formatUtilization(result.utilizationWithReinforcement)],
      ['passed', result.passed === null ? 'not evaluated' : String(result.passed)],
    ]),
    '',
    '## Moment Transfer',
    '',
    table([
      ['status', result.momentTransfer.status],
      ['Mx - moment in X-axis plane', formatValueWithUnit(input.forces.momentXKnM, 'kN*m')],
      ['My - moment in Y-axis plane', formatValueWithUnit(input.forces.momentYKnM, 'kN*m')],
      ['eccentricity X', formatValueWithUnit(result.eccentricityX, 'mm', 3)],
      ['eccentricity Y', formatValueWithUnit(result.eccentricityY, 'mm', 3)],
      ['max stress', formatValueWithUnit(result.maxShearStressMpa, 'MPa', 3)],
      ['min stress', formatValueWithUnit(result.minShearStressMpa, 'MPa', 3)],
      ['redistribution notes', 'DRAFT provisional linear perimeter redistribution; not SP63 verified'],
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
    '## Related Knowledge',
    '',
    relatedKnowledge.length > 0
      ? table([
          ['entry ID', 'title | category | source | tags'],
          ...relatedKnowledge.map((entry) => [
            entry.id,
            `${entry.title} | ${entry.category} | ${entry.sourceReference} | ${entry.tags.join(', ') || 'none'}`,
          ] satisfies [string, string]),
        ])
      : 'No related knowledge entries linked.',
    '',
    '## Trace',
    '',
    '## Calculation Trace',
    '',
    renderCalculationTrace(report),
    '',
    '## Предупреждения',
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
    '## Unsupported in this draft',
    '',
    ...unsupportedDraftFeatures.map((feature) => `- ${feature}`),
    '',
    '## Source Report Notes',
    '',
    ...report.calculationSteps.map((step) => `- ${step}`),
    '',
  ].join('\n')
}

function getColumnRows(input: PunchingShearInput): Array<[string, string]> {
  if (input.caseType === 'round') {
    return [
      ['diameter', formatValueWithUnit(input.roundColumn?.diameterMm, 'mm')],
      ['position', input.roundColumn?.position ?? 'n/a'],
    ]
  }

  return [
    ['Ширина по X (меньший размер)', formatValueWithUnit(input.rectColumn?.widthXMm, 'mm')],
    ['Высота по Y (больший размер)', formatValueWithUnit(input.rectColumn?.widthYMm, 'mm')],
  ]
}

function renderOptionalInputGeometry(input: PunchingShearInput): string[] {
  if (input.caseType === 'wall-end') {
    return [
      '### Wall Geometry',
      '',
      table([
        ['wall length', formatValueWithUnit(input.wall?.wallLength, 'mm')],
        ['wall thickness', formatValueWithUnit(input.wall?.wallThickness, 'mm')],
      ]),
      '',
    ]
  }

  if (input.caseType === 'wall-corner') {
    return [
      '### Wall Corner Geometry',
      '',
      table([
        ['wall length X', formatValueWithUnit(input.wallCorner?.wallLengthX, 'mm')],
        ['wall length Y', formatValueWithUnit(input.wallCorner?.wallLengthY, 'mm')],
        ['wall thickness X', formatValueWithUnit(input.wallCorner?.wallThicknessX, 'mm')],
        ['wall thickness Y', formatValueWithUnit(input.wallCorner?.wallThicknessY, 'mm')],
        ['orientation', input.wallCorner?.orientation ?? 'n/a'],
      ]),
      '',
    ]
  }

  if (input.caseType === 'opening') {
    return [
      '### Openings',
      '',
      table([
        ['opening count', String(input.openings.length)],
        ['first opening width X', formatValueWithUnit(input.openings[0]?.widthXMm, 'mm')],
        ['first opening width Y', formatValueWithUnit(input.openings[0]?.widthYMm, 'mm')],
        ['first opening center X', formatValueWithUnit(input.openings[0]?.centerXMm, 'mm')],
        ['first opening center Y', formatValueWithUnit(input.openings[0]?.centerYMm, 'mm')],
      ]),
      '',
    ]
  }

  return []
}

function renderSp63Geometry(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return table([
      ['Ab', 'n/a'],
      ['Ix', 'n/a'],
      ['Iy', 'n/a'],
      ['Wx', 'n/a'],
      ['Wy', 'n/a'],
      ['note', 'SP63 interaction benchmark candidate is not available for this input.'],
    ])
  }

  return table([
    ['a', formatValueWithUnit(sp63.a, 'm', 3)],
    ['b', formatValueWithUnit(sp63.b, 'm', 3)],
    ['u', formatValueWithUnit(sp63.u, 'm', 3)],
    ['Ab', formatValueWithUnit(sp63.Ab, 'm2', 3)],
    ['Ix', 'not exported by benchmark model'],
    ['Iy', 'not exported by benchmark model'],
    ['Wx', formatValueWithUnit(sp63.Wx, 'm2', 3)],
    ['Wy', formatValueWithUnit(sp63.Wy, 'm2', 3)],
  ])
}

function renderConcreteLimitForces(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return 'SP63 concrete limit forces are not available for this input.'
  }

  return table([
    ['Fb.ult', formatValueWithUnit(sp63.FbUlt, 'kN', 3)],
    ['Mx.b.ult', formatValueWithUnit(sp63.MxBUlt, 'kN*m', 3)],
    ['My.b.ult', formatValueWithUnit(sp63.MyBUlt, 'kN*m', 3)],
  ])
}

function renderShearReinforcement(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  return table([
    ['enabled', String(result.shearReinforcement.enabled)],
    ['steel class', result.shearReinforcement.steelClass ?? 'n/a'],
    ['layout type', result.shearReinforcement.layoutType ?? 'n/a'],
    ['Asw', formatValueWithUnit(sp63?.Asw ?? result.reinforcementAreaMm2, sp63 ? 'cm2' : 'mm2', 3)],
    ['qsw', formatValueWithUnit(sp63?.qsw, 'kN/m', 3)],
    ['Fsw.ult', formatValueWithUnit(sp63?.FswUlt, 'kN', 3)],
    ['Fult', formatValueWithUnit(sp63?.Fult, 'kN', 3)],
    ['warnings', result.reinforcementWarnings.join('; ') || 'none'],
  ])
}

function renderConcreteOnlyCheck(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  return table([
    ['interaction', formatUtilization(sp63?.utilizationConcreteOnly)],
    ['force cap', formatUtilization(sp63?.forceCapConcreteOnly)],
    ['result', sp63 ? formatPassFail(sp63.utilizationConcreteOnly <= 1) : 'n/a'],
  ])
}

function renderReinforcedCheck(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  return table([
    ['interaction', formatUtilization(sp63?.utilizationWithReinforcement)],
    ['result', sp63?.utilizationWithReinforcement === null || sp63?.utilizationWithReinforcement === undefined ? 'n/a' : formatPassFail(sp63.utilizationWithReinforcement <= 1)],
  ])
}

function renderOuterContourCheck(result: PunchingShearResult) {
  const outerContour = result.sp63Interaction?.outerContour

  if (!outerContour) {
    return 'Outer contour check is not available for this input.'
  }

  return table([
    ['outer contour asw', formatValueWithUnit(outerContour.asw, 'm', 3)],
    ["u'", formatValueWithUnit(outerContour.uPrime, 'm', 3)],
    ["F'", formatValueWithUnit(outerContour.FPrime, 'kN', 3)],
    ['outer contour utilization', formatUtilization(outerContour.utilization)],
    ['result', formatPassFail(outerContour.utilization <= 1)],
  ])
}

function renderMultipleContours(result: PunchingShearResult): string[] {
  if (result.contourComparison.length === 0) {
    return []
  }

  return [
    '## Multiple Control Perimeters',
    '',
    'Multiple contour selection is draft-only and requires SP63 verification.',
    '',
    table([
      ['contour id', 'offset | perimeter | draft stress | utilization | selected | warnings'],
      ...result.contourComparison.map((contour) => [
        contour.contourId,
        `${formatValueWithUnit(contour.offsetMm, 'mm')} | ${formatValueWithUnit(contour.perimeterMm, 'mm')} | ${formatValueWithUnit(contour.draftStressMpa, 'MPa', 3)} | ${formatUtilization(contour.utilization)} | ${contour.selected ? 'yes' : 'no'} | ${contour.warnings.join('; ') || 'none'}`,
      ] satisfies [string, string]),
    ]),
    '',
  ]
}

function formatFeatureList(features: string[]) {
  return features.length > 0 ? features.map((feature) => `- ${formatFeatureLabel(feature)}`) : ['- none']
}

function renderCalculationTrace(report: PunchingShearReportModel) {
  const steps = report.calculationTrace.flatMap((section) =>
    section.steps.map((step) => ({ section, step })),
  )

  if (steps.length === 0) {
    return 'No calculation trace available.'
  }

  return table([
    ['section / step', 'formula | substitution | result | verification source'],
    ...steps.map(({ section, step }) => [
      `${section.title} / ${step.title}`,
      `${step.formula} | ${step.substitutedFormula} | ${step.result} ${step.units} | ${formatTraceSourceLabel(step.sourceType)} - ${step.sourceReference}${step.warnings.length > 0 ? ` | warnings: ${step.warnings.join('; ')}` : ''}`,
    ] satisfies [string, string]),
  ])
}

function formatInlineFeatures(features: string[]) {
  return features.length > 0 ? features.map(formatFeatureLabel).join(', ') : 'none'
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
    'Round column perimeter is draft-only and requires SP63 verification.',
    'Wall-end punching support is draft geometry only.',
    'Wall-corner punching support is draft geometry only.',
    'Multiple contour selection is draft-only and requires SP63 verification.',
    'Shear reinforcement contribution is draft-only when enabled',
    'Verify against SP63 before design use',
  ])
}

function formatPassFail(value: boolean) {
  return value ? 'pass' : 'fail'
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
