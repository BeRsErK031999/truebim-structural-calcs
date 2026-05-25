export type PunchingShearCaseType = 'center' | 'edge' | 'corner' | 'opening' | 'round'

import type { ContourLoop } from './domain/contour'
import type { BoundingBox, Point2D } from './domain/point'
import type { Segment2D } from './domain/segment'
import type { PunchingSketchModel } from './sketch/svg'

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

export type ShearReinforcementInput = {
  enabled: boolean
  barDiameterMm?: number
  barSpacingMm?: number
  rows?: number
}

export type ConcreteClassName = 'B15' | 'B20' | 'B25' | 'B30' | 'B35' | 'B40'

export type ControlPerimeterSegment = Segment2D & {
  kind: 'line' | 'arc'
  lengthMm: number
}

export type ControlPerimeterResult = {
  perimeterMm: number
  effectiveDepthMm: number
  draftOffsetMm: number
  vertices: Point2D[]
  contour: ContourLoop
  segments: ControlPerimeterSegment[]
  boundingBox: BoundingBox
  svgPath: string
  warnings: string[]
}

export type PunchingShearInput = {
  caseType: PunchingShearCaseType
  forces: ForceInput
  slab: SlabGeometryInput
  concrete: ConcreteInput
  rectColumn?: RectColumnInput
  roundColumn?: RoundColumnInput
  slabEdges?: SlabEdgesInput
  openings: OpeningInput[]
  shearReinforcement: ShearReinforcementInput
}

export type PunchingShearResult = {
  status: PunchingShearCheckStatus
  caseType: PunchingShearCaseType
  utilization: number | null
  designShearForceN: number | null
  controlPerimeterMm: number | null
  effectiveDepthMm: number | null
  shearStressMpa: number | null
  draftConcreteResistanceMpa: number | null
  utilizationRatio: number | null
  passed: boolean | null
  material: {
    className: ConcreteClassName
    draftConcreteResistanceMpa: number
  }
  perimeter: ControlPerimeterResult
  svgModel: PunchingSketchModel
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
  segments: Array<Record<string, string | number>>
  svgMetadata: Record<string, string | number>
  formulaSummary: string[]
  calculationValues: Record<string, string | number | boolean | null>
  warnings: string[]
  calculationSteps: string[]
}
