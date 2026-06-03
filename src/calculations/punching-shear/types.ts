export type PunchingShearCaseType =
  | 'center'
  | 'edge'
  | 'corner'
  | 'opening'
  | 'round'
  | 'wall-end'
  | 'wall-corner'

import type { ContourLoop } from './domain/contour'
import type { BoundingBox, Point2D } from './domain/point'
import type { Segment2D } from './domain/segment'
import type { PunchingSketchModel } from './sketch/svg'
import type { VerificationEvidence, VerificationLevel, VerifiedFeatureId } from './verified/verifiedMode'
import type {
  ContourComparisonRow,
  ControlContour,
  ControlContourSelectionResult,
} from './contours/controlContour'

export type PunchingShearCheckStatus =
  | 'draft_ok'
  | 'draft_failed'
  | 'not_implemented'
  | 'invalid_input'

export type ForceInput = {
  axialForceKn: number
  momentXKnM: number
  momentYKnM: number
}

export type SlabGeometryInput = {
  thicknessMm: number
  effectiveDepthMm: number
  concreteCoverMm: number
}

export type RectColumnInput = {
  widthXMm: number
  widthYMm: number
}

export type RoundColumnInput = {
  diameterMm: number
}

export type WallInput = {
  wallLength: number
  wallThickness: number
  slabThickness: number
  effectiveDepth: number
  cover: number
}

export type WallCornerOrientation = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type WallCornerInput = {
  wallLengthX: number
  wallLengthY: number
  wallThicknessX: number
  wallThicknessY: number
  slabThickness: number
  effectiveDepth: number
  cover: number
  orientation: WallCornerOrientation
}

export type OpeningInput = {
  id: string
  widthXMm: number
  widthYMm: number
  centerXMm: number
  centerYMm: number
}

export type SlabEdgesInput = {
  leftMm?: number
  rightMm?: number
  topMm?: number
  bottomMm?: number
}

export type ConcreteInput = {
  className: ConcreteClassName
}

export type ShearReinforcementSteelClass = 'A240' | 'A400' | 'A500' | 'B500'

export type ShearReinforcementLayoutType =
  | 'closed-stirrups'
  | 'studs'
  | 'links'
  | 'custom'

export type ShearReinforcementInput = {
  enabled: boolean
  barDiameterMm?: number
  barSpacingMm?: number
  rowCount?: number
  legsPerRow?: number
  steelClass?: ShearReinforcementSteelClass
  firstRowDistanceMm?: number
  rowSpacingMm?: number
  layoutType?: ShearReinforcementLayoutType
  rows?: number
}

export type ShearReinforcementSummary = {
  enabled: boolean
  steelClass: ShearReinforcementSteelClass | null
  layoutType: ShearReinforcementLayoutType | null
  barDiameterMm: number | null
  barSpacingMm: number | null
  rowCount: number
  legsPerRow: number
  totalLegs: number
  firstRowDistanceMm: number | null
  rowSpacingMm: number | null
  reinforcementAreaMm2: number | null
  reinforcementContributionN: number | null
  draftCapacityWithReinforcementN: number | null
  utilizationWithReinforcement: number | null
  warnings: string[]
}

export type MultipleControlContoursInput = {
  enabled: boolean
  count: number
  offsetStep: 'h0/2' | 'h0' | 'custom'
  customOffsetStepMm?: number
}

export type ConcreteClassName = 'B15' | 'B20' | 'B25' | 'B30' | 'B35' | 'B40'

export type ControlPerimeterSegment = Segment2D & {
  kind: 'line' | 'arc'
  lengthMm: number
  source?: 'base' | 'boundary-clipped' | 'opening-subtracted'
  removedBy?: 'boundary' | 'opening'
  openingId?: string
}

export type OpeningTangent = {
  openingId: string
  start: Point2D
  end: Point2D
  angleRad: number
}

export type ClippingMetadata = {
  caseType: PunchingShearCaseType
  slabBox: BoundingBox | null
  originalPerimeterMm: number
  clippedPerimeterMm: number
  removedPerimeterMm: number
  openingAffected: boolean
  edgeAffected: boolean
  cornerAffected: boolean
  affectedOpeningIds: string[]
  boundaryCondition: 'center' | 'edge' | 'corner' | 'unsupported'
}

export type ControlPerimeterResult = {
  perimeterMm: number
  effectiveDepthMm: number
  draftOffsetMm: number
  clippedPerimeterMm: number
  removedPerimeterMm: number
  openingAffected: boolean
  edgeAffected: boolean
  cornerAffected: boolean
  vertices: Point2D[]
  contour: ContourLoop
  segments: ControlPerimeterSegment[]
  removedSegments: ControlPerimeterSegment[]
  openingTangents: OpeningTangent[]
  clippingMetadata: ClippingMetadata
  boundingBox: BoundingBox
  svgPath: string
  warnings: string[]
}

