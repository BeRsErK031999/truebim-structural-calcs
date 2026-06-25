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
    verificationText: string
    conditionText: string
    utilizationText: string
    reserveText: string
    reservePercentText: string
    passed: boolean | null
  }
  assumptionsText: string
  inputText: string
  inputRows: EngineeringReportTableRow[]
  quickRows: EngineeringReportTableRow[]
  calculationSections: EngineeringReportSection[]
  conditionLines: EngineeringReportLine[]
  conclusionLines: EngineeringReportLine[]
  footerRows: EngineeringReportTableRow[]
  serviceBlocks: EngineeringReportServiceBlock[]
}

const unavailable = 'Не задано'
const etaSymbol = '\u03b7'

export function buildEngineeringReportListing(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
): EngineeringReportListing {
  const governingUtilization = result.governingUtilization
  const reserve = calculateReserve(governingUtilization)
  const reserveText = reserve === null ? unavailable : `${formatNumber(reserve, 1)} %`
  const statusText =
    result.status === 'invalid_input' || result.status === 'not_implemented'
      ? 'Проверка не выполнена'
      : result.passed
        ? 'Прочность обеспечена'
        : 'Прочность не обеспечена'
  const conditionText =
    result.passed === null
      ? 'Условие прочности не оценено.'
      : result.passed
        ? 'Условие прочности выполняется.'
        : 'Условие прочности не выполняется.'

  return {
    resultSummary: {
      statusText,
      verificationText: localizeVerificationLevel(result.verificationStatus),
      conditionText,
      utilizationText: formatRatio(governingUtilization),
      reserveText,
      reservePercentText: reserveText,
      passed: result.passed,
    },
    assumptionsText: buildAssumptionsText(input, result),
    inputText: buildInputText(input, result),
    inputRows: buildInputRows(input, result),
    quickRows: buildQuickRows(result),
    calculationSections: buildCalculationSections(input, result),
    conditionLines: buildConditionLines(result),
    conclusionLines: buildConclusionLines(result),
    footerRows: [],
    serviceBlocks: buildServiceBlocks(input, result, report),
  }
}

export function unavailableParameterText() {
  return unavailable
}

function buildAssumptionsText(input: PunchingShearInput, result: PunchingShearResult) {
  const support = formatSupportKind(input)
  const moments =
    input.forces.momentXKnM !== 0 || input.forces.momentYKnM !== 0
      ? 'моменты Mx/My учитываются черновым перераспределением напряжений'
      : 'моменты отсутствуют'
  const reinforcement = input.shearReinforcement.enabled
    ? result.shearReinforcement.contributionAccepted
      ? 'поперечная арматура учитывается по ручным Asw и sw'
      : 'поперечная арматура задана, но ее вклад не включен в итоговую проверку'
    : 'поперечная арматура не задана'
  const openings =
    input.openings.length > 0 ? `учтены отверстия: ${input.openings.length}` : 'отверстия отсутствуют'
  const method =
    input.caseType === 'center' && input.rectColumn
      ? 'контрольный периметр принят на расстоянии h0/2 от грани колонны'
      : 'геометрия расчетного контура является черновой подготовкой'

  return `${support}; ${moments}; ${reinforcement}; ${openings}. ${method}. ${localizeVerificationLevel(result.verificationStatus)}.`
}

function buildInputText(input: PunchingShearInput, result: PunchingShearResult) {
  const values = [
    `N = ${formatKn(input.forces.axialForceKn)}`,
    input.forces.momentXKnM !== 0 ? `Mx = ${formatKnM(input.forces.momentXKnM)}` : null,
    input.forces.momentYKnM !== 0 ? `My = ${formatKnM(input.forces.momentYKnM)}` : null,
    `h = ${formatMm(input.slab.thicknessMm)}`,
    `h₀ = ${formatMm(result.effectiveDepthMm ?? input.slab.effectiveDepthMm)}`,
    `колонна ${formatSupportSize(input)}`,
    `бетон ${input.concrete.className}`,
    `Rbt = ${formatMpa(result.draftConcreteResistanceMpa, 3)}`,
    input.shearReinforcement.enabled ? formatReinforcementInputSentence(result) : null,
  ].filter((value): value is string => Boolean(value))

  return `${values.join('; ')}.`
}

