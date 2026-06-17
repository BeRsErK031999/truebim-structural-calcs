import type { PunchingShearInput, PunchingShearReportModel, PunchingShearResult } from '../types'
import { localizeTraceText } from './traceLocalization'

export type EngineeringReportLine = {
  id: string
  text: string
  tone?: 'normal' | 'muted' | 'strong'
}

export type EngineeringReportSection = {
  id: string
  title: string
  lines: EngineeringReportLine[]
}

export type EngineeringReportTableRow = {
  label: string
  value: string
}

export type EngineeringReportServiceBlock = {
  id: string
  title: string
  rows?: EngineeringReportTableRow[]
  items?: string[]
}

export type EngineeringReportListing = {
  resultSummary: {
    statusText: string
    conditionText: string
    utilizationText: string
    reserveText: string
    reservePercentText: string
    passed: boolean | null
  }
  inputRows: EngineeringReportTableRow[]
  quickRows: EngineeringReportTableRow[]
  calculationSections: EngineeringReportSection[]
  conditionLines: EngineeringReportLine[]
  conclusionLines: EngineeringReportLine[]
  serviceBlocks: EngineeringReportServiceBlock[]
}

const unavailable = 'Параметр недоступен для данного режима расчета.'

export function buildEngineeringReportListing(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
): EngineeringReportListing {
  const utilization = formatRatio(result.utilizationRatio)
  const reserve = calculateReserve(result.utilizationRatio)
  const reserveText = reserve === null ? unavailable : `${formatNumber(reserve, 1)} %`
  const statusText = result.status === 'invalid_input' || result.status === 'not_implemented'
    ? 'Проверка не выполнена'
    : 'Проверка выполнена'
  const conditionText = result.passed === null
    ? 'Условие прочности не оценено.'
    : result.passed
      ? 'Условие прочности выполняется.'
      : 'Условие прочности не выполняется.'

  return {
    resultSummary: {
      statusText,
      conditionText,
      utilizationText: utilization,
      reserveText,
      reservePercentText: reserveText,
      passed: result.passed,
    },
    inputRows: buildInputRows(input, result),
    quickRows: buildQuickRows(result),
    calculationSections: buildCalculationSections(input, result),
    conditionLines: buildConditionLines(result),
    conclusionLines: buildConclusionLines(result),
    serviceBlocks: buildServiceBlocks(result, report),
  }
}

export function unavailableParameterText() {
  return unavailable
}

function buildInputRows(input: PunchingShearInput, result: PunchingShearResult): EngineeringReportTableRow[] {
  return [
    { label: 'N', value: formatKn(input.forces.axialForceKn) },
    { label: 'Mx', value: formatKnM(input.forces.momentXKnM) },
    { label: 'My', value: formatKnM(input.forces.momentYKnM) },
    { label: 'h', value: formatMm(input.slab.thicknessMm) },
    { label: 'h0', value: formatMm(result.effectiveDepthMm ?? input.slab.effectiveDepthMm) },
    { label: 'Размер колонны', value: formatSupportSize(input) },
    { label: 'Класс бетона', value: input.concrete.className },
    { label: 'Поперечная арматура', value: formatShearReinforcement(input, result) },
  ]
}

function buildQuickRows(result: PunchingShearResult): EngineeringReportTableRow[] {
  return [
    { label: 'N', value: formatN(result.designShearForceN) },
    { label: 'u', value: formatMm(result.controlPerimeterMm) },
    { label: 'h0', value: formatMm(result.effectiveDepthMm) },
    { label: 'v', value: formatMpa(result.shearStressMpa, 4) },
    { label: 'R', value: formatMpa(result.draftConcreteResistanceMpa, 3) },
  ]
}

