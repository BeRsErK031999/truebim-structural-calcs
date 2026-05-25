import { createContourLoop } from '../domain/contour'
import type { Point2D } from '../domain/point'
import { normalizePolygon, polygonPerimeter } from '../domain/polygon'
import { segmentLength } from '../domain/segment'
import { polygonToPath } from '../sketch/svg'
import type { ControlPerimeterResult, ControlPerimeterSegment, PunchingShearInput } from '../types'

export function calculateControlPerimeter(input: PunchingShearInput): ControlPerimeterResult {
  if (input.caseType === 'center' && input.rectColumn) {
    return calculateCenterRectangularControlPerimeter(input)
  }

  const contour = createContourLoop('unsupported-control-perimeter', [])

  return {
    perimeterMm: 0,
    effectiveDepthMm: input.slab.effectiveDepthMm,
    draftOffsetMm: 0,
    vertices: [],
    contour,
    segments: [],
    boundingBox: contour.boundingBox,
    svgPath: '',
    warnings: ['Control perimeter geometry is not implemented for this case type'],
  }
}

function calculateCenterRectangularControlPerimeter(
  input: PunchingShearInput,
): ControlPerimeterResult {
  const rectColumn = input.rectColumn

  if (!rectColumn) {
    throw new Error('Rectangular column input is required for center rectangular perimeter')
  }

  const draftOffsetMm = input.slab.effectiveDepthMm / 2
  const halfWidth = rectColumn.widthXMm / 2 + draftOffsetMm
  const halfHeight = rectColumn.widthYMm / 2 + draftOffsetMm
  const polygon = normalizePolygon({
    id: 'center-rectangular-control-perimeter',
    vertices: createRectangleVertices(halfWidth, halfHeight),
  })
  const contour = createContourLoop(polygon.id, polygon.vertices)
  const segments = contour.segments.map<ControlPerimeterSegment>((segment) => ({
    ...segment,
    kind: 'line',
    lengthMm: segmentLength(segment),
  }))

  return {
    perimeterMm: polygonPerimeter(polygon),
    effectiveDepthMm: input.slab.effectiveDepthMm,
    draftOffsetMm,
    vertices: polygon.vertices,
    contour,
    segments,
    boundingBox: contour.boundingBox,
    svgPath: polygonToPath(polygon.vertices),
    warnings: [
      'Control perimeter geometry is draft-only; engineering formulas are intentionally disabled',
      'Draft offset uses effectiveDepthMm / 2 as a geometry placeholder pending СП63 verification',
    ],
  }
}

function createRectangleVertices(halfWidth: number, halfHeight: number): Point2D[] {
  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ]
}
