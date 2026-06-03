import type { TraceStep } from './traceStep'

export type TraceSection = {
  id: string
  title: string
  steps: TraceStep[]
}
