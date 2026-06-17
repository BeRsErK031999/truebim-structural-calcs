import { getAppMetadata } from '@/shared/config/appMetadata'
import type {
  PunchingShearInput,
  PunchingShearReportModel,
  PunchingShearResult,
} from '@/calculations/punching-shear'
import {
  flattenTraceSteps,
  formatTraceStepDetails,
  formatTraceStepPath,
} from '@/calculations/punching-shear/trace/tracePresentation'
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
    '# TrueBIM: отчет по продавливанию',
    '',
    '> ЧЕРНОВОЙ РАСЧЕТ - НЕ ДЛЯ ПРОЕКТНОГО ПРИМЕНЕНИЯ',
    '',
    'Этот отчет является черновым экспортом расчета. Проверьте его по СП 63 перед любым проектным применением.',
    '',
    '## Метаданные',
    '',
    table([
      ['calculationId', reportMetadata.calculationId],
      ['generatedAt', reportMetadata.generatedAt],
      ['версия приложения', metadata.version],
      ['commit', metadata.commit],
      ['время сборки', metadata.buildTime],
      ['тип расчета', 'продавливание'],
      ['статус', formatStatus(result.status)],
      ['уровень проверки', formatVerificationLevel(result.verificationLevel)],
      ['источник проверки', formatVerificationSource(reportMetadata.verificationSource)],
    ]),
    '',
    '## Исходные данные',
    '',
    '### Материалы',
    '',
    table([
      ['класс бетона', input.concrete.className],
      ['сталь поперечной арматуры', result.shearReinforcement.steelClass ?? 'н/д'],
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
      ['N', formatValueWithUnit(input.forces.axialForceKn, 'кН')],
      ['Mx - момент в плоскости оси X', formatValueWithUnit(input.forces.momentXKnM, 'кН*м')],
      ['My - момент в плоскости оси Y', formatValueWithUnit(input.forces.momentYKnM, 'кН*м')],
      ['соглашение Mx', 'направление меньшего размера колонны'],
      ['соглашение My', 'направление большего размера колонны'],
    ]),
    '',
    '## Справочные данные',
    '',
    table([
      ['Rbt', formatValueWithUnit(result.sp63Interaction?.Rbt, 'MPa', 3)],
      ['Rsw', formatValueWithUnit(result.sp63Interaction?.Rsw, 'MPa', 3)],
      ['допущения', reportAssumptions.join('; ')],
    ]),
    '',
    '### Инженерная справка',
    '',
    table(helpRows),
    '',
    '## Вычисления',
    '',
    '### Контур продавливания',
    '',
    table([
      ['контрольный периметр u', formatValueWithUnit(result.controlPerimeterMm, 'мм')],
      ['рабочая высота h0', formatValueWithUnit(result.effectiveDepthMm, 'мм')],
      ['количество сегментов', String(result.perimeter.segments.length)],
      ['ширина габарита', formatValueWithUnit(result.perimeter.boundingBox.width, 'мм')],
      ['высота габарита', formatValueWithUnit(result.perimeter.boundingBox.height, 'мм')],
      ['черновая формула', 'v = N / (u * h0)'],
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
    '## Сводка расчета',
    '',
    table([
      ['формула', 'v = N / (u * h0)'],
      ['N', formatValueWithUnit(result.designShearForceN, 'N')],
      ['u', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['h0', formatValueWithUnit(result.effectiveDepthMm, 'mm')],
      ['v', formatValueWithUnit(result.shearStressMpa, 'MPa', 3)],
      ['черновое сопротивление', formatValueWithUnit(result.draftConcreteResistanceMpa, 'МПа', 3)],
      ['коэффициент использования', formatUtilization(result.utilizationRatio)],
      ['использование с арматурой', formatUtilization(result.utilizationWithReinforcement)],
      ['результат', result.passed === null ? 'не оценено' : formatPassFail(result.passed)],
    ]),
    '',
    '## Передача моментов',
    '',
    table([
      ['статус', result.momentTransfer.status],
      ['Mx - момент в плоскости оси X', formatValueWithUnit(input.forces.momentXKnM, 'кН*м')],
      ['My - момент в плоскости оси Y', formatValueWithUnit(input.forces.momentYKnM, 'кН*м')],
      ['эксцентриситет X', formatValueWithUnit(result.eccentricityX, 'мм', 3)],
      ['эксцентриситет Y', formatValueWithUnit(result.eccentricityY, 'мм', 3)],
      ['максимальное напряжение', formatValueWithUnit(result.maxShearStressMpa, 'МПа', 3)],
      ['минимальное напряжение', formatValueWithUnit(result.minShearStressMpa, 'МПа', 3)],
      ['заметки о перераспределении', 'ЧЕРНОВОЕ предварительное линейное перераспределение по периметру; не проверено по СП 63'],
    ]),
    '',
    '## Возможности проверки',
    '',
    'Проверено:',
    '',
    ...formatFeatureList(result.verifiedFeatures),
    '',
    'Черновик:',
    '',
    ...formatFeatureList(result.draftFeatures),
    '',
    '## Доказательства проверки',
    '',
    result.verificationEvidence.length > 0
      ? table([
          ['ID случая', 'источник | проверил | дата проверки | статус'],
          ...result.verificationEvidence.map((evidence) => [
            evidence.id,
            `${evidence.verificationSource} | ${evidence.checkedBy ?? 'н/д'} | ${evidence.checkedAt ?? 'н/д'} | ${evidence.status}`,
          ] satisfies [string, string]),
        ])
      : 'Проверенные доказательства не привязаны.',
    '',
    '## Связанная база знаний',
    '',
    relatedKnowledge.length > 0
      ? table([
          ['ID записи', 'название | категория | источник | теги'],
          ...relatedKnowledge.map((entry) => [
            entry.id,
            `${entry.title} | ${entry.category} | ${entry.sourceReference} | ${entry.tags.join(', ') || 'нет'}`,
          ] satisfies [string, string]),
        ])
      : 'Связанные записи базы знаний не найдены.',
    '',
    '## Трассировка расчета',
    '',
    renderCalculationTrace(report),
    '',
    '## Предупреждения',
    '',
    ...warnings.map((warning) => `- ${warning}`),
    '',
    '## Статус проверки',
    '',
    `- Источник проверки: ${formatVerificationSource(reportMetadata.verificationSource)}`,
    `- Уровень проверки: ${formatVerificationLevel(result.verificationLevel)}`,
    `- Проверенные возможности: ${formatInlineFeatures(result.verifiedFeatures)}`,
    `- Черновые возможности: ${formatInlineFeatures(result.draftFeatures)}`,
    '- Этот отчет можно использовать для создания проверенного случая только после сверки с ручным расчетом, WebCAD, Excel или другим доверенным источником.',
    '',
    '## Применимость',
    '',
    ...reportApplicabilityItems.map((item) => `- ${item}`),
    `- Проверенные возможности: ${formatInlineFeatures(result.verifiedFeatures)}`,
    `- Частичные возможности: ${formatInlineFeatures(getPartialReportFeatures(result))}`,
    `- Черновые возможности: ${formatInlineFeatures(result.draftFeatures)}`,
    '',
    '## Не поддерживается в этом черновике',
    '',
    ...unsupportedDraftFeatures.map((feature) => `- ${feature}`),
    '',
    '## Заметки исходного отчета',
    '',
    ...report.calculationSteps.map((step) => `- ${step}`),
    '',
  ].join('\n')
}

function getColumnRows(input: PunchingShearInput): Array<[string, string]> {
  if (input.caseType === 'round') {
    return [
      ['диаметр', formatValueWithUnit(input.roundColumn?.diameterMm, 'мм')],
      ['положение', formatPosition(input.roundColumn?.position ?? 'n/a')],
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
      '### Геометрия стены',
      '',
      table([
        ['длина стены', formatValueWithUnit(input.wall?.wallLength, 'мм')],
        ['толщина стены', formatValueWithUnit(input.wall?.wallThickness, 'мм')],
      ]),
      '',
    ]
  }

  if (input.caseType === 'wall-corner') {
    return [
      '### Геометрия угла стены',
      '',
      table([
        ['длина стены X', formatValueWithUnit(input.wallCorner?.wallLengthX, 'мм')],
        ['длина стены Y', formatValueWithUnit(input.wallCorner?.wallLengthY, 'мм')],
        ['толщина стены X', formatValueWithUnit(input.wallCorner?.wallThicknessX, 'мм')],
        ['толщина стены Y', formatValueWithUnit(input.wallCorner?.wallThicknessY, 'мм')],
        ['ориентация', formatPosition(input.wallCorner?.orientation ?? 'n/a')],
      ]),
      '',
    ]
  }

  if (input.caseType === 'opening') {
    return [
      '### Отверстия',
      '',
      table([
        ['количество отверстий', String(input.openings.length)],
        ['ширина первого отверстия X', formatValueWithUnit(input.openings[0]?.widthXMm, 'мм')],
        ['ширина первого отверстия Y', formatValueWithUnit(input.openings[0]?.widthYMm, 'мм')],
        ['центр первого отверстия X', formatValueWithUnit(input.openings[0]?.centerXMm, 'мм')],
        ['центр первого отверстия Y', formatValueWithUnit(input.openings[0]?.centerYMm, 'мм')],
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
      ['примечание', 'Кандидат бенчмарка взаимодействия по СП 63 недоступен для этих исходных данных.'],
    ])
  }

  return table([
    ['a', formatValueWithUnit(sp63.a, 'm', 3)],
    ['b', formatValueWithUnit(sp63.b, 'm', 3)],
    ['u', formatValueWithUnit(sp63.u, 'm', 3)],
    ['Ab', formatValueWithUnit(sp63.Ab, 'm2', 3)],
    ['Ix', 'не выгружается моделью бенчмарка'],
    ['Iy', 'не выгружается моделью бенчмарка'],
    ['Wx', formatValueWithUnit(sp63.Wx, 'm2', 3)],
    ['Wy', formatValueWithUnit(sp63.Wy, 'm2', 3)],
  ])
}

function renderConcreteLimitForces(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return 'Предельные усилия по бетону СП 63 недоступны для этих исходных данных.'
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
    ['включено', formatBoolean(result.shearReinforcement.enabled)],
    ['класс стали', result.shearReinforcement.steelClass ?? 'н/д'],
    ['схема армирования', result.shearReinforcement.layoutType ?? 'н/д'],
    ['Asw', formatValueWithUnit(sp63?.Asw ?? result.reinforcementAreaMm2, sp63 ? 'cm2' : 'mm2', 3)],
    ['qsw', formatValueWithUnit(sp63?.qsw, 'kN/m', 3)],
    ['Fsw.ult', formatValueWithUnit(sp63?.FswUlt, 'kN', 3)],
    ['Fult', formatValueWithUnit(sp63?.Fult, 'kN', 3)],
    ['предупреждения', result.reinforcementWarnings.join('; ') || 'нет'],
  ])
}