function buildInputRows(input: PunchingShearInput, result: PunchingShearResult): EngineeringReportTableRow[] {
  return [
    { label: 'N', value: formatKn(input.forces.axialForceKn) },
    ...(input.forces.momentXKnM !== 0 ? [{ label: 'Mx', value: formatKnM(input.forces.momentXKnM) }] : []),
    ...(input.forces.momentYKnM !== 0 ? [{ label: 'My', value: formatKnM(input.forces.momentYKnM) }] : []),
    { label: 'h', value: formatMm(input.slab.thicknessMm) },
    { label: 'h₀', value: formatMm(result.effectiveDepthMm ?? input.slab.effectiveDepthMm) },
    { label: 'Колонна', value: formatSupportSize(input) },
    { label: 'Бетон', value: input.concrete.className },
    { label: 'Rbt', value: formatMpa(result.draftConcreteResistanceMpa, 3) },
    ...(input.shearReinforcement.enabled
      ? buildReinforcementInputRows(result)
      : []),
  ]
}

function buildQuickRows(result: PunchingShearResult): EngineeringReportTableRow[] {
  const sp63 = result.sp63Interaction

  return [
    { label: 'N', value: formatN(result.designShearForceN) },
    { label: 'u', value: formatMm(result.controlPerimeterMm) },
    { label: 'h₀', value: formatMm(result.effectiveDepthMm) },
    { label: 'Fb,ult', value: sp63 ? formatKn(sp63.FbUlt) : formatN(result.concreteCapacityN) },
    { label: 'Fult', value: sp63 ? formatKn(sp63.Fult) : formatN(result.totalCapacityN) },
    { label: 'Mx,ult', value: sp63 ? formatKnM(sp63.MxUlt) : unavailable },
    { label: 'My,ult', value: sp63 ? formatKnM(sp63.MyUlt) : unavailable },
    { label: etaSymbol, value: formatRatio(result.governingUtilization) },
  ]
}

function buildCalculationSections(
  input: PunchingShearInput,
  result: PunchingShearResult,
): EngineeringReportSection[] {
  const sections: EngineeringReportSection[] = [
    {
      id: 'geometry',
      title: 'Геометрия расчетного контура',
      lines: [
        formula(
          'u',
          input.rectColumn && result.effectiveDepthMm !== null
            ? `u = 2(h₀ + h₀ + a_c + b_c) = 2(${formatPlain(result.effectiveDepthMm)} + ${formatPlain(result.effectiveDepthMm)} + ${formatPlain(input.rectColumn.widthXMm)} + ${formatPlain(input.rectColumn.widthYMm)}) = ${formatMm(result.controlPerimeterMm)}`
            : `u = ${formatMm(result.controlPerimeterMm)}`,
        ),
        formula(
          'ab',
          hasFinite(result.controlPerimeterMm) && hasFinite(result.effectiveDepthMm)
            ? `A_b = u · h₀ = ${formatPlain(result.controlPerimeterMm)} · ${formatPlain(result.effectiveDepthMm)} = ${formatMm2(result.controlPerimeterMm * result.effectiveDepthMm, 0)}`
            : `A_b = ${unavailable}`,
        ),
      ],
    },
    {
      id: 'concrete',
      title: 'Несущая способность бетона',
      lines: [
        formula(
          'fb',
          hasFinite(result.draftConcreteResistanceMpa) && hasFinite(result.concreteCapacityN)
            ? `F_b,ult = Rbt · A_b = ${formatPlain(result.draftConcreteResistanceMpa, 3)} · ${formatPlain((result.controlPerimeterMm ?? 0) * (result.effectiveDepthMm ?? 0), 0)} = ${formatN(result.concreteCapacityN)}`
            : `F_b,ult = ${unavailable}`,
        ),
        formula(
          'eta-concrete',
          hasFinite(result.designShearForceN) && hasFinite(result.concreteCapacityN)
            ? `${etaSymbol}_b = F / F_b,ult = ${formatKnFromN(result.designShearForceN)} / ${formatKnFromN(result.concreteCapacityN)} = ${formatRatio(result.utilizationConcrete)}`
            : `${etaSymbol}_b = ${unavailable}`,
        ),
      ],
    },
  ]

  if (input.shearReinforcement.enabled) {
    sections.push({
      id: 'shear-reinforcement',
      title: 'Поперечная арматура',
      lines: buildReinforcementLines(result),
    })
  }

  sections.push({
    id: 'total',
    title: 'Итоговая проверка',
    lines: result.sp63Interaction ? buildSp63InteractionLines(result) : buildForceOnlyTotalLines(result),
  })

  return sections
}

