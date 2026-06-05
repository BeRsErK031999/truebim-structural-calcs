import type { PunchingShearInput, PunchingShearResult } from '../types'
import {
  centerForceOnlyTraceReference,
  traceFoundationReference,
} from './traceMetadata'
import { createTraceWarnings, usesDraftGeometry } from './traceWarnings'
import { formatList, formatNullable, formatNumber } from './traceFormat'
import type { TraceSourceType, TraceStep } from './traceStep'

export const momentEvidenceWarning =
  'Moment transfer is partial/draft and requires trusted evidence.'

export function buildInputValidationStep(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceStep {
  return {
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
  }
}

export function buildVerificationLevelStep(
  result: PunchingShearResult,
  warnings: string[],
): TraceStep {
  return {
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
    warnings,
  }
}

export function buildForceOnlyStressStep(
  input: PunchingShearInput,
  result: PunchingShearResult,
  sourceType = getArithmeticSource(input, result),
): TraceStep {
  return {
    id: 'stress',
    title: 'Stress',
    description: 'Force-only punching shear stress is calculated from design force, perimeter, and effective depth.',
    formula: 'v = N / (u * h0)',
    substitutedFormula: `v = ${formatNullable(result.designShearForceN)} / (${formatNullable(result.controlPerimeterMm)} * ${formatNullable(result.effectiveDepthMm)})`,
    result: formatNullable(result.shearStressMpa, 6),
    units: 'MPa',
    sourceType,
    sourceReference: getSourceReference(sourceType),
    warnings: sourceType === 'draft' ? createTraceWarnings(input, result) : [],
  }
}

export function buildUtilizationStep(
  input: PunchingShearInput,
  result: PunchingShearResult,
  sourceType = getArithmeticSource(input, result),
): TraceStep {
  return {
    id: 'utilization',
    title: 'Utilization',
    description: 'Utilization is calculated from design stress and current concrete resistance value.',
    formula: 'eta = v / R',
    substitutedFormula: `eta = ${formatNullable(result.maxShearStressMpa ?? result.shearStressMpa, 6)} / ${formatNullable(result.draftConcreteResistanceMpa)}`,
    result: formatNullable(result.utilizationRatio, 6),
    units: 'ratio',
    sourceType,
    sourceReference: getSourceReference(sourceType),
    warnings: sourceType === 'draft' ? createTraceWarnings(input, result) : [],
  }
}

export function buildBaseGeometrySteps(
  input: PunchingShearInput,
  result: PunchingShearResult,
): TraceStep[] {
  const arithmeticSource = getArithmeticSource(input, result)
  const geometrySource = usesDraftGeometry(input, result) ? 'draft' : arithmeticSource
  const sourceReference = getSourceReference(geometrySource)
  const warnings = usesDraftGeometry(input, result) ? createTraceWarnings(input, result) : []

  return [
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
      warnings,
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
      warnings,
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
      warnings,
    },
  ]
}

export function getArithmeticSource(
  input: PunchingShearInput,
  result: PunchingShearResult,
): Extract<TraceSourceType, 'verified' | 'partial' | 'draft'> {
  if (input.multipleContours?.enabled) {
    return 'draft'
  }

  if (result.verificationLevel === 'verified' && result.verifiedFeatures.includes('center-force-only')) {
    return 'verified'
  }

  if (result.verificationLevel === 'partial' && input.caseType === 'center') {
    return 'partial'
  }

  return 'draft'
}

export function getSourceReference(sourceType: TraceSourceType) {
  return sourceType === 'verified' ? centerForceOnlyTraceReference : traceFoundationReference
}
