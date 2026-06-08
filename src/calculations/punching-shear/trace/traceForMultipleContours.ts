import type { PunchingShearInput, PunchingShearResult } from '../types'
import { traceFoundationReference } from './traceMetadata'
import { formatNullable } from './traceFormat'
import type { TraceSection } from './traceSection'

export function traceForMultipleContours(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (!input.multipleContours?.enabled) {
    return null
  }

  const warnings = [
    'Выбор нескольких контуров является черновым и требует проверки по СП 63.',
    ...result.contourWarnings,
  ]

  return {
    id: 'multiple-contours-trace',
    title: 'Трассировка нескольких контуров',
    steps: [
      {
        id: 'contour-generation',
        title: 'Формирование контуров',
        description: 'Несколько контрольных контуров формируются текущим черновым алгоритмом.',
        formula: 'multipleContours DTO -> draft control contours',
        substitutedFormula: `включено = ${formatEnabledRu(input.multipleContours.enabled)}, количество = ${input.multipleContours.count}`,
        result: `${result.controlContours.length} шт.`,
        units: 'нет',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'contour-offsets',
        title: 'Смещения контуров',
        description: 'Смещения выводятся из сформированных DTO контуров.',
        formula: 'offset_i = configured draft offset sequence',
        substitutedFormula: `шаг = ${input.multipleContours.offsetStep}`,
        result: result.controlContours.map((contour) => `${contour.id}:${formatNullable(contour.offsetMm)}`).join(', '),
        units: 'мм',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-stress-per-contour',
        title: 'Черновое напряжение по контуру',
        description: 'Напряжение каждого контура является текущим черновым значением и используется только для сравнения.',
        formula: 'v_i = N / (u_i * h0)',
        substitutedFormula: `${result.contourComparison.length} строк сравнения`,
        result: result.contourComparison.map((row) => `${row.contourId}:${formatNullable(row.draftStressMpa, 6)}`).join(', '),
        units: 'МПа',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-critical-contour-selection',
        title: 'Выбор критического чернового контура',
        description: 'Критический контур выбирается текущим черновым правилом максимального коэффициента использования.',
        formula: 'critical = max(eta_i)',
        substitutedFormula: `выбран = ${result.selectedContourId ?? 'нет'}`,
        result: result.draftCriticalContour?.selectedContourId ?? 'нет',
        units: 'нет',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'contour-warnings',
        title: 'Предупреждения по контурам',
        description: 'Предупреждения выводятся из чернового формирования и выбора контуров.',
        formula: 'warnings = contourWarnings',
        substitutedFormula: `${result.contourWarnings.length} предупреждений`,
        result: result.contourWarnings.join('; ') || 'нет',
        units: 'нет',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
    ],
  }
}

function formatEnabledRu(value: boolean) {
  return value ? 'да' : 'нет'
}
