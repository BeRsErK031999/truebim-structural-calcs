import type { TraceSourceType } from './traceStep'

export const traceSourceLabels: Record<TraceSourceType, string> = {
  verified: 'Проверенное доказательство',
  partial: 'Частично проверено',
  draft: 'Черновое пояснение',
  manual: 'Ручной ввод/схема',
  placeholder: 'Неподдерживаемый заполнитель',
}

export function formatTraceSourceLabel(sourceType: TraceSourceType) {
  return traceSourceLabels[sourceType]
}
