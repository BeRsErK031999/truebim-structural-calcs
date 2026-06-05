import type { PunchingShearInput, PunchingShearResult } from '../types'
import { buildVerificationLevelStep } from './traceCommon'
import { traceFoundationReference } from './traceMetadata'
import { createTraceWarnings } from './traceWarnings'
import { formatNullable } from './traceFormat'
import type { TraceSection } from './traceSection'

export function traceForRoundColumn(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection | null {
  if (input.caseType !== 'round') {
    return null
  }

  const warnings = createTraceWarnings(input, result)

  if (input.roundColumn?.position !== 'center') {
    return {
      id: 'round-column-trace',
      title: 'Round Column Trace',
      steps: [
        {
          id: 'round-edge-corner-not-implemented',
          title: 'Round edge/corner support',
          description: 'Round edge and corner punching trace explains that the calculation path is not implemented.',
          formula: 'round position != center -> not implemented',
          substitutedFormula: `position = ${input.roundColumn?.position ?? 'n/a'}`,
          result: 'not implemented',
          units: 'n/a',
          sourceType: 'placeholder',
          sourceReference: traceFoundationReference,
          warnings: ['Round edge/corner trace is explanatory only; no verified or draft formula is claimed.'],
        },
        buildVerificationLevelStep(result, warnings),
      ],
    }
  }

  return {
    id: 'round-column-trace',
    title: 'Round Column Trace',
    steps: [
      {
        id: 'round-geometry',
        title: 'Round geometry',
        description: 'Round center column geometry is generated from the round column DTO.',
        formula: 'roundColumn DTO -> circular column geometry',
        substitutedFormula: `diameter = ${formatNullable(input.roundColumn?.diameterMm)} mm`,
        result: `${result.perimeter.segments.length} segment(s)`,
        units: 'n/a',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'circular-control-perimeter-approximation',
        title: 'Circular control perimeter approximation',
        description: 'Circular control perimeter is approximated by the current draft round geometry implementation.',
        formula: 'u = pi * (d + 2 * offset)',
        substitutedFormula: `d = ${formatNullable(input.roundColumn?.diameterMm)} mm, offset = ${formatNullable(result.perimeter.draftOffsetMm)} mm`,
        result: formatNullable(result.controlPerimeterMm),
        units: 'mm',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-perimeter',
        title: 'Draft perimeter',
        description: 'Selected round perimeter is draft-only and requires trusted SP63 evidence.',
        formula: 'u_draft = current round perimeter DTO',
        substitutedFormula: `${result.perimeter.vertices.length} vertex/vertices`,
        result: formatNullable(result.perimeter.perimeterMm),
        units: 'mm',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      {
        id: 'draft-stress',
        title: 'Draft stress',
        description: 'Round center stress uses the current draft force-only expression.',
        formula: 'v = N / (u * h0)',
        substitutedFormula: `N = ${formatNullable(result.designShearForceN)} N, u = ${formatNullable(result.controlPerimeterMm)} mm`,
        result: formatNullable(result.shearStressMpa, 6),
        units: 'MPa',
        sourceType: 'draft',
        sourceReference: traceFoundationReference,
        warnings,
      },
      buildVerificationLevelStep(result, warnings),
    ],
  }
}
