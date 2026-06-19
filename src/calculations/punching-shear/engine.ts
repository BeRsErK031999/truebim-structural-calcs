import { defaultPunchingShearInput } from './defaults'
import { compareControlContours } from './contours/contourComparison'
import { generateControlContours } from './contours/contourGeneration'
import { selectDraftCriticalContour } from './contours/contourSelection'
import { createContourWarnings } from './contours/contourWarnings'
import { calculateControlPerimeter } from './geometry/perimeter'
import { getConcreteClassData } from './materials'
import {
  calculateDraftMomentTransfer,
  createDisabledMomentTransfer,
} from './moments/momentTransfer'
import { punchingShearInputSchema } from './schemas'
import { buildPunchingSketchModel } from './sketch/punchingSketch'
import { summarizeShearReinforcement } from './reinforcement/shearReinforcement'
import { calculateSp63MathcadBenchmark } from './sp63'
import { knToN, normalizePunchingShearInput } from './units'
import { applyVerifiedStatus, buildVerifiedStatus } from './verified/verifiedStatus'
import type { PunchingShearInput, PunchingShearResult } from './types'

const draftCalculationWarning =
  'Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.'

const draftScopeWarnings = [
  draftCalculationWarning,
  'Moment transfer uses draft-only stress redistribution when Mx/My are provided',
  'Openings and boundary clipping are draft geometry only',
  'Wall-end punching support is draft geometry only',
  'Wall-corner punching support is draft geometry only',
  'Round column support is draft center-only geometry',
  'Shear reinforcement contribution is draft-only when enabled',
  'Draft formula must be verified before design use',
]