function renderConcreteOnlyCheck(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  return table([
    ['взаимодействие', formatUtilization(sp63?.utilizationConcreteOnly)],
    ['ограничение усилия', formatUtilization(sp63?.forceCapConcreteOnly)],
    ['результат', sp63 ? formatPassFail(sp63.utilizationConcreteOnly <= 1) : 'н/д'],
  ])
}

function renderReinforcedCheck(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  return table([
    ['взаимодействие', formatUtilization(sp63?.utilizationWithReinforcement)],
    ['результат', sp63?.utilizationWithReinforcement === null || sp63?.utilizationWithReinforcement === undefined ? 'н/д' : formatPassFail(sp63.utilizationWithReinforcement <= 1)],
  ])
}

function renderOuterContourCheck(result: PunchingShearResult) {
  const outerContour = result.sp63Interaction?.outerContour

  if (!outerContour) {
    return 'Проверка внешнего контура недоступна для этих исходных данных.'
  }

  return table([
    ['asw внешнего контура', formatValueWithUnit(outerContour.asw, 'м', 3)],
    ["u'", formatValueWithUnit(outerContour.uPrime, 'm', 3)],
    ["F'", formatValueWithUnit(outerContour.FPrime, 'кН', 3)],
    ['использование внешнего контура', formatUtilization(outerContour.utilization)],
    ['результат', formatPassFail(outerContour.utilization <= 1)],
  ])
}

