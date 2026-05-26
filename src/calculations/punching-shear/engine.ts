import { defaultPunchingShearInput } from './defaults'
import { calculateControlPerimeter } from './geometry/perimeter'
import { getConcreteClassData } from './materials'
import {
  calculateDraftMomentTransfer,
  createDisabledMomentTransfer,
} from './moments/momentTransfer'
import { punchingShearInputSchema } from './schemas'
import { buildPunchingSketchModel } from './sketch/punchingSketch'
import { knToN, normalizePunchingShearInput } from './units'
import type { PunchingShearInput, PunchingShearResult } from './types'

const draftCalculationWarning =
  'Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.'

const draftScopeWarnings = [
  draftCalculationWarning,
  'Moment transfer uses draft-only stress redistribution when Mx/My are provided',
  'Openings are not supported in this draft',
  'Shear reinforcement is not included in this draft',
  'Draft formula must be verified before design use',
]

export function calculatePunchingShear(input: PunchingShearInput): PunchingShearResult {
  const parsedInput = punchingShearInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return createInvalidInputResult(input, parsedInput.error.issues.map((issue) => issue.message))
  }

  const normalizedInput = normalizePunchingShearInput(parsedInput.data)
  const perimeter = calculateControlPerimeter(normalizedInput)
  const material = getConcreteClassData(normalizedInput.concrete.className)

  if (!isSupportedDraftCenterCase(normalizedInput)) {
    const momentTransfer = createDisabledMomentTransfer()
    const svgModel = buildPunchingSketchModel(normalizedInput, perimeter, momentTransfer)

    return {
      ...createBaseResult(normalizedInput, perimeter, svgModel, momentTransfer),
      status: 'not_implemented',
      warnings: [
        ...draftScopeWarnings,
        ...perimeter.warnings,
        'Only center rectangular column without openings, slab edges, or shear reinforcement is implemented',
      ],
    }
  }

  if (perimeter.perimeterMm <= 0 || perimeter.effectiveDepthMm <= 0) {
    const momentTransfer = createDisabledMomentTransfer()
    const svgModel = buildPunchingSketchModel(normalizedInput, perimeter, momentTransfer)

    return {
      ...createBaseResult(normalizedInput, perimeter, svgModel, momentTransfer),
      status: 'invalid_input',
      warnings: [...draftScopeWarnings, ...perimeter.warnings, 'Invalid perimeter geometry'],
    }
  }

  const designShearForceN = knToN(normalizedInput.forces.axialForceKn)
  const shearStressMpa = designShearForceN / (perimeter.perimeterMm * perimeter.effectiveDepthMm)
  const momentTransfer = calculateDraftMomentTransfer({
    forces: normalizedInput.forces,
    perimeter,
    baseStressMpa: shearStressMpa,
  })
  const svgModel = buildPunchingSketchModel(normalizedInput, perimeter, momentTransfer)
  const draftConcreteResistanceMpa = material.draftConcreteResistanceMpa
  const maxShearStressMpa = momentTransfer.stressDistribution?.maxStressMpa ?? shearStressMpa
  const minShearStressMpa = momentTransfer.stressDistribution?.minStressMpa ?? shearStressMpa
  const designStressMpa = momentTransfer.enabled ? maxShearStressMpa : shearStressMpa
  const utilizationRatio = designStressMpa / draftConcreteResistanceMpa
  const passed = utilizationRatio <= 1

  return {
    ...createBaseResult(normalizedInput, perimeter, svgModel, momentTransfer),
    status: passed ? 'draft_ok' : 'draft_failed',
    utilization: utilizationRatio,
    designShearForceN,
    controlPerimeterMm: perimeter.perimeterMm,
    effectiveDepthMm: perimeter.effectiveDepthMm,
    shearStressMpa,
    eccentricityX: momentTransfer.eccentricityX,
    eccentricityY: momentTransfer.eccentricityY,
    maxShearStressMpa,
    minShearStressMpa,
    stressDistribution: momentTransfer.stressDistribution,
    momentTransferEnabled: momentTransfer.enabled,
    stressDiagramMetadata: momentTransfer.metadata,
    draftConcreteResistanceMpa,
    utilizationRatio,
    passed,
    warnings: [...draftScopeWarnings, ...perimeter.warnings, ...momentTransfer.warnings],
    placeholders: [
      'moment contribution',
      'shear reinforcement contribution',
      'openings subtraction',
      'edge and corner behavior',
    ],
  }
}

function isSupportedDraftCenterCase(input: PunchingShearInput) {
  return (
    input.caseType === 'center' &&
    Boolean(input.rectColumn) &&
    input.openings.length === 0 &&
    !input.slabEdges &&
    !input.shearReinforcement.enabled
  )
}

function createInvalidInputResult(input: PunchingShearInput, validationWarnings: string[]) {
  const fallbackInput = {
    ...defaultPunchingShearInput,
    caseType: input.caseType ?? defaultPunchingShearInput.caseType,
  }
  const perimeter = calculateControlPerimeter(fallbackInput)
  const momentTransfer = createDisabledMomentTransfer()
  const svgModel = buildPunchingSketchModel(fallbackInput, perimeter, momentTransfer)

  return {
    ...createBaseResult(fallbackInput, perimeter, svgModel, momentTransfer),
    status: 'invalid_input',
    warnings: [...draftScopeWarnings, ...validationWarnings],
  } satisfies PunchingShearResult
}

function createBaseResult(
  input: PunchingShearInput,
  perimeter: ReturnType<typeof calculateControlPerimeter>,
  svgModel: ReturnType<typeof buildPunchingSketchModel>,
  momentTransfer: ReturnType<typeof createDisabledMomentTransfer> | ReturnType<typeof calculateDraftMomentTransfer>,
): PunchingShearResult {
  const material = getConcreteClassData(input.concrete.className)

  return {
    status: 'not_implemented',
    caseType: input.caseType,
    utilization: null,
    designShearForceN: null,
    controlPerimeterMm: perimeter.perimeterMm || null,
    effectiveDepthMm: perimeter.effectiveDepthMm || null,
    shearStressMpa: null,
    eccentricityX: momentTransfer.eccentricityX,
    eccentricityY: momentTransfer.eccentricityY,
    maxShearStressMpa: null,
    minShearStressMpa: null,
    stressDistribution: momentTransfer.stressDistribution,
    momentTransferEnabled: momentTransfer.enabled,
    stressDiagramMetadata: momentTransfer.metadata,
    draftConcreteResistanceMpa: material.draftConcreteResistanceMpa,
    utilizationRatio: null,
    passed: null,
    material: {
      className: material.className,
      draftConcreteResistanceMpa: material.draftConcreteResistanceMpa,
    },
    perimeter,
    svgModel,
    momentTransfer,
    warnings: [...draftScopeWarnings, ...perimeter.warnings],
    placeholders: [
      'utilization',
      'moment contribution',
      'shear reinforcement contribution',
      'openings subtraction',
    ],
  }
}