export function calculatePunchingShear(input: PunchingShearInput): PunchingShearResult {
  const parsedInput = punchingShearInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return createInvalidInputResult(input, parsedInput.error.issues.map((issue) => issue.message))
  }

  const normalizedInput = normalizePunchingShearInput(parsedInput.data)
  const perimeter = calculateControlPerimeter(normalizedInput)
  const contourBundle = buildContourBundle(normalizedInput)
  const selectedPerimeter =
    contourBundle.draftCriticalContour === null
      ? perimeter
      : calculateControlPerimeter(normalizedInput, {
          draftOffsetMm:
            contourBundle.controlContours[contourBundle.draftCriticalContour.selectedIndex - 1]
              ?.offsetMm,
        })
  const material = getConcreteClassData(normalizedInput.concrete.className)

  if (!isSupportedDraftGeometryCase(normalizedInput)) {
    const momentTransfer = createDisabledMomentTransfer()
    const svgModel = buildPunchingSketchModel(
      normalizedInput,
      perimeter,
      momentTransfer,
      contourBundle.controlContours,
      contourBundle.selectedContourId,
    )

    return withVerifiedStatus(normalizedInput, {
      ...createBaseResult(normalizedInput, perimeter, svgModel, momentTransfer),
      ...contourBundle,
      status: 'not_implemented',
      warnings: [
        ...draftScopeWarnings,
        ...perimeter.warnings,
        'Only rectangular center, edge, corner, opening, wall-end, wall-corner, and round-center draft geometry cases are implemented',
      ],
    })
  }

  if (selectedPerimeter.perimeterMm <= 0 || selectedPerimeter.effectiveDepthMm <= 0) {
    const momentTransfer = createDisabledMomentTransfer()
    const svgModel = buildPunchingSketchModel(
      normalizedInput,
      selectedPerimeter,
      momentTransfer,
      contourBundle.controlContours,
      contourBundle.selectedContourId,
    )

    return withVerifiedStatus(normalizedInput, {
      ...createBaseResult(normalizedInput, selectedPerimeter, svgModel, momentTransfer),
      ...contourBundle,
      status: 'invalid_input',
      warnings: [...draftScopeWarnings, ...perimeter.warnings, 'Invalid perimeter geometry'],
    })
  }

  const designShearForceN = knToN(normalizedInput.forces.axialForceKn)
  const shearStressMpa = designShearForceN / (selectedPerimeter.perimeterMm * selectedPerimeter.effectiveDepthMm)
  const momentTransfer = calculateDraftMomentTransfer({
    forces: normalizedInput.forces,
    perimeter: selectedPerimeter,
    baseStressMpa: shearStressMpa,
  })
  const svgModel = buildPunchingSketchModel(
    normalizedInput,
    selectedPerimeter,
    momentTransfer,
    contourBundle.controlContours,
    contourBundle.selectedContourId,
  )
  const draftConcreteResistanceMpa = material.draftConcreteResistanceMpa
  const maxShearStressMpa = momentTransfer.stressDistribution?.maxStressMpa ?? shearStressMpa
  const minShearStressMpa = momentTransfer.stressDistribution?.minStressMpa ?? shearStressMpa
  const designStressMpa = momentTransfer.enabled ? maxShearStressMpa : shearStressMpa
  const utilizationRatio = designStressMpa / draftConcreteResistanceMpa
  const concreteCapacityN =
    draftConcreteResistanceMpa * selectedPerimeter.perimeterMm * selectedPerimeter.effectiveDepthMm
  const designDemandN = designStressMpa * selectedPerimeter.perimeterMm * selectedPerimeter.effectiveDepthMm
  const shearReinforcement = summarizeShearReinforcement(
    normalizedInput.shearReinforcement,
    concreteCapacityN,
    designDemandN,
    selectedPerimeter.perimeterMm,
  )
  const sp63Interaction = calculateSp63MathcadBenchmark(normalizedInput)
  const utilizationTotal =
    shearReinforcement.contributionAccepted && shearReinforcement.utilizationWithReinforcement !== null
      ? shearReinforcement.utilizationWithReinforcement
      : null
  const governingUtilization = utilizationTotal ?? utilizationRatio
  const totalCapacityN =
    shearReinforcement.contributionAccepted && shearReinforcement.draftCapacityWithReinforcementN !== null
      ? shearReinforcement.draftCapacityWithReinforcementN
      : concreteCapacityN
  const passed = governingUtilization <= 1
  const resultStatus = passed ? 'draft_ok' : 'draft_failed'

  return withVerifiedStatus(normalizedInput, {
    ...createBaseResult(normalizedInput, selectedPerimeter, svgModel, momentTransfer, shearReinforcement),
    ...contourBundle,
    status: resultStatus,
    utilization: governingUtilization,
    designShearForceN,
    controlPerimeterMm: selectedPerimeter.perimeterMm,
    effectiveDepthMm: selectedPerimeter.effectiveDepthMm,
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
    shearReinforcement,
    concreteCapacityN,
    shearReinforcementRawCapacityN: shearReinforcement.rawContributionN,
    shearReinforcementEffectiveCapacityN: shearReinforcement.effectiveContributionN,
    totalCapacityN,
    utilizationConcrete: utilizationRatio,
    utilizationTotal,
    governingUtilization,
    resultStatus,
    verificationStatus: 'draft',
    reinforcementAreaMm2: shearReinforcement.reinforcementAreaMm2,
    reinforcementContributionN: shearReinforcement.reinforcementContributionN,
    draftCapacityWithReinforcementN: shearReinforcement.draftCapacityWithReinforcementN,
    utilizationWithReinforcement: shearReinforcement.utilizationWithReinforcement,
    reinforcementWarnings: shearReinforcement.warnings,
    sp63Interaction,
    warnings: [
      ...draftScopeWarnings,
      ...selectedPerimeter.warnings,
      ...momentTransfer.warnings,
      ...contourBundle.contourWarnings,
      ...shearReinforcement.warnings,
      ...(sp63Interaction?.warnings ?? []),
    ],
    placeholders: [
      'moment contribution',
      'openings subtraction',
      'edge and corner behavior',
    ],
  })
}

function buildContourBundle(input: PunchingShearInput) {
  const controlContours = generateControlContours(
    input,
    input.multipleContours ?? {
      enabled: false,
      count: 4,
      offsetStep: 'h0/2',
    },
  )
  const draftCriticalContour = selectDraftCriticalContour(controlContours)
  const selectedContourId = draftCriticalContour?.selectedContourId ?? null
  const contourComparison = compareControlContours(controlContours, selectedContourId)
  const contourWarnings = createContourWarnings(controlContours)

  return {
    controlContours,
    selectedContourId,
    draftCriticalContour,
    contourComparison,
    contourWarnings,
  }
}

function isSupportedDraftGeometryCase(input: PunchingShearInput) {
  const rectangularDraftCase =
    (input.caseType === 'center' ||
      input.caseType === 'edge' ||
      input.caseType === 'corner' ||
      input.caseType === 'opening') &&
    Boolean(input.rectColumn)
  const wallEndDraftCase = input.caseType === 'wall-end' && Boolean(input.wall)
  const wallCornerDraftCase = input.caseType === 'wall-corner' && Boolean(input.wallCorner)
  const roundCenterDraftCase =
    input.caseType === 'round' &&
    Boolean(input.roundColumn) &&
    input.roundColumn?.position === 'center'

  return rectangularDraftCase || wallEndDraftCase || wallCornerDraftCase || roundCenterDraftCase
}

