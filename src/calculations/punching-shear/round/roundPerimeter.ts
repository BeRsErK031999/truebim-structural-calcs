import { createContourLoop } from '../domain/contour'
import { createBoundingBox } from '../domain/point'
import { segmentLength } from '../domain/segment'
import { polygonToPath } from '../sketch/svg'
import type { ControlPerimeterResult, ControlPerimeterSegment, PunchingShearInput } from '../types'

import { classifyRoundColumn } from './roundClassification'
import {
  createCircleVertices,
  createRoundColumnGeometry,
  createRoundColumnInputFromPunchingShearInput,
} from './roundGeometry'

const roundControlPerimeterSegmentCount = 32

type ControlPerimeterOptions = {
  draftOffsetMm?: number
}

export function calculateRoundControlPerimeter(
  input: PunchingShearInput,
  options: ControlPerimeterOptions = {},
): ControlPerimeterResult {
  const roundColumn = createRoundColumnInputFromPunchingShearInput(input)

  if (!roundColumn) {
    return createMissingRoundPerimeter(input)
  }

  const classification = classifyRoundColumn(roundColumn)

  if (!classification.supported) {
    const contour = createContourLoop('round-control-perimeter-unsupported', [])

    return {
      perimeterMm: 0,
      effectiveDepthMm: input.slab.effectiveDepthMm,
      draftOffsetMm: 0,
      clippedPerimeterMm: 0,
      removedPerimeterMm: 0,
      openingAffected: false,
      edgeAffected: roundColumn.position === 'edge',
      cornerAffected: roundColumn.position === 'corner',
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
        edgeAffected: roundColumn.position === 'edge',
        cornerAffected: roundColumn.position === 'corner',
        affectedOpeningIds: [],
        boundaryCondition: 'unsupported',
      },
      boundingBox: contour.boundingBox,
      svgPath: '',
      warnings: classification.warnings,
    }
  }

  const column = createRoundColumnGeometry(roundColumn)
  const draftOffsetMm = options.draftOffsetMm ?? input.slab.effectiveDepthMm / 2
  const controlRadiusMm = column.radiusMm + draftOffsetMm
  const vertices = createCircleVertices(controlRadiusMm, roundControlPerimeterSegmentCount)
  const contour = createContourLoop('round-center-control-perimeter', vertices)
  const segments = createRoundSegments(vertices)
  const perimeterMm = segments.reduce((sum, segment) => sum + segment.lengthMm, 0)
  const boundingBox = createBoundingBox([
    ...vertices,
    ...createCircleVertices(column.radiusMm, roundControlPerimeterSegmentCount),
  ])

  return {
    perimeterMm,
    effectiveDepthMm: input.slab.effectiveDepthMm,
    draftOffsetMm,
    clippedPerimeterMm: perimeterMm,
    removedPerimeterMm: 0,
    openingAffected: false,
    edgeAffected: false,
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
      edgeAffected: false,
      cornerAffected: false,
      affectedOpeningIds: [],
      boundaryCondition: classification.boundaryCondition,
    },
    boundingBox,
    svgPath: polygonToPath(vertices),
    warnings: classification.warnings,
  }
}

export function getRoundControlPerimeterSegmentCount() {
  return roundControlPerimeterSegmentCount
}

function createRoundSegments(vertices: ReturnType<typeof createCircleVertices>): ControlPerimeterSegment[] {
  return vertices.map((start, index) => {
    const end = vertices[(index + 1) % vertices.length]
    const segment = {
      id: `round-control-perimeter-${index + 1}`,
      start,
      end,
    }

    return {
      ...segment,
      kind: 'line',
      lengthMm: segmentLength(segment),
      source: 'base',
    }
  })
}

function createMissingRoundPerimeter(input: PunchingShearInput): ControlPerimeterResult {
  const contour = createContourLoop('round-control-perimeter-missing', [])

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
    warnings: ['Round column input is required for round perimeter geometry.'],
  }
}