function buildCalculationSections(
  input: PunchingShearInput,
  result: PunchingShearResult,
): EngineeringReportSection[] {
  const sections: EngineeringReportSection[] = [
    {
      id: 'geometry',
      title: 'Геометрические характеристики',
      lines: compactLines([
        line('u', `u = ${formatMm(result.controlPerimeterMm)}`),
        line('ab-formula', 'Ab = u × h0'),
        line(
          'ab-substitution',
          hasFinite(result.controlPerimeterMm) && hasFinite(result.effectiveDepthMm)
            ? `Ab = ${formatPlain(result.controlPerimeterMm)} × ${formatPlain(result.effectiveDepthMm)}`
            : `Ab = ${unavailable}`,
        ),
        line('ab-result', formatAreaLine(result)),
        ...buildOptionalSp63GeometryLines(result),
      ]),
    },
    {
      id: 'stress',
      title: 'Напряжение продавливания',
      lines: compactLines([
        line('v-formula', 'v = N / (u × h0)'),
        line(
          'v-substitution',
          hasFinite(result.designShearForceN) && hasFinite(result.controlPerimeterMm) && hasFinite(result.effectiveDepthMm)
            ? `v = ${formatPlain(result.designShearForceN)} / (${formatPlain(result.controlPerimeterMm)} × ${formatPlain(result.effectiveDepthMm)})`
            : `v = ${unavailable}`,
        ),
        line('v-result', `v = ${formatMpa(result.shearStressMpa, 4)}`),
      ]),
    },
    {
      id: 'capacity',
      title: 'Несущая способность',
      lines: compactLines([
        line('r', `R = ${formatMpa(result.draftConcreteResistanceMpa, 3)}`),
        ...buildLimitForceLines(result),
      ]),
    },
    {
      id: 'utilization',
      title: 'Коэффициент использования',
      lines: compactLines([
        line('eta-formula', 'η = v / R'),
        line(
          'eta-substitution',
          hasFinite(result.maxShearStressMpa ?? result.shearStressMpa) && hasFinite(result.draftConcreteResistanceMpa)
            ? `η = ${formatPlain(result.maxShearStressMpa ?? result.shearStressMpa, 4)} / ${formatPlain(result.draftConcreteResistanceMpa, 3)}`
            : `η = ${unavailable}`,
        ),
        line('eta-result', `η = ${formatRatio(result.utilizationRatio)}`),
      ]),
    },
  ]

  if (input.forces.momentXKnM !== 0 || input.forces.momentYKnM !== 0) {
    sections.splice(2, 0, {
      id: 'moments',
      title: 'Передача моментов',
      lines: compactLines([
        line('mx', `Mx = ${formatKnM(input.forces.momentXKnM)}`),
        line('my', `My = ${formatKnM(input.forces.momentYKnM)}`),
        line('ex', `ex = ${formatMm(result.eccentricityX, 3)}`),
        line('ey', `ey = ${formatMm(result.eccentricityY, 3)}`),
        line('vmax', `vmax = ${formatMpa(result.maxShearStressMpa, 4)}`),
        line('vmin', `vmin = ${formatMpa(result.minShearStressMpa, 4)}`),
      ]),
    })
  }

  if (result.shearReinforcement.enabled) {
    sections.push({
      id: 'shear-reinforcement',
      title: 'Поперечная арматура',
      lines: compactLines([
        line('asw', `Asw = ${formatMm2(result.reinforcementAreaMm2, 3)}`),
        line('vsw', `Vsw = ${formatN(result.reinforcementContributionN)}`),
        line('capacity-reinf', `Fult = ${formatN(result.draftCapacityWithReinforcementN)}`),
        line('eta-reinf', `ηsw = ${formatRatio(result.utilizationWithReinforcement)}`),
      ]),
    })
  }

  return sections
}

function buildOptionalSp63GeometryLines(result: PunchingShearResult): EngineeringReportLine[] {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return [
      line('ix-unavailable', `Ix = ${unavailable}`, 'muted'),
      line('iy-unavailable', `Iy = ${unavailable}`, 'muted'),
      line('wx-unavailable', `Wx = ${unavailable}`, 'muted'),
      line('wy-unavailable', `Wy = ${unavailable}`, 'muted'),
    ]
  }

  return [
    line('ab-sp63', `Ab(СП63) = ${formatM2(sp63.Ab, 6)}`),
    line('ix-unavailable', `Ix = ${unavailable}`, 'muted'),
    line('iy-unavailable', `Iy = ${unavailable}`, 'muted'),
    line('wx', `Wx = ${formatM2(sp63.Wx, 6)}`),
    line('wy', `Wy = ${formatM2(sp63.Wy, 6)}`),
  ]
}