export type StressPoint = {
  id: string
  position: Point2D
  stressMpa: number
  normalizedStress: number
  sourceSegmentId: string
}

export type StressDistribution = {
  status: 'draft'
  points: StressPoint[]
  segmentStresses: Array<{
    segmentId: string
    startStressMpa: number
    endStressMpa: number
    averageStressMpa: number
    normalizedStress: number
  }>
  maxStressMpa: number
  minStressMpa: number
  baseStressMpa: number
  notes: string[]
}

export type MomentTransferResult = {
  status: 'draft' | 'disabled'
  enabled: boolean
  eccentricityX: number
  eccentricityY: number
  momentXKnM: number
  momentYKnM: number
  stressDistribution: StressDistribution | null
  warnings: string[]
  metadata: {
    method: 'draft-linear-perimeter-redistribution'
    formulasVerified: false
    pointCount: number
    segmentCount: number
  }
}

export type PunchingShearInput = {
  caseType: PunchingShearCaseType
  forces: ForceInput
  slab: SlabGeometryInput
  concrete: ConcreteInput
  rectColumn?: RectColumnInput
  roundColumn?: RoundColumnInput
  wall?: WallInput
  wallCorner?: WallCornerInput
  slabEdges?: SlabEdgesInput
  openings: OpeningInput[]
  shearReinforcement: ShearReinforcementInput
  multipleContours?: MultipleControlContoursInput
}

export type PunchingShearResult = {
  status: PunchingShearCheckStatus
  caseType: PunchingShearCaseType
  utilization: number | null
  designShearForceN: number | null
  controlPerimeterMm: number | null
  effectiveDepthMm: number | null
  shearStressMpa: number | null
  eccentricityX: number | null
  eccentricityY: number | null
  maxShearStressMpa: number | null
  minShearStressMpa: number | null
  stressDistribution: StressDistribution | null
  momentTransferEnabled: boolean
  stressDiagramMetadata: MomentTransferResult['metadata'] | null
  draftConcreteResistanceMpa: number | null
  utilizationRatio: number | null
  passed: boolean | null
  material: {
    className: ConcreteClassName
    draftConcreteResistanceMpa: number
  }
  perimeter: ControlPerimeterResult
  controlContours: ControlContour[]
  selectedContourId: string | null
  draftCriticalContour: ControlContourSelectionResult | null
  contourComparison: ContourComparisonRow[]
  contourWarnings: string[]
  shearReinforcement: ShearReinforcementSummary
  reinforcementAreaMm2: number | null
  reinforcementContributionN: number | null
  draftCapacityWithReinforcementN: number | null
  utilizationWithReinforcement: number | null
  reinforcementWarnings: string[]
  svgModel: PunchingSketchModel
  momentTransfer: MomentTransferResult
  verifiedMode: VerificationLevel
  verificationLevel: VerificationLevel
  verifiedFeatures: VerifiedFeatureId[]
  draftFeatures: VerifiedFeatureId[]
  verificationEvidenceIds: string[]
  verificationEvidence: VerificationEvidence[]
  warnings: string[]
  placeholders: string[]
}

export type PunchingShearReportModel = {
  title: string
  standard: string
  caseType: PunchingShearCaseType
  inputSummary: Record<string, string | number | boolean>
  resultSummary: Record<string, string | number | null>
  geometrySummary: Record<string, string | number>
  wallGeometrySummary: Record<string, string | number | boolean>
  wallCornerGeometrySummary: Record<string, string | number | boolean>
  boundaryEffectsSummary: Record<string, string | number | boolean>
  openingsSummary: Record<string, string | number | boolean>
  geometryVerificationSummary: Record<string, string | number | boolean>
  multipleControlPerimetersSummary: Array<Record<string, string | number | boolean | null>>
  shearReinforcementSummary: Record<string, string | number | boolean | null>
  segments: Array<Record<string, string | number>>
  svgMetadata: Record<string, string | number>
  formulaSummary: string[]
  calculationValues: Record<string, string | number | boolean | null>
  momentTransferSummary: Record<string, string | number | boolean | null>
  stressDistributionSummary: Record<string, string | number | boolean | null>
  stressRegressionSummary: Record<string, string | number | boolean | null>
  axisConventionSummary: Record<string, string | number | boolean | null>
  verificationCapabilities: {
    verified: string[]
    draft: string[]
  }
  verificationEvidence: VerificationEvidence[]
  warnings: string[]
  calculationSteps: string[]
}