function renderMultipleContours(result: PunchingShearResult): string[] {
  if (result.contourComparison.length === 0) {
    return []
  }

  return [
    '## Несколько контрольных контуров',
    '',
    'Выбор нескольких контуров является черновым и требует проверки по СП 63.',
    '',
    table([
      ['id контура', 'смещение | периметр | черновое напряжение | использование | выбран | предупреждения'],
      ...result.contourComparison.map((contour) => [
        contour.contourId,
        `${formatValueWithUnit(contour.offsetMm, 'мм')} | ${formatValueWithUnit(contour.perimeterMm, 'мм')} | ${formatValueWithUnit(contour.draftStressMpa, 'МПа', 3)} | ${formatUtilization(contour.utilization)} | ${contour.selected ? 'да' : 'нет'} | ${contour.warnings.join('; ') || 'нет'}`,
      ] satisfies [string, string]),
    ]),
    '',
  ]
}

function formatFeatureList(features: string[]) {
  return features.length > 0 ? features.map((feature) => `- ${formatFeatureLabel(feature)}`) : ['- нет']
}

function renderCalculationTrace(report: PunchingShearReportModel) {
  const steps = flattenTraceSteps(report.calculationTrace)

  if (steps.length === 0) {
    return 'Трассировка расчета недоступна.'
  }

  return table([
    ['раздел / шаг', 'формула | подстановка | результат | источник проверки'],
    ...steps.map((traceStep) => [
      formatTraceStepPath(traceStep),
      formatTraceStepDetails(traceStep.step),
    ] satisfies [string, string]),
  ])
}

