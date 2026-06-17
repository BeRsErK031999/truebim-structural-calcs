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
  if (isVerifiedCenterForceOnlyTraceCase(input, result)) {
    const Ab = calculateControlAreaMm2(result)

    return {
      id: 'stress',
      title: 'Stress',
      description: 'Force-only punching shear stress is calculated from design force and control area.',
      formula: 'v = N / Ab',
      substitutedFormula: `v = ${formatNullable(result.designShearForceN)} / ${formatNullable(Ab)}`,
      result: formatNullable(result.shearStressMpa, 6),
      units: 'MPa',
      sourceType,
      sourceReference: getSourceReference(sourceType),
      warnings: [],
    }
  }

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

  const geometryGenerationStep: TraceStep = {
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
  }

  if (isVerifiedCenterForceOnlyTraceCase(input, result)) {
    return [
      geometryGenerationStep,
      ...buildVerifiedCenterForceOnlyGeometrySteps(input, result, geometrySource, sourceReference),
    ]
  }

  return [
    geometryGenerationStep,
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

function buildVerifiedCenterForceOnlyGeometrySteps(
  input: PunchingShearInput,
  result: PunchingShearResult,
  sourceType: TraceSourceType,
  sourceReference: string,
): TraceStep[] {
  const columnX = input.rectColumn?.widthXMm
  const columnY = input.rectColumn?.widthYMm
  const offset = result.perimeter.draftOffsetMm
  const contourX = hasFiniteNumber(columnX) ? columnX + 2 * offset : null
  const contourY = hasFiniteNumber(columnY) ? columnY + 2 * offset : null
  const Ab = calculateControlAreaMm2(result)

  return [
    {
      id: 'control-perimeter-offset',
      title: 'Control perimeter offset',
      description: 'The verified center force-only rectangular contour uses the stored perimeter offset.',
      formula: 'offset = h0 / 2',
      substitutedFormula: `offset = ${formatNullable(result.effectiveDepthMm)} / 2`,
      result: formatNullable(offset),
      units: 'mm',
      sourceType,
      sourceReference,
      warnings: [],
    },
    {
      id: 'contour-x',
      title: 'Control contour X dimension',
      description: 'The X dimension of the control contour is derived from the column X dimension and stored offset.',
      formula: 'contourX = columnX + 2 * offset',
      substitutedFormula: `contourX = ${formatNullable(columnX)} + 2 * ${formatNullable(offset)}`,
      result: formatNullable(contourX),
      units: 'mm',
      sourceType,
      sourceReference,
      warnings: [],
    },
    {
      id: 'contour-y',
      title: 'Control contour Y dimension',
      description: 'The Y dimension of the control contour is derived from the column Y dimension and stored offset.',
      formula: 'contourY = columnY + 2 * offset',
      substitutedFormula: `contourY = ${formatNullable(columnY)} + 2 * ${formatNullable(offset)}`,
      result: formatNullable(contourY),
      units: 'mm',
      sourceType,
      sourceReference,
      warnings: [],
    },
    {
      id: 'control-perimeter',
      title: 'Control perimeter',
      description: 'The verified center force-only perimeter is the sum of two contour dimensions in each direction.',
      formula: 'u = 2 * contourX + 2 * contourY',
      substitutedFormula: `u = 2 * ${formatNullable(contourX)} + 2 * ${formatNullable(contourY)}`,
      result: formatNullable(result.controlPerimeterMm),
      units: 'mm',
      sourceType,
      sourceReference,
      warnings: [],
    },
    {
      id: 'effective-depth',
      title: 'Effective depth',
      description: 'Effective depth is taken from the normalized slab input.',
      formula: 'h0 = effective depth',
      substitutedFormula: `h0 = ${formatNullable(result.effectiveDepthMm)} mm`,
      result: formatNullable(result.effectiveDepthMm),
      units: 'mm',
      sourceType,
      sourceReference,
      warnings: [],
    },
    {
      id: 'control-area',
      title: 'Control area',
      description: 'Control area is derived from the selected perimeter and effective depth.',
      formula: 'Ab = u * h0',
      substitutedFormula: `Ab = ${formatNullable(result.controlPerimeterMm)} * ${formatNullable(result.effectiveDepthMm)}`,
      result: formatNullable(Ab),
      units: 'mm2',
      sourceType,
      sourceReference,
      warnings: [],
    },
  ]
}

function isVerifiedCenterForceOnlyTraceCase(
  input: PunchingShearInput,
  result: PunchingShearResult,
) {
  return (
    input.caseType === 'center' &&
    Boolean(input.rectColumn) &&
    input.openings.length === 0 &&
    input.forces.momentXKnM === 0 &&
    input.forces.momentYKnM === 0 &&
    !input.shearReinforcement.enabled &&
    !input.multipleContours?.enabled &&
    result.verificationLevel === 'verified' &&
    result.verifiedFeatures.includes('center-force-only')
  )
}

function calculateControlAreaMm2(result: PunchingShearResult) {
  if (!hasFiniteNumber(result.controlPerimeterMm) || !hasFiniteNumber(result.effectiveDepthMm)) {
    return null
  }

  return result.controlPerimeterMm * result.effectiveDepthMm
}

function hasFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
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
