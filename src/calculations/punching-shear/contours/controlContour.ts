import type { BoundingBox, Point2D } from '../domain/point'
import type { ControlPerimeterSegment, PunchingShearCaseType } from '../types'

export type ControlContourKind =
  | 'center'
  | 'edge'
  | 'corner'
  | 'opening'
  | 'wall-end'
  | 'wall-corner'

export type ControlContourStatus = 'draft'

export type ControlContourGenerationOptions = {
  enabled: boolean
  count: number
  offsetStep: 'h0/2' | 'h0' | 'custom'
  customOffsetStepMm?: number
}

export type ControlContour = {
  id: string
  index: number
  kind: ControlContourKind
  offsetMm: number
  perimeterMm: number
  effectiveDepthMm: number
  vertices: Point2D[]
  segments: ControlPerimeterSegment[]
  boundingBox: BoundingBox
  warnings: string[]
  status: ControlContourStatus
  draftStressMpa: number | null
  utilization: number | null
}

export type ControlContourSelectionResult = {
  selectedContourId: string
  selectedIndex: number
  criterion: 'max-utilization'
  status: 'draft'
  warning: string
}

export type ContourComparisonRow = {
  contourId: string
  index: number
  offsetMm: number
  perimeterMm: number
  draftStressMpa: number | null
  utilization: number | null
  selected: boolean
  warnings: string[]
}

export function toControlContourKind(caseType: PunchingShearCaseType): ControlContourKind | null {
  if (
    caseType === 'center' ||
    caseType === 'edge' ||
    caseType === 'corner' ||
    caseType === 'opening' ||
    caseType === 'wall-end' ||
    caseType === 'wall-corner'
  ) {
    return caseType
  }

  return null
}