function buildLimitForceLines(result: PunchingShearResult): EngineeringReportLine[] {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return [
      line('fb-unavailable', `Fb.ult = ${unavailable}`, 'muted'),
      line('mxult-unavailable', `Mx.ult = ${unavailable}`, 'muted'),
      line('myult-unavailable', `My.ult = ${unavailable}`, 'muted'),
      line('fult-unavailable', `Fult = ${unavailable}`, 'muted'),
    ]
  }

  return [
    line('fb', `Fb.ult = ${formatKnValue(sp63.FbUlt, 3)}`),
    line('mxult', `Mx.ult = ${formatKnMValue(sp63.MxBUlt, 3)}`),
    line('myult', `My.ult = ${formatKnMValue(sp63.MyBUlt, 3)}`),
    line('fult', `Fult = ${formatKnValue(sp63.Fult, 3)}`),
  ]
}

function buildConditionLines(result: PunchingShearResult): EngineeringReportLine[] {
  const condition = result.passed === null
    ? 'Условие не оценено.'
    : result.passed
      ? 'Условие выполняется.'
      : 'Условие не выполняется.'

  return compactLines([
    line('condition-formula', 'η ≤ 1.0'),
    line(
      'condition-substitution',
      hasFinite(result.utilizationRatio) ? `${formatPlain(result.utilizationRatio, 3)} ≤ 1.0` : unavailable,
    ),
    line('condition-result', condition, 'strong'),
  ])
}

function buildConclusionLines(result: PunchingShearResult): EngineeringReportLine[] {
  const utilizationPercent = hasFinite(result.utilizationRatio)
    ? `${formatNumber(result.utilizationRatio * 100, 1)}%`
    : unavailable
  const reserve = calculateReserve(result.utilizationRatio)
  const reserveText = reserve === null ? unavailable : `${formatNumber(reserve, 1)}%`
  const strengthText = result.passed === null
    ? 'Прочность на продавливание не оценена.'
    : result.passed
      ? 'Прочность на продавливание обеспечена.'
      : 'Прочность на продавливание не обеспечена.'

  return [
    line('conclusion-strength', strengthText),
    line('conclusion-utilization', `Коэффициент использования составляет ${utilizationPercent}.`),
    line('conclusion-reserve', `Запас несущей способности составляет ${reserveText}.`),
  ]
}

function buildServiceBlocks(
  result: PunchingShearResult,
  report: PunchingShearReportModel,
): EngineeringReportServiceBlock[] {
  return [
    {
      id: 'verification',
      title: 'Статус проверки',
      rows: [
        { label: 'Статус', value: localizeStatus(result.status) },
        { label: 'Уровень проверки', value: localizeVerificationLevel(result.verificationLevel) },
        { label: 'Проверенные возможности', value: formatList(result.verifiedFeatures) },
        { label: 'Черновые возможности', value: formatList(result.draftFeatures) },
      ],
    },
    {
      id: 'evidence',
      title: 'Доказательства проверки',
      items: result.verificationEvidence.length > 0
        ? result.verificationEvidence.map((evidence) => `${evidence.id}: ${localizeTraceText(evidence.status)}`)
        : ['Доказательства проверки не привязаны.'],
    },
    {
      id: 'warnings',
      title: 'Технические предупреждения',
      items: uniqueStrings([...report.warnings, ...result.reinforcementWarnings].map((item) => cleanServiceText(localizeTraceText(item)))),
    },
    {
      id: 'engine-notes',
      title: 'Исходные заметки движка',
      items: report.calculationSteps.map((item) => cleanServiceText(localizeTraceText(item))),
    },
  ]
}

function formatAreaLine(result: PunchingShearResult) {
  if (!hasFinite(result.controlPerimeterMm) || !hasFinite(result.effectiveDepthMm)) {
    return `Ab = ${unavailable}`
  }

  return `Ab = ${formatPlain(result.controlPerimeterMm * result.effectiveDepthMm)} мм²`
}

function formatSupportSize(input: PunchingShearInput) {
  if (input.rectColumn) {
    return `${formatPlain(input.rectColumn.widthXMm)} × ${formatPlain(input.rectColumn.widthYMm)} мм`
  }

  if (input.roundColumn) {
    return `диаметр ${formatPlain(input.roundColumn.diameterMm)} мм`
  }

  if (input.wall) {
    return `${formatPlain(input.wall.wallLength)} × ${formatPlain(input.wall.wallThickness)} мм`
  }

  if (input.wallCorner) {
    return `${formatPlain(input.wallCorner.wallLengthX)} × ${formatPlain(input.wallCorner.wallLengthY)} мм`
  }

  return unavailable
}

