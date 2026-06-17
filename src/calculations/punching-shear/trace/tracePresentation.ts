import { formatTraceSourceLabel } from './traceLabels'
import type { TraceSection } from './traceSection'
import type { TraceStep } from './traceStep'

export type FlatTraceStep = {
  section: TraceSection
  step: TraceStep
}

export function flattenTraceSteps(sections: TraceSection[]): FlatTraceStep[] {
  return sections.flatMap((section) =>
    section.steps.map((step) => ({ section, step })),
  )
}

export function formatTraceStepPath({ section, step }: FlatTraceStep) {
  return `${section.title} / ${step.title}`
}

export function formatTraceStepDetails(step: TraceStep) {
  const result = [step.result, step.units].filter((part) => part.trim().length > 0).join(' ')
  const source = `${formatTraceSourceLabel(step.sourceType)} - ${step.sourceReference}`
  const warnings =
    step.warnings.length > 0 ? ` | предупреждения: ${step.warnings.join('; ')}` : ''

  return `${step.formula} | ${step.substitutedFormula} | ${result} | ${source}${warnings}`
}