function formatInlineFeatures(features: string[]) {
  return features.length > 0 ? features.map(formatFeatureLabel).join(', ') : 'нет'
}

function getPartialReportFeatures(result: PunchingShearResult) {
  return result.verificationLevel === 'partial' ? result.draftFeatures : []
}

function createReportWarnings(result: PunchingShearResult) {
  return uniqueStrings([
    'ЧЕРНОВОЙ РАСЧЕТ - НЕ ДЛЯ ПРОЕКТНОГО ПРИМЕНЕНИЯ',
    ...result.warnings,
    'Передача моментов остается черновой там, где заданы Mx/My',
    'Отверстия и обрезка по границам являются только черновой геометрией.',
    'Периметр круглой колонны является черновым и требует проверки по СП 63.',
    'Поддержка продавливания у конца стены является только черновой геометрией.',
    'Поддержка продавливания в углу стены является только черновой геометрией.',
    'Выбор нескольких контуров является черновым и требует проверки по СП 63.',
    'Вклад поперечной арматуры является черновым при включении',
    'Проверьте по СП 63 перед проектным применением',
  ])
}

function formatPassFail(value: boolean) {
  return value ? 'проходит' : 'не проходит'
}

function formatBoolean(value: boolean) {
  return value ? 'да' : 'нет'
}

function formatPosition(value: string) {
  const labels: Record<string, string> = {
    center: 'центр',
    edge: 'край',
    corner: 'угол',
    'top-left': 'верхний левый',
    'top-right': 'верхний правый',
    'bottom-left': 'нижний левый',
    'bottom-right': 'нижний правый',
    'n/a': 'н/д',
  }

  return labels[value] ?? value
}

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    draft_ok: 'черновик прошел',
    draft_failed: 'черновик не прошел',
    not_implemented: 'не реализовано',
    invalid_input: 'ошибка ввода',
  }

  return labels[value] ?? value
}

function formatVerificationLevel(value: string) {
  const labels: Record<string, string> = {
    verified: 'проверено',
    partial: 'частично',
    draft: 'черновик',
  }

  return labels[value] ?? value
}

function formatVerificationSource(value: string) {
  const labels: Record<string, string> = {
    'NOT VERIFIED': 'НЕ ПРОВЕРЕНО',
    'WebCAD checked': 'проверено в WebCAD',
    'Manual engineer calculation': 'ручной инженерный расчет',
    'Verified Excel': 'проверенный Excel',
    'Normative example': 'нормативный пример',
  }

  return labels[value] ?? value
}

function table(rows: Array<[string, string]>) {
  return [
    '| Поле | Значение |',
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
