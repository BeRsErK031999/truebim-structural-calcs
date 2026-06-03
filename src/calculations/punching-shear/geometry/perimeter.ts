import { createContourLoop } from '../domain/contour'
import {
  createBoundingBoxFromPoints,
  createSafeBoundingBox,
  isFiniteBoundingBox,
} from '../domain/boundingBox'
import type { BoundingBox, Point2D } from '../domain/point'
import { normalizePolygon, polygonPerimeter } from '../domain/polygon'
import { segmentLength } from '../domain/segment'
import { createBoundaryWarnings } from '../edge-corner/boundaryWarnings'
import { classifyEdgeCornerCondition } from '../edge-corner/edgeClassification'
import { clipSegmentsToSlabBox } from '../edge-corner/perimeterClipping'
import { classifySlabBoundary } from '../edge-corner/slabBoundary'
import { sumSegmentLengths } from '../edge-corner/clippedSegments'
import { subtractOpeningsFromContour } from '../openings/contourSubtraction'
import { createOpeningWarnings } from '../openings/openingWarnings'
import { polygonToPath } from '../sketch/svg'
import type { ControlPerimeterResult, ControlPerimeterSegment, PunchingShearInput } from '../types'
import { calculateRoundControlPerimeter } from '../round/roundPerimeter'
import { calculateWallCornerControlPerimeter } from '../wall/wallCornerPerimeter'
import { calculateWallEndControlPerimeter } from '../wall/wallPerimeter'

export type ControlPerimeterOptions = {
  draftOffsetMm?: number
}

export function calculateControlPerimeter(
  input: PunchingShearInput,
  options: ControlPerimeterOptions = {},
): ControlPerimeterResult {
  if (input.caseType === 'wall-end') {
    return calculateWallEndControlPerimeter(input, options)
  }

  if (input.caseType === 'wall-corner') {
    return calculateWallCornerControlPerimeter(input, options)
  }

  if (input.caseType === 'round') {
    return calculateRoundControlPerimeter(input, options)
  }

  if (isRectangularDraftGeometryCase(input)) {
    return calculateRectangularControlPerimeter(input, options)
  }

  const contour = createContourLoop('unsupported-control-perimeter', [])

  return {
    perimeterMm: 0,
    effectiveDepthMm: input.slab.effectiveDepthMm,
    draftOffsetMm: 0,
    clippedPerimeterMm: 0,
    removedPerimeterMm: 0,
    openingAffected: false,
    edgeAffected: false,
    cornerAffected: false,
    vertices: [],
    contour,
    segments: [],
    removedSegments: [],
    openingTangents: [],
    clippingMetadata: {
      caseType: input.caseType,
      slabBox: null,
      originalPerimeterMm: 0,
      clippedPerimeterMm: 0,
      removedPerimeterMm: 0,
      openingAffected: false,
      edgeAffected: false,
      cornerAffected: false,
      affectedOpeningIds: [],
      boundaryCondition: 'unsupported',
    },
    boundingBox: contour.boundingBox,
    svgPath: '',
    warnings: ['Control perimeter geometry is not implemented for this case type'],
  }
}

