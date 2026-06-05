import type { PunchingShearInput, PunchingShearResult } from '../types'
import {
  buildBaseGeometrySteps,
  buildForceOnlyStressStep,
  buildInputValidationStep,
  buildUtilizationStep,
  buildVerificationLevelStep,
} from './traceCommon'
import { createTraceWarnings } from './traceWarnings'
import { traceForCenterMoment } from './traceForCenterMoment'
import { traceForDraftUnsupported } from './traceForDraftUnsupported'
import { traceForMultipleContours } from './traceForMultipleContours'
import { traceForOpenings } from './traceForOpenings'
import { traceForRoundColumn } from './traceForRoundColumn'
import { traceForShearReinforcement } from './traceForShearReinforcement'
import { traceForWallCorner } from './traceForWallCorner'
import { traceForWallEnd } from './traceForWallEnd'
import type { TraceSection } from './traceSection'

export const traceBuilderRegistry = [
  'center-force-only',
  'center-moment',
  'wall-end',
  'wall-corner',
  'openings',
  'multiple-contours',
  'shear-reinforcement',
  'round-column',
  'draft-unsupported',
] as const

export function buildPunchingShearTrace(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection[] {
  return [
    buildCenterForceOnlyTraceSection(input, result),
    traceForCenterMoment(input, result),
    traceForWallEnd(input, result),
    traceForWallCorner(input, result),
    traceForOpenings(input, result),
    traceForMultipleContours(input, result),
    traceForShearReinforcement(input, result),
    traceForRoundColumn(input, result),
    traceForDraftUnsupported(input, result),
  ].filter((section): section is TraceSection => section !== null)
}

function buildCenterForceOnlyTraceSection(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection {
  return {
    id: 'calculation-trace',
    title: 'Calculation Trace',
    steps: [
      buildInputValidationStep(input, result),
      ...buildBaseGeometrySteps(input, result),
      buildForceOnlyStressStep(input, result),
      buildUtilizationStep(input, result),
      buildVerificationLevelStep(result, createTraceWarnings(input, result)),
    ],
  }
}