function buildForceOnlyTotalLines(result: PunchingShearResult): EngineeringReportLine[] {
  return [
    formula(
      'fult',
      hasFinite(result.concreteCapacityN) && hasFinite(result.shearReinforcementEffectiveCapacityN) && result.shearReinforcement.contributionAccepted
        ? `Fult = F_b,ult + F_sw,used = ${formatKnFromN(result.concreteCapacityN)} + ${formatKnFromN(result.shearReinforcementEffectiveCapacityN)} = ${formatKnFromN(result.totalCapacityN)}`
        : `Fult = F_b,ult = ${formatKnFromN(result.totalCapacityN)}`,
    ),
    formula(
      'eta-total',
      hasFinite(result.designShearForceN) && hasFinite(result.totalCapacityN)
        ? `${etaSymbol} = F / Fult = ${formatKnFromN(result.designShearForceN)} / ${formatKnFromN(result.totalCapacityN)} = ${formatRatio(result.governingUtilization)}`
        : `${etaSymbol} = ${unavailable}`,
    ),
  ]
}

function buildSp63InteractionLines(result: PunchingShearResult): EngineeringReportLine[] {
  const sp63 = result.sp63Interaction

  if (!sp63) {
    return buildForceOnlyTotalLines(result)
  }

  const usesReinforcement = sp63.utilizationWithReinforcement !== null
  const fultFormula = usesReinforcement
    ? `Fult = min(2 · F_b,ult, F_b,ult + F_sw,ult) = min(2 · ${formatKn(sp63.FbUlt)}, ${formatKn(sp63.FbUlt)} + ${formatKn(sp63.FswUltEffective)}) = ${formatKn(sp63.Fult)}`
    : `Fult = F_b,ult = ${formatKn(sp63.FbUlt)}`
  const mxFormula = usesReinforcement
    ? `Mx,ult = min(2 · Mx,b,ult, Mx,b,ult + Mx,sw,ult) = min(2 · ${formatKnM(sp63.MxBUlt)}, ${formatKnM(sp63.MxBUlt)} + ${formatKnM(sp63.MxSwUlt)}) = ${formatKnM(sp63.MxUlt)}`
    : `Mx,ult = Mx,b,ult = ${formatKnM(sp63.MxBUlt)}`
  const myFormula = usesReinforcement
    ? `My,ult = min(2 · My,b,ult, My,b,ult + My,sw,ult) = min(2 · ${formatKnM(sp63.MyBUlt)}, ${formatKnM(sp63.MyBUlt)} + ${formatKnM(sp63.MySwUlt)}) = ${formatKnM(sp63.MyUlt)}`
    : `My,ult = My,b,ult = ${formatKnM(sp63.MyBUlt)}`
  const interactionCapacity = usesReinforcement
    ? `${formatKn(sp63.Fult)}, ${formatKnM(sp63.MxUlt)}, ${formatKnM(sp63.MyUlt)}`
    : `${formatKn(sp63.FbUlt)}, ${formatKnM(sp63.MxBUlt)}, ${formatKnM(sp63.MyBUlt)}`
  const interactionValue = usesReinforcement
    ? sp63.utilizationWithReinforcement
    : sp63.utilizationConcreteOnly

  return [
    formula('fult-sp63', fultFormula),
    formula('mxult-sp63', mxFormula),
    formula('myult-sp63', myFormula),
    formula(
      'eta-sp63',
      `${etaSymbol} = min(F/Fult + Mx/Mx,ult + My/My,ult, 1.5 · F/Fult); F, Mx, My = ${formatKn(sp63.F)}, ${formatKnM(sp63.Mx)}, ${formatKnM(sp63.My)}; Fult, Mx,ult, My,ult = ${interactionCapacity}; ${etaSymbol} = ${formatRatio(interactionValue)}`,
    ),
  ]
}

