import { getAppMetadata } from '@/shared/config/appMetadata'

export type ReportVerificationSource =
  | 'NOT VERIFIED'
  | 'WebCAD checked'
  | 'Manual engineer calculation'
  | 'Verified Excel'
  | 'Normative example'

export type ReportMetadata = {
  generatedAt: string
  calculationId: string
  verificationSource: ReportVerificationSource
}

export const reportAssumptions = [
  'Геометрия центральных, крайних, угловых колонн и отверстий остается черновой там, где она задана',
  'Отверстия используют черновую геометрию вычитания по касательным',
  'Края плиты используют черновую геометрию обрезки контрольного периметра',
  'Геометрия конца стены и угла стены остается черновой там, где она задана',
  'Вклад поперечной арматуры остается черновым при включении',
  'Моменты используют черновое перераспределение там, где они заданы',
  'Черновые значения сопротивления бетона',
  'Черновая геометрия периметра',
]

export const unsupportedDraftFeatures = [
  'проверенные формулы для отверстий',
  'проверенные формулы для крайних колонн',
  'проверенные формулы для угловых колонн',
  'проверенные формулы для углов стен',
  'круглые колонны',
  'проверенный вклад поперечной арматуры',
  'проверенная передача моментов',
  'проверенные коэффициенты СП 63',
]

export const reportApplicabilityItems = [
  'Подходит для пилотной проверки, сравнения и сбора доказательств.',
  'Проверенные возможности ограничены списком, указанным в этом отчете.',
  'Частичные возможности требуют доверенной инженерной проверки перед применением.',
  'Черновые возможности не являются финальными проектными расчетами.',
  'Это не финальный проектный документ, если покрытие проверенных возможностей не соответствует выбранному случаю.',
]

export function createReportMetadata(now = new Date(), calculationId = createCalculationId(now)): ReportMetadata {
  return {
    generatedAt: now.toISOString(),
    calculationId,
    verificationSource: 'NOT VERIFIED',
  }
}

export function createCalculationId(now = new Date()) {
  const appMetadata = getAppMetadata()
  const date = formatDateStamp(now)
  const time = formatTimeStamp(now)
  const commit = normalizeCommit(appMetadata.commit)

  return `ps-center-${date}-${time}-${commit}`
}

function formatDateStamp(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
}

function formatTimeStamp(date: Date) {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('')
}

function normalizeCommit(commit: string) {
  const normalized = commit.trim()

  return normalized.length > 0 && normalized !== 'unknown' ? normalized.slice(0, 7) : 'unknown'
}
