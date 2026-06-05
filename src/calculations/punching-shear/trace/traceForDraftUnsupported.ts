import type { PunchingShearInput, PunchingShearResult } from '../types'
import { buildVerificationLevelStep } from './traceCommon'
import { traceFoundationReference } from './traceMetadata'
import type { TraceSection } from './traceSection'

export function traceForDraftUnsupported(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (result.status !== 'not_implemented') {
    return null
  }

  return {
    id: 'unsupported-trace',
    title: 'Unsupported Draft Trace',
    steps: [
      {
        id: 'unsupported-scenario',
        title: 'Unsupported scenario',
        description: 'Trace explains that this scenario does not have an implemented calculation path.',
        formula: 'supportedDraftGeometry(input) = false',
        substitutedFormula: `caseType = ${input.caseType}`,
        result: result.status,
        units: 'n/a',
        sourceType: 'placeholder',
        sourceReference: traceFoundationReference,
        warnings: result.warnings,
      },
      buildVerificationLevelStep(result, result.warnings),
    ],
  }
}