function buildReinforcementLines(result: PunchingShearResult): EngineeringReportLine[] {
  const summary = result.shearReinforcement

  if (summary.inputMode === 'legacy-layout') {
    return [
      formula(
        'legacy-asw',
        `Asw не принят: старая схема содержит ${summary.totalLegs} условных стержней, но не содержит ручного Asw/sw и реальных координат.`,
        'strong',
      ),
      formula('legacy-reason', summary.ignoredReason ?? 'Вклад арматуры не учтен.', 'strong'),
    ]
  }

  if (summary.inputMode === 'bar-count') {
    return [
      formula(
        'legacy-bar-count',
        'Старый расчет использовал количество стержней для оценки Asw. Проверьте и подтвердите Asw вручную.',
        'strong',
      ),
      ...buildReinforcementCapacityLines(result),
    ]
  }

  return [
    formula('asw-manual', `Asw принято пользователем = ${formatCm2FromMm2(summary.reinforcementAreaMm2, 3)} (${formatMm2(summary.reinforcementAreaMm2, 1)})`),
    formula('sw-manual', `sw принято пользователем = ${formatMm(summary.swMm)}`),
    ...buildReinforcementCapacityLines(result),
  ]
}

function buildReinforcementCapacityLines(result: PunchingShearResult): EngineeringReportLine[] {
  const summary = result.shearReinforcement

  return [
    formula(
      'qsw',
      hasFinite(summary.qswNPerMm)
        ? `q_sw = Rsw · Asw / sw = ${formatPlain(getSteelStrengthFromSummary(summary), 3)} · ${formatPlain(summary.reinforcementAreaMm2, 3)} мм² / ${formatPlain(summary.swMm)} = ${formatNPerMm(summary.qswNPerMm)}`
        : `q_sw = ${unavailable}`,
    ),
    formula(
      'fsw-raw',
      hasFinite(summary.rawContributionN)
        ? `F_sw,raw = 0.8 · q_sw · u = 0.8 · ${formatPlain(summary.qswNPerMm, 3)} · ${formatPlain(result.controlPerimeterMm)} = ${formatN(summary.rawContributionN)}`
        : `F_sw,raw = ${unavailable}`,
    ),
    formula(
      'lower-limit',
      hasFinite(summary.rawContributionN) && hasFinite(summary.lowerLimitN)
        ? `F_sw,raw ≥ 0.25 · F_b,ult: ${formatKnFromN(summary.rawContributionN)} ≥ ${formatKnFromN(summary.lowerLimitN)}`
        : `F_sw,raw ≥ 0.25 · F_b,ult: ${unavailable}`,
      summary.contributionAccepted ? 'normal' : 'strong',
    ),
    formula(
      'upper-limit',
      hasFinite(summary.rawContributionN) && hasFinite(summary.upperLimitN)
        ? `F_sw,raw ≤ F_b,ult: ${formatKnFromN(summary.rawContributionN)} ≤ ${formatKnFromN(summary.upperLimitN)}`
        : `F_sw,raw ≤ F_b,ult: ${unavailable}`,
    ),
    formula('fsw-used', `F_sw,used = ${formatN(summary.effectiveContributionN)}`),
    ...(summary.ignoredReason ? [formula('reinforcement-ignored', summary.ignoredReason, 'strong')] : []),
  ]
}

function buildConditionLines(result: PunchingShearResult): EngineeringReportLine[] {
  const sp63 = result.sp63Interaction
  const condition = sp63
    ? `${etaSymbol} = min(F/Fult + Mx/Mx,ult + My/My,ult, 1.5 · F/Fult) = ${formatRatio(result.governingUtilization)} ≤ 1.0`
    : `${etaSymbol} = ${formatRatio(result.governingUtilization)} ≤ 1.0`

  return [
    formula('condition', condition, result.passed ? 'normal' : 'strong'),
    formula('condition-result', result.passed ? 'Условие выполняется.' : 'Условие не выполняется.', 'strong'),
  ]
}

