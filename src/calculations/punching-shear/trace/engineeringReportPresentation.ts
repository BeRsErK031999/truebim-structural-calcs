import { localizeTraceText } from './traceLocalization'
import { flattenTraceSteps } from './tracePresentation'
import type { TraceSection } from './traceSection'
import type { TraceStep } from './traceStep'

export type EngineeringTraceGroups = {
  geometry: TraceStep[]
  calculation: TraceStep[]
  checks: TraceStep[]
}

export function groupEngineeringTraceSteps(sections: TraceSection[]): EngineeringTraceGroups {
  return flattenTraceSteps(sections).reduce<EngineeringTraceGroups>(
    (groups, { step }) => {
      if (!isInternalTraceStep(step)) {
        groups[getEngineeringStepGroup(step)].push(step)
      }

      return groups
    },
    { geometry: [], calculation: [], checks: [] },
  )
}

export function engineeringStepTitle(step: TraceStep) {
  const titleById: Record<string, string> = {
    'geometry-generation': 'Геометрия расчетного контура',
    'control-perimeter': 'Расчетный контур продавливания',
    'effective-depth': 'Рабочая высота сечения',
    stress: 'Проверка напряжений',
    utilization: 'Коэффициент использования',
    'force-only-stress': 'Проверка напряжений от силы',
    'moment-eccentricity': 'Эксцентриситет от моментов',
    'draft-stress-redistribution': 'Распределение напряжений по контуру',
    'max-min-stress': 'Максимальное и минимальное напряжение',
    'concrete-capacity': 'Несущая способность бетона',
    'reinforcement-capacity': 'Несущая способность армирования',
    'interaction-check': 'Проверка взаимодействия',
    'outer-contour-check': 'Проверка внешнего контура',
  }

  return titleById[step.id] ?? sanitizeEngineeringText(localizeTraceText(step.title))
}

export function engineeringStepDescription(step: TraceStep) {
  const descriptionById: Record<string, string> = {
    'geometry-generation': 'Формируется геометрия расчетного контура вокруг опоры.',
    'control-perimeter': 'В расчете используется выбранная длина расчетного контура продавливания.',
    'effective-depth': 'Рабочая высота сечения принимается из исходных данных плиты или геометрии расчетного случая.',
    stress: 'Напряжение от продольной силы определяется по площади расчетного контура.',
    utilization: 'Коэффициент использования определяется как отношение расчетного напряжения к принятой несущей способности.',
    'force-only-stress': 'Базовое напряжение определяется от продольной силы без учета моментов.',
    'moment-eccentricity': 'Эксцентриситеты определяются по заданным моментам и продольной силе.',
    'draft-stress-redistribution': 'Напряжения распределяются по расчетному контуру с учетом эксцентриситетов.',
    'max-min-stress': 'Максимальное и минимальное напряжения выбираются из распределения по контуру.',
    'concrete-capacity': 'Несущая способность бетона определяется по площади и моментам сопротивления расчетного контура.',
    'reinforcement-capacity': 'Вклад поперечной арматуры определяется по площади, шагу и расчетному сопротивлению стали.',
    'interaction-check': 'Проверяется совместное действие силы и моментов.',
    'outer-contour-check': 'Проверяется несущая способность за зоной поперечного армирования.',
  }

  return descriptionById[step.id] ?? sanitizeEngineeringText(localizeTraceText(step.description))
}

export function formatEngineeringFormulaText(value: string) {
  return sanitizeEngineeringText(value)
    .replace(/\*/g, '×')
    .replace(/\beta_reinf\b/g, 'ηsw')
    .replace(/\beta_?/g, 'η')
    .replace(/\beta\b/g, 'η')
    .replace(/\bMPa\b/g, 'МПа')
    .replace(/\bmm2\b/g, 'мм2')
    .replace(/\bmm\b/g, 'мм')
    .replace(/\bkN×m\b/g, 'кН·м')
    .replace(/\bkN\b/g, 'кН')
    .replace(/\bratio\b/g, '')
    .replace(/\bcontrol perimeter\b/gi, 'u')
    .replace(/\beffective depth\b/gi, 'h0')
    .replace(/\bconcrete capacity\b/gi, 'несущая способность бетона')
    .trim()
}

export function formatEngineeringFormulaResult(step: TraceStep) {
  const result = [localizeTraceText(step.result), localizeTraceText(step.units)]
    .filter((part) => part.trim().length > 0 && part !== 'н/д')
    .join(' ')

  return formatEngineeringFormulaText(result || 'не оценено')
}

export function sanitizeEngineeringText(value: string) {
  return value
    .replace(/\bDTO\b/gi, 'данные')
    .replace(/\bschema\b/gi, 'проверка')
    .replace(/\bsafeParse\b/gi, 'проверка')
    .replace(/\bparse\b/gi, 'проверка')
    .replace(/\bvalidation layer\b/gi, 'проверка исходных данных')
    .replace(/\bexplainability layer\b/gi, 'пояснение расчета')
    .replace(/\btrace foundation\b/gi, 'расчетное основание')
    .replace(/\bverification scope\b/gi, 'область проверки')
    .replace(/\bdraft formula\b/gi, 'формула')
    .replace(/\bdraft explainability\b/gi, 'пояснение расчета')
    .replace(/\bcurrent draft\b/gi, 'текущий расчетный')
    .replace(/\bdraft-only\b/gi, 'требующий проверки')
    .replace(/\bdraft\b/gi, 'расчетный')
    .replace(/Черновая формула должна быть проверена/g, 'Формулы должны быть проверены')
    .replace(
      /На шаге есть черновая формула или черновая область проверки\./g,
      'Требуется инженерная проверка расчетной предпосылки.',
    )
    .replace(/пояснительный слой трассировки СП63/g, 'расчет по СП63')
    .replace(/геометрия данные -> сегменты контрольного периметра/g, 'геометрия -> участки расчетного контура')
}

function getEngineeringStepGroup(step: TraceStep): keyof EngineeringTraceGroups {
  const text = `${step.id} ${step.title}`.toLowerCase()

  if (
    text.includes('geometry') ||
    text.includes('perimeter') ||
    text.includes('contour') ||
    text.includes('depth') ||
    text.includes('opening') ||
    text.includes('wall') ||
    text.includes('round')
  ) {
    return 'geometry'
  }

  if (
    text.includes('utilization') ||
    text.includes('capacity') ||
    text.includes('interaction') ||
    text.includes('outer') ||
    text.includes('verification')
  ) {
    return 'checks'
  }

  return 'calculation'
}

function isInternalTraceStep(step: TraceStep) {
  const technicalText = `${step.id} ${step.title} ${step.description} ${step.formula}`.toLowerCase()

  return (
    step.id === 'input-validation' ||
    step.id === 'verification-level' ||
    technicalText.includes('schema') ||
    technicalText.includes('safeparse') ||
    technicalText.includes('dto') ||
    technicalText.includes('trace foundation') ||
    technicalText.includes('explainability')
  )
}
