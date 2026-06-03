import type { TraceSourceType } from './traceStep'

export const traceSourceLabels: Record<TraceSourceType, string> = {
  verified: 'VERIFIED',
  partial: 'PARTIAL',
  draft: 'DRAFT',
  manual: 'MANUAL',
  placeholder: 'PLACEHOLDER',
}

export const centerForceOnlyTraceReference = 'center-force-only evidence: verified-center-rect-001'
export const traceFoundationReference = 'SP63 trace foundation explainability layer'