function createInvalidInputResult(input: PunchingShearInput, validationWarnings: string[]) {
  const fallbackInput = {
    ...defaultPunchingShearInput,
    caseType: input.caseType ?? defaultPunchingShearInput.caseType,
  }
  const perimeter = calculateControlPerimeter(fallbackInput)
  const momentTransfer = createDisabledMomentTransfer()
  const contourBundle = buildContourBundle(fallbackInput)
  const svgModel = buildPunchingSketchModel(
    fallbackInput,
    perimeter,
    momentTransfer,
    contourBundle.controlContours,
    contourBundle.selectedContourId,
  )

  return withVerifiedStatus(fallbackInput, {
    ...createBaseResult(fallbackInput, perimeter, svgModel, momentTransfer),
    ...contourBundle,
    status: 'invalid_input',
    warnings: [...draftScopeWarnings, ...validationWarnings],
  } satisfies PunchingShearResult)
}

function createBaseResult(
  input: PunchingShearInput,
  perimeter: ReturnType<typeof calculateControlPerimeter>,
  svgModel: ReturnType<typeof buildPunchingSketchModel>,
  momentTransfer: ReturnType<typeof createDisabledMomentTransfer> | ReturnType<typeof calculateDraftMomentTransfer>,
  shearReinforcement = summarizeShearReinforcement(input.shearReinforcement),
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
    controlContours: [],
    selectedContourId: null,
    draftCriticalContour: null,
    contourComparison: [],
    contourWarnings: [],
    shearReinforcement,
    concreteCapacityN: null,
    shearReinforcementRawCapacityN: shearReinforcement.rawContributionN,
    shearReinforcementEffectiveCapacityN: shearReinforcement.effectiveContributionN,
    totalCapacityN: null,
    utilizationConcrete: null,
    utilizationTotal: null,
    governingUtilization: null,
    resultStatus: 'not_implemented',
    verificationStatus: 'draft',
    reinforcementAreaMm2: shearReinforcement.reinforcementAreaMm2,
    reinforcementContributionN: shearReinforcement.reinforcementContributionN,
    draftCapacityWithReinforcementN: shearReinforcement.draftCapacityWithReinforcementN,
    utilizationWithReinforcement: shearReinforcement.utilizationWithReinforcement,
    reinforcementWarnings: shearReinforcement.warnings,
    svgModel,
    momentTransfer,
    sp63Interaction: null,
    verifiedMode: 'draft',
    verificationLevel: 'draft',
    verifiedFeatures: [],
    draftFeatures: [],
    verificationEvidenceIds: [],
    verificationEvidence: [],
    warnings: [...draftScopeWarnings, ...perimeter.warnings, ...shearReinforcement.warnings],
    placeholders: [
      'utilization',
      'moment contribution',
      'openings subtraction',
    ],
  }
}

function withVerifiedStatus(input: PunchingShearInput, result: PunchingShearResult) {
  const verifiedResult = applyVerifiedStatus(result, buildVerifiedStatus(input, result))

  return sanitizePunchingShearResult({
    ...verifiedResult,
    verificationStatus: verifiedResult.verificationLevel,
  })
}

function sanitizePunchingShearResult(result: PunchingShearResult): PunchingShearResult {
  const nonFinitePaths: string[] = []
  const sanitizedResult = sanitizeNonFiniteValues(result, 'result', nonFinitePaths) as PunchingShearResult

  if (nonFinitePaths.length === 0) {
    return result
  }

  return {
    ...sanitizedResult,
    warnings: [
      ...sanitizedResult.warnings,
      `Non-finite result values were sanitized before export/report generation: ${nonFinitePaths.slice(0, 8).join(', ')}.`,
    ],
  }
}

function sanitizeNonFiniteValues(value: unknown, path: string, nonFinitePaths: string[]): unknown {
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value
    }

    nonFinitePaths.push(path)

    return 0
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeNonFiniteValues(item, `${path}[${index}]`, nonFinitePaths))
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sanitizeNonFiniteValues(item, `${path}.${key}`, nonFinitePaths),
      ]),
    )
  }

  return value
}
