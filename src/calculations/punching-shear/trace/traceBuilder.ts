import type { PunchingShearInput, PunchingShearResult } from '../types'
import {
  centerForceOnlyTraceReference,
  traceFoundationReference,
} from './traceMetadata'
import { createTraceWarnings, usesDraftGeometry } from './traceWarnings'
import type { TraceSection } from './traceSection'
import type { TraceSourceType, TraceStep } from './traceStep'

export function buildPunchingShearTrace(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceSection[] {
  return [
    {
      id: 'calculation-trace',
      title: 'Calculation Trace',
      steps: buildCenterForceOnlyTraceSteps(input, result),
    },
  ]
}

function buildCenterForceOnlyTraceSteps(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceStep[] {
  const arithmeticSource = getArithmeticSource(input, result)
  const geometrySource = usesDraftGeometry(input, result) ? 'draft' : arithmeticSource
  const sourceReference =
    arithmeticSource === 'verified' ? centerForceOnlyTraceReference : traceFoundationReference

  return [
    {
      id: 'input-validation',
      title: 'Input validation',
      description: 'Input DTO passed schema validation before calculation values were produced.',
      formula: 'punchingShearInputSchema.safeParse(input)',
      substitutedFormula: `caseType = ${input.caseType}, concrete = ${input.concrete.className}, N = ${formatNumber(input.forces.axialForceKn)} kN`,
      result: result.status === 'invalid_input' ? 'invalid input' : 'valid input',
      units: 'n/a',
      sourceType: 'manual',
      sourceReference: 'application input schema',
      warnings: result.status === 'invalid_input' ? result.warnings : [],
    },
    {
      id: 'geometry-generation',
      title: 'Geometry generation',
      description: 'Control geometry was generated from the normalized punching shear input.',
      formula: 'geometry DTO -> control perimeter segments',
      substitutedFormula: `${result.perimeter.segments.length} segment(s), ${result.perimeter.vertices.length} vertex/vertices`,
      result: `${formatNumber(result.perimeter.perimeterMm)} mm perimeter geometry`,
      units: 'mm',
      sourceType: geometrySource,
      sourceReference,
      warnings: usesDraftGeometry(input, result) ? createTraceWarnings(input, result) : [],
    },
    {
      id: 'control-perimeter',
      title: 'Control perimeter',
      description: 'The calculation uses the selected control perimeter length.',
      formula: 'u = control perimeter',
      substitutedFormula: `u = ${formatNullable(result.controlPerimeterMm)} mm`,
      result: formatNullable(result.controlPerimeterMm),
      units: 'mm',
      sourceType: geometrySource,
      sourceReference,
      warnings: usesDraftGeometry(input, result) ? createTraceWarnings(input, result) : [],
    },
    {
      id: 'effective-depth',
      title: 'Effective depth',
      description: 'Effective depth is taken from the normalized slab or case-specific geometry input.',
      formula: 'h0 = effective depth',
      substitutedFormula: `h0 = ${formatNullable(result.effectiveDepthMm)} mm`,
      result: formatNullable(result.effectiveDepthMm),
      units: 'mm',
      sourceType: geometrySource,
      sourceReference,
      warnings: usesDraftGeometry(input, result) ? createTraceWarnings(input, result) : [],
    },
    {
      id: 'stress',
      title: 'Stress',
      description: 'Force-only punching shear stress is calculated from design force, perimeter, and effective depth.',
      formula: 'v = N / (u * h0)',
      substitutedFormula: `v = ${formatNullable(result.designShearForceN)} / (${formatNullable(result.controlPerimeterMm)} * ${formatNullable(result.effectiveDepthMm)})`,
      result: formatNullable(result.shearStressMpa, 6),
      units: 'MPa',
      sourceType: arithmeticSource,
      sourceReference,
      warnings: arithmeticSource === 'draft' ? createTraceWarnings(input, result) : [],
    },
    {
      id: 'utilization',
      title: 'Utilization',
      description: 'Utilization is calculated from design stress and current concrete resistance value.',
      formula: 'eta = v / R',
      substitutedFormula: `eta = ${formatNullable(result.maxShearStressMpa ?? result.shearStressMpa, 6)} / ${formatNullable(result.draftConcreteResistanceMpa)}`,
      result: formatNullable(result.utilizationRatio, 6),
      units: 'ratio',
      sourceType: arithmeticSource,
      sourceReference,
      warnings: arithmeticSource === 'draft' ? createTraceWarnings(input, result) : [],
    },
    {
      id: 'verification-level',
      title: 'Verification level',
      description: 'Trace reports the verification level assigned by the existing verification lifecycle.',
      formula: 'verificationLevel = existing verified status result',
      substitutedFormula: `verified = ${formatList(result.verifiedFeatures)}, draft = ${formatList(result.draftFeatures)}`,
      result: result.verificationLevel.toUpperCase(),
      units: 'n/a',
      sourceType: result.verificationLevel,
      sourceReference:
        result.verificationEvidenceIds.join(', ') || 'no linked verified evidence',
      warnings: createTraceWarnings(input, result),
    },
  ]
}

function getArithmeticSource(
  input: PunchingShearInput,
  result: PunchingShearResult,
): Extract<TraceSourceType, 'verified' | 'partial' | 'draft'> {
  if (result.verificationLevel === 'verified' && result.verifiedFeatures.includes('center-force-only')) {
    return 'verified'
  }

  if (result.verificationLevel === 'partial' && input.caseType === 'center') {
    return 'partial'
  }

  return 'draft'
}

function formatNullable(value: number | null | undefined, digits = 3) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? 'n/a'
    : value.toFixed(digits)
}

function formatNumber(value: number, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a'
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(', ') : 'none'
}
