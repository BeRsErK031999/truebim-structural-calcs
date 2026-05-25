import { defaultPunchingShearInput } from './defaults'
import { calculateControlPerimeter } from './geometry/perimeter'
import { getConcreteClassData } from './materials'
import { punchingShearInputSchema } from './schemas'
import { buildPunchingSketchModel } from './sketch/punchingSketch'
import { knToN, normalizePunchingShearInput } from './units'
import type { PunchingShearInput, PunchingShearResult } from './types'

const draftCalculationWarning =
  'Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.'

const draftScopeWarnings = [
  draftCalculationWarning,
  'Moments are ignored in this draft',
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
  const svgModel = buildPunchingSketchModel(normalizedInput, perimeter)
  const material = getConcreteClassData(normalizedInput.concrete.className)

  if (!isSupportedDraftCenterCase(normalizedInput)) {
    return {
      ...createBaseResult(normalizedInput, perimeter, svgModel),
      status: 'not_implemented',
      warnings: [
        ...draftScopeWarnings,
        ...perimeter.warnings,
        'Only center rectangular column without openings, slab edges, or shear reinforcement is implemented',
      ],
    }
  }

  if (perimeter.perimeterMm <= 0 || perimeter.effectiveDepthMm <= 0) {
    return {
      ...createBaseResult(normalizedInput, perimeter, svgModel),
      status: 'invalid_input',
      warnings: [...draftScopeWarnings, ...perimeter.warnings, 'Invalid perimeter geometry'],
    }
  }

  const designShearForceN = knToN(normalizedInput.forces.axialForceKn)
  const shearStressMpa = designShearForceN / (perimeter.perimeterMm * perimeter.effectiveDepthMm)
  const draftConcreteResistanceMpa = material.draftConcreteResistanceMpa
  const utilizationRatio = shearStressMpa / draftConcreteResistanceMpa
  const passed = utilizationRatio <= 1

  return {
    ...createBaseResult(normalizedInput, perimeter, svgModel),
    status: passed ? 'draft_ok' : 'draft_failed',
    utilization: utilizationRatio,
    designShearForceN,
    controlPerimeterMm: perimeter.perimeterMm,
    effectiveDepthMm: perimeter.effectiveDepthMm,
    shearStressMpa,
    draftConcreteResistanceMpa,
    utilizationRatio,
    passed,
    warnings: [...draftScopeWarnings, ...perimeter.warnings],
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
  const svgModel = buildPunchingSketchModel(fallbackInput, perimeter)

  return {
    ...createBaseResult(fallbackInput, perimeter, svgModel),
    status: 'invalid_input',
    warnings: [...draftScopeWarnings, ...validationWarnings],
  } satisfies PunchingShearResult
}

function createBaseResult(
  input: PunchingShearInput,
  perimeter: ReturnType<typeof calculateControlPerimeter>,
  svgModel: ReturnType<typeof buildPunchingSketchModel>,
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
    draftConcreteResistanceMpa: material.draftConcreteResistanceMpa,
    utilizationRatio: null,
    passed: null,
    material: {
      className: material.className,
      draftConcreteResistanceMpa: material.draftConcreteResistanceMpa,
    },
    perimeter,
    svgModel,
    warnings: [...draftScopeWarnings, ...perimeter.warnings],
    placeholders: [
      'utilization',
      'moment contribution',
      'shear reinforcement contribution',
      'openings subtraction',
    ],
  }
}
