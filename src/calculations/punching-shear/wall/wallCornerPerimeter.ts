import { createContourLoop } from '../domain/contour'
import { createBoundingBox, type Point2D } from '../domain/point'
import { segmentLength } from '../domain/segment'
import { polygonToPath } from '../sketch/svg'
import type { ControlPerimeterResult, ControlPerimeterSegment, PunchingShearInput } from '../types'

import { classifyWallCornerPunching } from './wallCornerClassification'
import {
  createWallCornerGeometry,
  createWallCornerInputFromPunchingShearInput,
  transformByOrientation,
} from './wallCornerGeometry'

export function calculateWallCornerControlPerimeter(
  input: PunchingShearInput,
): ControlPerimeterResult {
  const wallCornerInput = createWallCornerInputFromPunchingShearInput(input)
  const classification = classifyWallCornerPunching(input)

  if (!wallCornerInput) {
    const contour = createContourLoop('wall-corner-control-perimeter-missing', [])

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

  const wallCorner = createWallCornerGeometry(wallCornerInput)
  const offset = wallCornerInput.effectiveDepth / 2
  const baseVertices: Point2D[] = [
    { x: -offset, y: -offset },
    { x: wallCornerInput.wallLengthX + offset, y: -offset },
    { x: wallCornerInput.wallLengthX + offset, y: wallCornerInput.wallThicknessX + offset },
    { x: wallCornerInput.wallThicknessY + offset, y: wallCornerInput.wallThicknessX + offset },
    { x: wallCornerInput.wallThicknessY + offset, y: wallCornerInput.wallLengthY + offset },
    { x: -offset, y: wallCornerInput.wallLengthY + offset },
  ]
  const vertices = transformByOrientation(baseVertices, wallCornerInput.orientation)
  const segments = createWallCornerSegments(vertices)
  const perimeterMm = segments.reduce((sum, segment) => sum + segment.lengthMm, 0)
  const contour = createContourLoop('wall-corner-control-perimeter', vertices)
  const boundingBox = createBoundingBox([...vertices, ...wallCorner.vertices])

  return {
    perimeterMm,
    effectiveDepthMm: wallCornerInput.effectiveDepth,
    draftOffsetMm: offset,
    clippedPerimeterMm: perimeterMm,
    removedPerimeterMm: 0,
    openingAffected: false,
    edgeAffected: true,
    cornerAffected: true,
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
      cornerAffected: true,
      affectedOpeningIds: [],
      boundaryCondition: 'corner',
    },
    boundingBox,
    svgPath: polygonToPath(vertices),
    warnings: [
      ...classification.warnings,
      'Wall-corner draft offset uses effectiveDepth / 2 only for geometry preparation',
      'No SP63 wall-corner punching coefficients or verified resistance formulas are applied',
    ],
  }
}

function createWallCornerSegments(vertices: Point2D[]): ControlPerimeterSegment[] {
  return vertices.map((point, index) => {
    const nextPoint = vertices[(index + 1) % vertices.length]
    const segment = {
      id: `wall-corner-control-perimeter-${index + 1}`,
      start: point,
      end: nextPoint,
    }

    return {
      ...segment,
      kind: 'line',
      lengthMm: segmentLength(segment),
      source: 'base',
    }
  })
}
