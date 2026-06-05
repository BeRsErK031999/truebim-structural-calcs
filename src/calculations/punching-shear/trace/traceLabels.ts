import type { TraceSourceType } from './traceStep'

export const traceSourceLabels: Record<TraceSourceType, string> = {
  verified: 'Verified evidence',
  partial: 'Partially verified',
  draft: 'Draft explainability',
  manual: 'Manual input/schema',
  placeholder: 'Unsupported placeholder',
}

export function formatTraceSourceLabel(sourceType: TraceSourceType) {
  return traceSourceLabels[sourceType]
}