function formatShearReinforcement(input: PunchingShearInput, result: PunchingShearResult) {
  if (!input.shearReinforcement.enabled) {
    return 'не задана'
  }

  return result.shearReinforcement.steelClass
    ? `${result.shearReinforcement.steelClass}, ${result.shearReinforcement.totalLegs} стерж.`
    : 'задана'
}

function line(id: string, text: string, tone: EngineeringReportLine['tone'] = 'normal'): EngineeringReportLine {
  return { id, text, tone }
}

function compactLines(lines: EngineeringReportLine[]) {
  return lines.filter((item) => !isPseudoFormula(item.text))
}

function isPseudoFormula(value: string) {
  const normalized = value.replace(/\s+/g, '').toLowerCase()

  return ['u=u', 'h0=h0', 'r=r', 'η=η', 'eta=eta'].includes(normalized)
}

function calculateReserve(utilization: number | null | undefined) {
  if (!hasFinite(utilization)) {
    return null
  }

  return Math.max(0, (1 - utilization) * 100)
}

function formatRatio(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? formatNumber(value, decimals) : unavailable
}

function formatPlain(value: number | null | undefined, decimals?: number) {
  if (!hasFinite(value)) {
    return unavailable
  }

  return decimals === undefined ? formatNumber(value, Number.isInteger(value) ? 0 : 3) : formatNumber(value, decimals)
}

function formatNumber(value: number, decimals: number) {
  return decimals === 0 ? value.toFixed(0) : value.toFixed(decimals)
}

function formatKn(value: number | null | undefined) {
  return hasFinite(value) ? `${formatPlain(value)} кН` : unavailable
}

function formatKnM(value: number | null | undefined) {
  return hasFinite(value) ? `${formatPlain(value)} кН·м` : unavailable
}

function formatKnValue(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} кН` : unavailable
}

function formatKnMValue(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} кН·м` : unavailable
}

function formatN(value: number | null | undefined) {
  return hasFinite(value) ? `${formatPlain(value)} Н` : unavailable
}

function formatMm(value: number | null | undefined, decimals = 0) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} мм` : unavailable
}

function formatMm2(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} мм²` : unavailable
}

function formatMpa(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} МПа` : unavailable
}

function formatM2(value: number | null | undefined, decimals = 6) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} м²` : unavailable
}

function hasFinite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function localizeStatus(value: string) {
  const labels: Record<string, string> = {
    draft_ok: 'расчет выполнен',
    draft_failed: 'расчет не прошел проверку',
    not_implemented: 'не реализовано',
    invalid_input: 'ошибка исходных данных',
  }

  return labels[value] ?? value
}

function localizeVerificationLevel(value: string) {
  const labels: Record<string, string> = {
    verified: 'проверено',
    partial: 'частично проверено',
    draft: 'черновой режим',
  }

  return labels[value] ?? value
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(', ') : 'нет'
}

function cleanServiceText(value: string) {
  const mixedControlGeometry = new RegExp(
    ['Control', 'геометрия', 'периметра is черновик-only; инженерные формулы', 'are intentionally отключено'].join(' '),
    'g',
  )
  const mixedVerifiedScope = new RegExp(['Verified', 'scope is limited'].join(' '), 'g')
  const mixedEngineeringFormulas = new RegExp(['engineering', 'formulas'].join(' '), 'g')

  return value
    .replace(mixedControlGeometry, 'Геометрия расчетного контура является черновой; инженерные формулы отключены для этого режима.')
    .replace(
      /Черновой смещение uses geometry placeholder values pending SP63 verification/g,
      'Черновое смещение использует геометрические значения до проверки по СП63.',
    )
    .replace(
      /Проверенная область ограничена to the listed features; global SP63 support remains черновик\./g,
      'Проверенная область ограничена перечисленными возможностями; полная поддержка СП63 остается черновой.',
    )
    .replace(/Draft/g, 'Черновой')
    .replace(/draft/g, 'черновой')
    .replace(mixedVerifiedScope, 'Проверенная область ограничена')
    .replace(mixedEngineeringFormulas, 'инженерные формулы')
    .replace(/Control geometry/g, 'Геометрия контура')
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)))
}