function calculateRectangularControlPerimeter(
  input: PunchingShearInput,
  options: ControlPerimeterOptions,
): ControlPerimeterResult {
  const rectColumn = input.rectColumn

  if (!rectColumn) {
    throw new Error('Rectangular column input is required for rectangular perimeter')
  }

  const draftOffsetMm = options.draftOffsetMm ?? input.slab.effectiveDepthMm / 2
  const halfWidth = rectColumn.widthXMm / 2 + draftOffsetMm
  const halfHeight = rectColumn.widthYMm / 2 + draftOffsetMm
  const polygon = normalizePolygon({
    id: `${input.caseType}-rectangular-control-perimeter`,
    vertices: createRectangleVertices(halfWidth, halfHeight),
  })
  const contour = createContourLoop(polygon.id, polygon.vertices)
  const baseSegments = contour.segments.map<ControlPerimeterSegment>((segment) => ({
    ...segment,
    kind: 'line',
    lengthMm: segmentLength(segment),
    source: 'base',
  }))
  const originalPerimeterMm = polygonPerimeter(polygon)
  const classification = classifyEdgeCornerCondition(input.caseType, input.slabEdges)
  const boundary = classifySlabBoundary(input.slabEdges)
  const boundaryClipping = clipSegmentsToSlabBox(baseSegments, boundary.slabBox)
  const openingSubtraction = subtractOpeningsFromContour(
    boundaryClipping.activeSegments,
    input.openings,
    Math.max(rectColumn.widthXMm, rectColumn.widthYMm) + input.slab.effectiveDepthMm * 4,
  )
  const segments = openingSubtraction.activeSegments
  const removedSegments = [...boundaryClipping.removedSegments, ...openingSubtraction.removedSegments]
  const vertices = collectSegmentPoints(segments)
  const activeContour = createContourLoop(`${polygon.id}-active`, vertices)
  const fallbackBox = createBoundingBoxFromPoints([
    ...polygon.vertices,
    ...collectSegmentPoints([...baseSegments, ...segments, ...removedSegments]),
  ])
  const safeActiveBox = createSafeBoundingBox(vertices, fallbackBox)
  const boundingBox = safeActiveBox.boundingBox
  const safeSlabBox = createSafeSlabMetadataBox(boundary.slabBox, fallbackBox)
  const perimeterMm = sumSegmentLengths(segments)
  const removedPerimeterMm = sumSegmentLengths(removedSegments)
  const clippedPerimeterMm = boundaryClipping.clippedPerimeterMm

  return {
    perimeterMm,
    effectiveDepthMm: input.slab.effectiveDepthMm,
    draftOffsetMm,
    clippedPerimeterMm,
    removedPerimeterMm,
    openingAffected: openingSubtraction.openingAffected,
    edgeAffected: classification.edgeAffected,
    cornerAffected: classification.cornerAffected,
    vertices,
    contour: activeContour,
    segments,
    removedSegments,
    openingTangents: openingSubtraction.openingTangents,
    clippingMetadata: {
      caseType: input.caseType,
      slabBox: safeSlabBox.boundingBox,
      originalPerimeterMm,
      clippedPerimeterMm,
      removedPerimeterMm,
      openingAffected: openingSubtraction.openingAffected,
      edgeAffected: classification.edgeAffected,
      cornerAffected: classification.cornerAffected,
      affectedOpeningIds: openingSubtraction.affectedOpeningIds,
      boundaryCondition: classification.boundaryCondition,
    },
    boundingBox,
    svgPath: polygonToPath(vertices),
    warnings: [
      'Control perimeter geometry is draft-only; engineering formulas are intentionally disabled',
      'Draft offset uses geometry placeholder values pending SP63 verification',
      ...createBoundaryWarnings(classification),
      ...createOpeningWarnings(openingSubtraction.openingAffected),
      ...safeActiveBox.warnings,
      ...safeSlabBox.warnings,
    ],
  }
}

function isRectangularDraftGeometryCase(input: PunchingShearInput) {
  return (
    Boolean(input.rectColumn) &&
    (input.caseType === 'center' ||
      input.caseType === 'edge' ||
      input.caseType === 'corner' ||
      input.caseType === 'opening')
  )
}

function createRectangleVertices(halfWidth: number, halfHeight: number): Point2D[] {
  return [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ]
}

function collectSegmentPoints(segments: ControlPerimeterSegment[]): Point2D[] {
  const points: Point2D[] = []

  segments.forEach((segment) => {
    addUniquePoint(points, segment.start)
    addUniquePoint(points, segment.end)
  })

  return points
}

function addUniquePoint(points: Point2D[], point: Point2D) {
  const exists = points.some(
    (candidate) => Math.abs(candidate.x - point.x) < 0.001 && Math.abs(candidate.y - point.y) < 0.001,
  )

  if (!exists) {
    points.push(point)
  }
}

function createSafeSlabMetadataBox(
  slabBox: BoundingBox | null,
  fallbackBox: BoundingBox,
) {
  if (!slabBox) {
    return {
      boundingBox: null,
      warnings: [],
    }
  }

  if (isFiniteBoundingBox(slabBox)) {
    return {
      boundingBox: slabBox,
      warnings: [],
    }
  }

  const resolvedBox = {
    minX: Number.isFinite(slabBox.minX) ? slabBox.minX : fallbackBox.minX,
    minY: Number.isFinite(slabBox.minY) ? slabBox.minY : fallbackBox.minY,
    maxX: Number.isFinite(slabBox.maxX) ? slabBox.maxX : fallbackBox.maxX,
    maxY: Number.isFinite(slabBox.maxY) ? slabBox.maxY : fallbackBox.maxY,
  }
  const safeBox = createSafeBoundingBox(
    [
      { x: resolvedBox.minX, y: resolvedBox.minY },
      { x: resolvedBox.maxX, y: resolvedBox.maxY },
    ],
    fallbackBox,
  )

  return {
    boundingBox: safeBox.boundingBox,
    warnings: [
      'Slab boundary metadata used finite fallback extents for unbounded draft clipping sides.',
      ...safeBox.warnings,
    ],
  }
}
