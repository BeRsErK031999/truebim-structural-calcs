import {
  pointsToSvg,
  viewBoxToString,
  type PunchingShearInput,
  type PunchingShearReportModel,
  type PunchingShearResult,
  type SvgSketchElement,
} from '@/calculations/punching-shear'
import { formatTraceSourceLabel } from '@/calculations/punching-shear/trace/traceLabels'
import { getRelatedKnowledgeEntries } from '@/features/knowledge-base'
import { formatFeatureLabel } from '@/shared/labels/featureLabels'
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

export function buildPunchingShearHtmlReport(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
  reportMetadata: ReportMetadata = createReportMetadata(),
) {
  const metadata = getAppMetadata()
  const warnings = createReportWarnings(result)
  const relatedKnowledge = getRelatedKnowledgeEntries({ input, result })

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TrueBIM: отчет по продавливанию</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
    main { max-width: 1040px; margin: 0 auto; padding: 32px 20px 48px; }
    h1 { margin: 0 0 12px; font-size: 30px; }
    h2 { margin: 30px 0 12px; font-size: 20px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; }
    h3 { margin: 20px 0 10px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #cbd5e1; padding: 9px 10px; text-align: left; vertical-align: top; }
    th { background: #e2e8f0; width: 32%; }
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
    <h1>TrueBIM: отчет по продавливанию</h1>
    <div class="warning">ЧЕРНОВОЙ РАСЧЕТ - НЕ ДЛЯ ПРОЕКТНОГО ПРИМЕНЕНИЯ</div>
    <p class="note">Этот отчет является черновым экспортом расчета. Проверьте его по СП 63 перед любым проектным применением.</p>

    <h2>Метаданные</h2>
    ${renderTable([
      ['calculationId', reportMetadata.calculationId],
      ['generatedAt', reportMetadata.generatedAt],
      ['версия приложения', metadata.version],
      ['commit', metadata.commit],
      ['время сборки', metadata.buildTime],
      ['тип расчета', 'продавливание'],
      ['статус', formatStatus(result.status)],
      ['уровень проверки', formatVerificationLevel(result.verificationLevel)],
      ['источник проверки', formatVerificationSource(reportMetadata.verificationSource)],
    ])}

    <h2>Исходные данные</h2>
    <h3>Материалы</h3>
    ${renderTable([
      ['класс бетона', input.concrete.className],
      ['сталь поперечной арматуры', result.shearReinforcement.steelClass ?? 'н/д'],
    ])}
    <h3>Плита</h3>
    ${renderTable([
      ['h', formatValueWithUnit(input.slab.thicknessMm, 'mm')],
      ['h0', formatValueWithUnit(input.slab.effectiveDepthMm, 'mm')],
    ])}
    <h3>Колонна</h3>
    ${renderTable(getColumnRows(input))}
    ${renderOptionalInputGeometry(input)}
    <h3>Нагрузки</h3>
    ${renderTable([
      ['N', formatValueWithUnit(input.forces.axialForceKn, 'кН')],
      ['Mx - момент в плоскости оси X', formatValueWithUnit(input.forces.momentXKnM, 'кН*м')],
      ['My - момент в плоскости оси Y', formatValueWithUnit(input.forces.momentYKnM, 'кН*м')],
      ['соглашение Mx', 'направление меньшего размера колонны'],
      ['соглашение My', 'направление большего размера колонны'],
    ])}

    <h2>Справочные данные</h2>
    ${renderTable([
      ['Rbt', formatValueWithUnit(result.sp63Interaction?.Rbt, 'MPa', 3)],
      ['Rsw', formatValueWithUnit(result.sp63Interaction?.Rsw, 'MPa', 3)],
      ['допущения', reportAssumptions.join('; ')],
    ])}
    <h3>Инженерная справка</h3>
    ${renderTable(helpRows)}

    <h2>Вычисления</h2>
    <h3>Контур продавливания</h3>
    ${renderTable([
      ['контрольный периметр u', formatValueWithUnit(result.controlPerimeterMm, 'мм')],
      ['рабочая высота h0', formatValueWithUnit(result.effectiveDepthMm, 'мм')],
      ['количество сегментов', String(result.perimeter.segments.length)],
      ['ширина габарита', formatValueWithUnit(result.perimeter.boundingBox.width, 'мм')],
      ['высота габарита', formatValueWithUnit(result.perimeter.boundingBox.height, 'мм')],
      ['черновая формула', 'v = N / (u * h0)'],
    ])}
    <h3>Ab / Ix / Iy / Wx / Wy</h3>
    ${renderSp63Geometry(result)}

    <h2>Предельные усилия по бетону</h2>
    ${renderConcreteLimitForces(result)}

    <h2>Поперечная арматура</h2>
    ${renderShearReinforcement(result)}

    <h2>Проверка без поперечной арматуры</h2>
    ${renderConcreteOnlyCheck(result)}

    <h2>Проверка с поперечной арматурой</h2>
    ${renderReinforcedCheck(result)}

    <h2>Проверка за зоной усиления</h2>
    ${renderOuterContourCheck(result)}

    ${renderMultipleControlPerimeters(result)}
    ${renderSvg(result)}

    <h2>Сводка расчета</h2>
    ${renderTable([
      ['формула', 'v = N / (u * h0)'],
      ['N', formatValueWithUnit(result.designShearForceN, 'N')],
      ['u', formatValueWithUnit(result.controlPerimeterMm, 'mm')],
      ['h0', formatValueWithUnit(result.effectiveDepthMm, 'mm')],
      ['v', formatValueWithUnit(result.shearStressMpa, 'MPa', 3)],
      ['черновое сопротивление', formatValueWithUnit(result.draftConcreteResistanceMpa, 'МПа', 3)],
      ['коэффициент использования', formatUtilization(result.utilizationRatio)],
      ['использование с арматурой', formatUtilization(result.utilizationWithReinforcement)],
      ['результат', result.passed === null ? 'не оценено' : formatPassFail(result.passed)],
    ])}

    <h2>Передача моментов</h2>
    ${renderTable([
      ['статус', result.momentTransfer.status],
      ['Mx - момент в плоскости оси X', formatValueWithUnit(input.forces.momentXKnM, 'кН*м')],
      ['My - момент в плоскости оси Y', formatValueWithUnit(input.forces.momentYKnM, 'кН*м')],
      ['эксцентриситет X', formatValueWithUnit(result.eccentricityX, 'мм', 3)],
      ['эксцентриситет Y', formatValueWithUnit(result.eccentricityY, 'мм', 3)],
      ['максимальное напряжение', formatValueWithUnit(result.maxShearStressMpa, 'МПа', 3)],
      ['минимальное напряжение', formatValueWithUnit(result.minShearStressMpa, 'МПа', 3)],
      ['заметки о перераспределении', 'ЧЕРНОВОЕ предварительное линейное перераспределение по периметру; не проверено по СП 63'],
    ])}

    <h2>Возможности проверки</h2>
    <h3>Проверено</h3>
    ${renderFeatureList(result.verifiedFeatures)}
    <h3>Черновик</h3>
    ${renderFeatureList(result.draftFeatures)}
    <h2>Доказательства проверки</h2>
    ${renderEvidence(result)}
    <h2>Связанная база знаний</h2>
    ${renderRelatedKnowledge(relatedKnowledge)}

    <h2>Трассировка расчета</h2>
    ${renderCalculationTrace(report)}

    <h2>Предупреждения</h2>
    <ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>

    <h2>Статус проверки</h2>
    <p class="note">Источник проверки: ${escapeHtml(formatVerificationSource(reportMetadata.verificationSource))}</p>
    <p class="note">Уровень проверки: ${escapeHtml(formatVerificationLevel(result.verificationLevel))}</p>
    <p class="note">Проверенные возможности: ${escapeHtml(formatInlineFeatures(result.verifiedFeatures))}</p>
    <p class="note">Черновые возможности: ${escapeHtml(formatInlineFeatures(result.draftFeatures))}</p>
    <p class="note">Этот отчет можно использовать для создания проверенного случая только после сверки с ручным расчетом, WebCAD, Excel или другим доверенным источником.</p>

    <h2>Применимость</h2>
    <ul>${reportApplicabilityItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    ${renderTable([
      ['проверенные возможности', formatInlineFeatures(result.verifiedFeatures)],
      ['частичные возможности', formatInlineFeatures(getPartialReportFeatures(result))],
      ['черновые возможности', formatInlineFeatures(result.draftFeatures)],
    ])}

    <h2>Не поддерживается в этом черновике</h2>
    <ul>${unsupportedDraftFeatures.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>

    <h2>Заметки исходного отчета</h2>
    <ul>${report.calculationSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
  </main>
</body>
</html>`
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

function renderOptionalInputGeometry(input: PunchingShearInput) {
  if (input.caseType === 'wall-end') {
    return `<h3>Геометрия стены</h3>${renderTable([
      ['длина стены', formatValueWithUnit(input.wall?.wallLength, 'мм')],
      ['толщина стены', formatValueWithUnit(input.wall?.wallThickness, 'мм')],
    ])}`
  }

  if (input.caseType === 'wall-corner') {
    return `<h3>Геометрия угла стены</h3>${renderTable([
      ['длина стены X', formatValueWithUnit(input.wallCorner?.wallLengthX, 'мм')],
      ['длина стены Y', formatValueWithUnit(input.wallCorner?.wallLengthY, 'мм')],
      ['толщина стены X', formatValueWithUnit(input.wallCorner?.wallThicknessX, 'мм')],
      ['толщина стены Y', formatValueWithUnit(input.wallCorner?.wallThicknessY, 'мм')],
      ['ориентация', formatPosition(input.wallCorner?.orientation ?? 'n/a')],
    ])}`
  }

  if (input.caseType === 'opening') {
    return `<h3>Отверстия</h3>${renderTable([
      ['количество отверстий', String(input.openings.length)],
      ['ширина первого отверстия X', formatValueWithUnit(input.openings[0]?.widthXMm, 'мм')],
      ['ширина первого отверстия Y', formatValueWithUnit(input.openings[0]?.widthYMm, 'мм')],
      ['центр первого отверстия X', formatValueWithUnit(input.openings[0]?.centerXMm, 'мм')],
      ['центр первого отверстия Y', formatValueWithUnit(input.openings[0]?.centerYMm, 'мм')],
    ])}`
  }

  return ''
}

function renderSp63Geometry(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return renderTable([
      ['Ab', 'n/a'],
      ['Ix', 'n/a'],
      ['Iy', 'n/a'],
      ['Wx', 'n/a'],
      ['Wy', 'n/a'],
      ['примечание', 'Кандидат бенчмарка взаимодействия по СП 63 недоступен для этих исходных данных.'],
    ])
  }

  return renderTable([
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
    return '<p class="note">Предельные усилия по бетону СП 63 недоступны для этих исходных данных.</p>'
  }

  return renderTable([
    ['Fb.ult', formatValueWithUnit(sp63.FbUlt, 'kN', 3)],
    ['Mx.b.ult', formatValueWithUnit(sp63.MxBUlt, 'kN*m', 3)],
    ['My.b.ult', formatValueWithUnit(sp63.MyBUlt, 'kN*m', 3)],
  ])
}

function renderShearReinforcement(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  return renderTable([
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

  return renderTable([
    ['взаимодействие', formatUtilization(sp63?.utilizationConcreteOnly)],
    ['ограничение усилия', formatUtilization(sp63?.forceCapConcreteOnly)],
    ['результат', sp63 ? formatPassFail(sp63.utilizationConcreteOnly <= 1) : 'н/д'],
  ])
}

function renderReinforcedCheck(result: PunchingShearResult) {
  const sp63 = result.sp63Interaction

  return renderTable([
    ['взаимодействие', formatUtilization(sp63?.utilizationWithReinforcement)],
    ['результат', sp63?.utilizationWithReinforcement === null || sp63?.utilizationWithReinforcement === undefined ? 'н/д' : formatPassFail(sp63.utilizationWithReinforcement <= 1)],
  ])
}

function renderOuterContourCheck(result: PunchingShearResult) {
  const outerContour = result.sp63Interaction?.outerContour

  if (!outerContour) {
    return '<p class="note">Проверка внешнего контура недоступна для этих исходных данных.</p>'
  }

  return renderTable([
    ['asw внешнего контура', formatValueWithUnit(outerContour.asw, 'м', 3)],
    ["u'", formatValueWithUnit(outerContour.uPrime, 'm', 3)],
    ["F'", formatValueWithUnit(outerContour.FPrime, 'кН', 3)],
    ['использование внешнего контура', formatUtilization(outerContour.utilization)],
    ['результат', formatPassFail(outerContour.utilization <= 1)],
  ])
}

function renderRelatedKnowledge(entries: ReturnType<typeof getRelatedKnowledgeEntries>) {
  if (entries.length === 0) {
    return '<p class="note">Связанные записи базы знаний не найдены.</p>'
  }

  return renderTable([
    ['ID записи', 'название | категория | источник | теги'],
    ...entries.map((entry) => [
      entry.id,
      `${entry.title} | ${entry.category} | ${entry.sourceReference} | ${entry.tags.join(', ') || 'нет'}`,
    ] satisfies [string, string]),
  ])
}

function renderMultipleControlPerimeters(result: PunchingShearResult) {
  if (result.contourComparison.length === 0) {
    return ''
  }

  return `<h2>Несколько контрольных контуров</h2>
    <p class="draft">Выбор нескольких контуров является черновым и требует проверки по СП 63.</p>
    ${renderTable([
      ['id контура', 'смещение | периметр | черновое напряжение | использование | выбран | предупреждения'],
      ...result.contourComparison.map((contour) => [
        contour.contourId,
        `${formatValueWithUnit(contour.offsetMm, 'мм')} | ${formatValueWithUnit(contour.perimeterMm, 'мм')} | ${formatValueWithUnit(contour.draftStressMpa, 'МПа', 3)} | ${formatUtilization(contour.utilization)} | ${contour.selected ? 'да' : 'нет'} | ${contour.warnings.join('; ') || 'нет'}`,
      ] satisfies [string, string]),
    ])}`
}

function renderCalculationTrace(report: PunchingShearReportModel) {
  const steps = report.calculationTrace.flatMap((section) =>
    section.steps.map((step) => ({ section, step })),
  )

  if (steps.length === 0) {
    return '<p class="note">Трассировка расчета недоступна.</p>'
  }

  return renderTable([
    ['раздел / шаг', 'формула | подстановка | результат | источник проверки'],
    ...steps.map(({ section, step }) => [
      `${section.title} / ${step.title}`,
      `${step.formula} | ${step.substitutedFormula} | ${step.result} ${step.units} | ${formatTraceSourceLabel(step.sourceType)} - ${step.sourceReference}${step.warnings.length > 0 ? ` | предупреждения: ${step.warnings.join('; ')}` : ''}`,
    ] satisfies [string, string]),
  ])
}

function renderFeatureList(features: string[]) {
  return `<ul>${(features.length > 0 ? features : ['нет'])
    .map((feature) => `<li>${escapeHtml(feature === 'нет' ? feature : formatFeatureLabel(feature))}</li>`)
    .join('')}</ul>`
}

function renderEvidence(result: PunchingShearResult) {
  if (result.verificationEvidence.length === 0) {
    return '<p class="note">Проверенные доказательства не привязаны.</p>'
  }

  return renderTable([
    ['ID случая', 'источник | проверил | дата проверки | статус'],
    ...result.verificationEvidence.map((evidence) => [
      evidence.id,
      `${evidence.verificationSource} | ${evidence.checkedBy ?? 'н/д'} | ${evidence.checkedAt ?? 'н/д'} | ${evidence.status}`,
    ] satisfies [string, string]),
  ])
}

function formatInlineFeatures(features: string[]) {
  return features.length > 0 ? features.map(formatFeatureLabel).join(', ') : 'нет'
}

function getPartialReportFeatures(result: PunchingShearResult) {
  return result.verificationLevel === 'partial' ? result.draftFeatures : []
}

function renderSvg(result: PunchingShearResult) {
  const svgModel = result.svgModel

  if (!svgModel) {
    return ''
  }

  return `<h2>Предпросмотр SVG</h2><div class="svg-wrap"><svg role="img" viewBox="${escapeHtml(viewBoxToString(svgModel.viewBox))}" xmlns="http://www.w3.org/2000/svg">
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
    ]),
  )
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
    'reinforcement-marker': '#047857',
    'reinforcement-row': '#059669',
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
    'reinforcement-marker': '#34d399',
    'reinforcement-row': 'none',
  }

  return colors[role]
}

function getStressColor(ratio: number) {
  const normalized = Math.max(0, Math.min(1, ratio))
  const hue = 200 - normalized * 200

  return `hsl(${hue.toFixed(0)} 82% 48%)`
}
