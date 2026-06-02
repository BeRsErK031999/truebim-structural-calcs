import { createContourLoop } from '../domain/contour'
import { createBoundingBox, type Point2D } from '../domain/point'
import { segmentLength } from '../domain/segment'
import { polygonToPath } from '../sketch/svg'
import type { ControlPerimeterResult, ControlPerimeterSegment, PunchingShearInput } from '../types'

import { classifyWallPunching } from './wallClassification'
import { resolveWallDimensions } from './wallDimensions'
import { createWallGeometry, createWallInputFromPunchingShearInput } from './wallGeometry'

export function calculateWallEndControlPerimeter(input: PunchingShearInput): ControlPerimeterResult {
  const wallInput = createWallInputFromPunchingShearInput(input)
  const classification = classifyWallPunching(input)

  if (!wallInput) {
    const contour = createContourLoop('wall-end-control-perimeter-missing', [])

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
      warnings: classification.warnings,
    }
  }

  const wall = createWallGeometry(wallInput)
  const dimensions = resolveWallDimensions(wallInput)
  const offset = dimensions.draftOffsetMm
  const halfThickness = dimensions.wallThicknessMm / 2
  const endZoneDepth = Math.min(dimensions.wallLengthMm, offset)
  const vertices: Point2D[] = [
    { x: endZoneDepth, y: -halfThickness - offset },
    { x: -offset, y: -halfThickness - offset },
    { x: -offset, y: halfThickness + offset },
    { x: endZoneDepth, y: halfThickness + offset },
  ]
  const segments = createWallSegments(vertices)
  const perimeterMm = segments.reduce((sum, segment) => sum + segment.lengthMm, 0)
  const contour = createContourLoop('wall-end-control-perimeter', vertices)
  const boundingBox = createBoundingBox([...vertices, ...wall.vertices])

  return {
    perimeterMm,
    effectiveDepthMm: dimensions.effectiveDepthMm,
    draftOffsetMm: offset,
    clippedPerimeterMm: perimeterMm,
    removedPerimeterMm: 0,
    openingAffected: false,
    edgeAffected: true,
    cornerAffected: false,
    vertices,
    contour,
    segments,
    removedSegments: [],
    openingTangents: [],
    clippingMetadata: {
      caseType: input.caseType,
      slabBox: null,
      originalPerimeterMm: perimeterMm,
      clippedPerimeterMm: perimeterMm,
      removedPerimeterMm: 0,
      openingAffected: false,
      edgeAffected: true,
      cornerAffected: false,
      affectedOpeningIds: [],
      boundaryCondition: 'edge',
    },
    boundingBox,
    svgPath: polygonToPath(vertices),
    warnings: [
      ...classification.warnings,
      'Wall-end draft offset uses effectiveDepth / 2 only for geometry preparation',
      'No SP63 wall punching coefficients or verified resistance formulas are applied',
    ],
  }
}

function createWallSegments(vertices: Point2D[]): ControlPerimeterSegment[] {
  return vertices.slice(0, -1).map((point, index) => {
    const segment = {
      id: `wall-end-control-perimeter-${index + 1}`,
      start: point,
      end: vertices[index + 1],
    }

    return {
      ...segment,
      kind: 'line',
      lengthMm: segmentLength(segment),
      source: 'base',
    }
  })
}