function buildConclusionLines(result: PunchingShearResult): EngineeringReportLine[] {
  if (!hasFinite(result.designShearForceN) || (!hasFinite(result.totalCapacityN) && !result.sp63Interaction)) {
    return [formula('conclusion-empty', 'Прочность на продавливание не оценена.', 'strong')]
  }

  const expression = result.sp63Interaction
    ? `(F/Fult + Mx/Mx,ult + My/My,ult с ограничением 1.5 · F/Fult; ${etaSymbol} = ${formatRatio(result.governingUtilization)})`
    : `(F/Fult = ${formatKnFromN(result.designShearForceN)}/${formatKnFromN(result.totalCapacityN)} = ${formatRatio(result.governingUtilization)})`

  return [
    formula(
      'conclusion',
      result.passed
        ? `Прочность на продавливание обеспечена ${expression}.`
        : `Прочность на продавливание не обеспечена ${expression}.`,
      'strong',
    ),
    formula('verification-note', `Статус методики: ${localizeVerificationLevel(result.verificationStatus)}.`),
  ]
}

function buildServiceBlocks(
  input: PunchingShearInput,
  result: PunchingShearResult,
  report: PunchingShearReportModel,
): EngineeringReportServiceBlock[] {
  const blocks: EngineeringReportServiceBlock[] = [
    {
      id: 'verification',
      title: 'Статус проверки',
      rows: [
        { label: 'Статус расчета', value: localizeStatus(result.status) },
        { label: 'Уровень проверки', value: localizeVerificationLevel(result.verificationStatus) },
        { label: 'Проверенные возможности', value: formatList(result.verifiedFeatures) },
        { label: 'Черновые возможности', value: formatList(result.draftFeatures) },
      ],
    },
    {
      id: 'warnings',
      title: 'Диагностические сообщения',
      items: relevantWarnings(input, result, report),
    },
    {
      id: 'evidence',
      title: 'Evidence',
      items:
        result.verificationEvidence.length > 0
          ? result.verificationEvidence.map((evidence) => `${evidence.id}: ${localizeTraceText(evidence.status)}`)
          : ['Evidence не привязан.'],
    },
  ]

  if (input.shearReinforcement.enabled && result.shearReinforcement.inputMode === 'manual') {
    blocks.push({
      id: 'reinforcement-layout',
      title: 'Нерасчетная схема армирования',
      rows: [
        { label: 'Назначение', value: 'Схема показывает только расположение маркеров в эскизе; расчет использует ручные Asw и sw.' },
        { label: 'Схема армирования', value: formatLayoutType(result.shearReinforcement.layoutType) },
        { label: 'Количество рядов', value: formatPlain(result.shearReinforcement.rowCount) },
        { label: 'Ветвей в ряду', value: formatPlain(result.shearReinforcement.legsPerRow) },
        { label: 'Шаг стержней', value: formatMm(result.shearReinforcement.barSpacingMm) },
        { label: 'Расстояние до первого ряда', value: formatMm(result.shearReinforcement.firstRowDistanceMm) },
        { label: 'Шаг рядов', value: formatMm(result.shearReinforcement.rowSpacingMm) },
      ],
    })
  }

  return blocks
}

function relevantWarnings(input: PunchingShearInput, result: PunchingShearResult, report: PunchingShearReportModel) {
  const hasMoments = input.forces.momentXKnM !== 0 || input.forces.momentYKnM !== 0
  const values = uniqueStrings([...report.warnings, ...result.reinforcementWarnings].map((item) => localizeTraceText(item)))

  return values.filter((warning) => {
    const lower = warning.toLowerCase()

    if (!hasMoments && (lower.includes('moment') || lower.includes('момент'))) {
      return false
    }

    if (input.openings.length === 0 && (lower.includes('opening') || lower.includes('отверст'))) {
      return false
    }

    if (!input.shearReinforcement.enabled && (lower.includes('reinforcement') || lower.includes('арматур'))) {
      return false
    }

    if (input.caseType !== 'wall-end' && (lower.includes('wall-end') || lower.includes('конца стены'))) {
      return false
    }

    if (input.caseType !== 'wall-corner' && (lower.includes('wall-corner') || lower.includes('углу стены'))) {
      return false
    }

    if (input.caseType !== 'round' && (lower.includes('round') || lower.includes('круглая колонна'))) {
      return false
    }

    return true
  })
}

