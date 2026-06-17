import { formatTraceSourceLabel } from './traceLabels'
import { localizeTraceText, localizeTraceWarnings } from './traceLocalization'
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
  return `${localizeTraceText(section.title)} / ${localizeTraceText(step.title)}`
}

export function formatTraceStepDetails(step: TraceStep) {
  const result = [localizeTraceText(step.result), localizeTraceText(step.units)]
    .filter((part) => part.trim().length > 0)
    .join(' ')
  const source = `${formatTraceSourceLabel(step.sourceType)} - ${localizeTraceText(step.sourceReference)}`
  const warnings =
    step.warnings.length > 0
      ? ` | предупреждения: ${localizeTraceWarnings(step.warnings).join('; ')}`
      : ''

  return `${step.formula} | ${localizeTraceText(step.substitutedFormula)} | ${result} | ${source}${warnings}`
}