function formatSupportKind(input: PunchingShearInput) {
  const labels: Record<PunchingShearInput['caseType'], string> = {
    center: 'центральная прямоугольная колонна',
    edge: 'крайняя прямоугольная колонна',
    corner: 'угловая прямоугольная колонна',
    opening: 'прямоугольная колонна с отверстием',
    round: 'круглая колонна',
    'wall-end': 'конец стены',
    'wall-corner': 'угол стены',
  }

  return labels[input.caseType]
}

function formatSupportSize(input: PunchingShearInput) {
  if (input.rectColumn) {
    return `${formatPlain(input.rectColumn.widthXMm)} x ${formatPlain(input.rectColumn.widthYMm)} мм`
  }

  if (input.roundColumn) {
    return `диаметр ${formatPlain(input.roundColumn.diameterMm)} мм`
  }

  if (input.wall) {
    return `${formatPlain(input.wall.wallLength)} x ${formatPlain(input.wall.wallThickness)} мм`
  }

  if (input.wallCorner) {
    return `${formatPlain(input.wallCorner.wallLengthX)} x ${formatPlain(input.wallCorner.wallLengthY)} мм`
  }

  return unavailable
}

function formatReinforcementInputSentence(result: PunchingShearResult) {
  const summary = result.shearReinforcement

  if (!summary.enabled) {
    return 'не задана'
  }

  if (summary.inputMode === 'legacy-layout') {
    return `${summary.steelClass ?? 'сталь не задана'}, старая схема ${summary.totalLegs} условных стерж.; требуется ручной Asw/sw`
  }

  return `${summary.steelClass ?? 'сталь не задана'}, Asw = ${formatCm2FromMm2(summary.reinforcementAreaMm2, 3)}, sw = ${formatMm(summary.swMm)}`
}

function buildReinforcementInputRows(result: PunchingShearResult): EngineeringReportTableRow[] {
  const summary = result.shearReinforcement
  const commonRows = [
    { label: 'Поперечная арматура', value: formatReinforcementInputSentence(result) },
    { label: 'Rsw', value: formatMpa(getSteelStrength(result), 3) },
    { label: 'Asw', value: formatCm2FromMm2(result.reinforcementAreaMm2, 3) },
  ]

  return [...commonRows, { label: 'sw', value: formatMm(summary.swMm) }]
}

function formatLayoutType(value: PunchingShearResult['shearReinforcement']['layoutType']) {
  const labels: Record<string, string> = {
    'closed-stirrups': 'замкнутые хомуты',
    studs: 'шпильки',
    links: 'связи',
    custom: 'своя схема',
  }

  return value ? labels[value] ?? value : unavailable
}

function getSteelStrength(result: PunchingShearResult) {
  return getSteelStrengthFromSummary(result.shearReinforcement)
}

function getSteelStrengthFromSummary(summary: PunchingShearResult['shearReinforcement']) {
  const strengths: Record<string, number> = {
    A240: 170,
    A400: 280,
    A500: 355,
    B500: 355,
  }

  return summary.steelClass ? strengths[summary.steelClass] : null
}

function formula(id: string, text: string, tone: EngineeringReportLine['tone'] = 'normal'): EngineeringReportLine {
  return { id, text, tone }
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

function formatKnFromN(value: number | null | undefined) {
  return hasFinite(value) ? `${formatPlain(value / 1000, 1)} кН` : unavailable
}

function formatN(value: number | null | undefined) {
  return hasFinite(value) ? `${formatPlain(value, 0)} Н` : unavailable
}

function formatNPerMm(value: number | null | undefined) {
  return hasFinite(value) ? `${formatPlain(value, 3)} Н/мм` : unavailable
}

function formatMm(value: number | null | undefined, decimals = 0) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} мм` : unavailable
}

function formatMm2(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} мм²` : unavailable
}

function formatCm2FromMm2(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? `${formatPlain(value / 100, decimals)} см²` : unavailable
}

function formatMpa(value: number | null | undefined, decimals = 3) {
  return hasFinite(value) ? `${formatPlain(value, decimals)} МПа` : unavailable
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
    verified: 'верифицирован',
    partial: 'частично верифицирован',
    draft: 'черновой расчет - не для проектного применения',
  }

  return labels[value] ?? value
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(', ') : 'нет'
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)))
}
