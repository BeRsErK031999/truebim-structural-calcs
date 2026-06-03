import { describe, expect, it } from 'vitest'

import { defaultPunchingShearInput } from '../defaults'
import { createSafeBoundingBox, isFiniteBoundingBox } from '../domain/boundingBox'
import { calculateControlPerimeter } from '../geometry/perimeter'
import { getRoundControlPerimeterSegmentCount } from '../round/roundPerimeter'
import { createBoundingBox } from '../domain/point'
import { classifyEdgeCornerCondition } from '../edge-corner/edgeClassification'
import { clipSegmentsToSlabBox } from '../edge-corner/perimeterClipping'
import { classifyOpeningsNearPerimeter } from '../openings/openingClassification'
import { subtractOpeningsFromContour } from '../openings/contourSubtraction'
import { constructOpeningTangents } from '../openings/tangentConstruction'
import {
  isClockwise,
  normalizePolygon,
  polygonArea,
  polygonPerimeter,
  type Polygon2D,
} from '../domain/polygon'

const rectangle: Polygon2D = {
  id: 'test-rectangle',
  vertices: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 50 },
  ],
}

describe('geometry primitives', () => {
  it('calculates rectangle perimeter', () => {
    expect(polygonPerimeter(rectangle)).toBe(300)
  })

  it('calculates rectangle area', () => {
    expect(polygonArea(rectangle)).toBe(5000)
  })

  it('normalizes clockwise polygon orientation', () => {
    const clockwisePolygon: Polygon2D = {
      ...rectangle,
      vertices: [...rectangle.vertices].reverse(),
    }

    expect(isClockwise(clockwisePolygon)).toBe(true)
    expect(isClockwise(normalizePolygon(clockwisePolygon))).toBe(false)
  })

  it('generates center rectangular control perimeter segments', () => {
    const perimeter = calculateControlPerimeter(defaultPunchingShearInput)

    expect(perimeter.segments).toHaveLength(4)
    expect(perimeter.vertices).toHaveLength(4)
    expect(perimeter.perimeterMm).toBeGreaterThan(0)
  })

  it('generates round center control perimeter with stable segment count', () => {
    const perimeter = calculateControlPerimeter({
      ...defaultPunchingShearInput,
      caseType: 'round',
      roundColumn: {
        diameterMm: 400,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
        position: 'center',
      },
    })

    expect(perimeter.segments).toHaveLength(getRoundControlPerimeterSegmentCount())
    expect(perimeter.vertices).toHaveLength(getRoundControlPerimeterSegmentCount())
    expect(perimeter.perimeterMm).toBeGreaterThan(0)
    expect(perimeter.svgPath).toContain('M')
    expect(perimeter.warnings).toContain(
      'Round column perimeter is draft-only and requires SP63 verification.',
    )
  })

  it('generates bounding boxes from points', () => {
    const boundingBox = createBoundingBox(rectangle.vertices)

    expect(boundingBox).toMatchObject({
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 50,
      width: 100,
      height: 50,
    })
  })

  it('uses a finite fallback for empty safe bounding box input', () => {
    const fallback = createBoundingBox(rectangle.vertices)
    const safeBox = createSafeBoundingBox([], fallback)

    expect(safeBox.boundingBox).toEqual(fallback)
    expect(isFiniteBoundingBox(safeBox.boundingBox)).toBe(true)
    expect(safeBox.warnings).toContain(
      'Bounding box used finite fallback because no finite points were available.',
    )
  })

  it('classifies edge and corner boundary conditions', () => {
    expect(classifyEdgeCornerCondition('edge', { leftMm: 0 })).toMatchObject({
      boundaryCondition: 'edge',
      edgeAffected: true,
      cornerAffected: false,
    })
    expect(classifyEdgeCornerCondition('corner', { leftMm: 0, topMm: 0 })).toMatchObject({
      boundaryCondition: 'corner',
      edgeAffected: true,
      cornerAffected: true,
    })
  })

  it('keeps edge clipping metadata slabBox finite for pilot edge-01 geometry', () => {
    const perimeter = calculateControlPerimeter({
      ...defaultPunchingShearInput,
      caseType: 'edge',
      forces: {
        axialForceKn: 320,
        momentXKnM: 0,
        momentYKnM: 0,
      },
      slab: {
        thicknessMm: 200,
        effectiveDepthMm: 170,
        concreteCoverMm: 30,
      },
      concrete: {
        className: 'B20',
      },
      rectColumn: {
        widthXMm: 300,
        widthYMm: 350,
      },
      slabEdges: {
        leftMm: 160,
      },
    })

    expect(isFiniteBoundingBox(perimeter.clippingMetadata.slabBox)).toBe(true)
    expect(findNonFinitePaths(perimeter)).toEqual([])
    expect(perimeter.warnings).toContain(
      'Slab boundary metadata used finite fallback extents for unbounded draft clipping sides.',
    )
  })

  it('keeps corner clipping metadata slabBox finite for pilot corner-01 geometry', () => {
    const perimeter = calculateControlPerimeter({
      ...defaultPunchingShearInput,
      caseType: 'corner',
      forces: {
        axialForceKn: 320,
        momentXKnM: 0,
        momentYKnM: 0,
      },
      slab: {
        thicknessMm: 200,
        effectiveDepthMm: 170,
        concreteCoverMm: 30,
      },
      concrete: {
        className: 'B20',
      },
      rectColumn: {
        widthXMm: 300,
        widthYMm: 350,
      },
      slabEdges: {
        leftMm: 150,
        topMm: 150,
      },
    })

    expect(isFiniteBoundingBox(perimeter.clippingMetadata.slabBox)).toBe(true)
    expect(findNonFinitePaths(perimeter)).toEqual([])
    expect(perimeter.warnings).toContain(
      'Slab boundary metadata used finite fallback extents for unbounded draft clipping sides.',
    )
  })

  it('clips rectangular perimeter against slab boundary', () => {
    const perimeter = calculateControlPerimeter(defaultPunchingShearInput)
    const clipped = clipSegmentsToSlabBox(perimeter.segments, {
      minX: 0,
      maxX: Number.POSITIVE_INFINITY,
      minY: Number.NEGATIVE_INFINITY,
      maxY: Number.POSITIVE_INFINITY,
      width: Number.POSITIVE_INFINITY,
      height: Number.POSITIVE_INFINITY,
    })

    expect(clipped.clippedPerimeterMm).toBe(1180)
    expect(clipped.removedPerimeterMm).toBe(1180)
  })

  it('subtracts opening tangent affected segments', () => {
    const perimeter = calculateControlPerimeter(defaultPunchingShearInput)
    const subtraction = subtractOpeningsFromContour(
      perimeter.segments,
      [
        {
          id: 'opening-1',
          widthXMm: 200,
          widthYMm: 300,
          centerXMm: 600,
          centerYMm: 0,
        },
      ],
      1160,
    )

    expect(subtraction.openingAffected).toBe(true)
    expect(subtraction.activeSegments).toHaveLength(3)
    expect(subtraction.removedSegments).toHaveLength(1)
    expect(subtraction.removedPerimeterMm).toBe(590)
  })

  it('constructs opening tangent geometry', () => {
    const tangents = constructOpeningTangents({
      id: 'opening-1',
      widthXMm: 200,
      widthYMm: 300,
      centerXMm: 600,
      centerYMm: 0,
    })

    expect(tangents.tangents).toHaveLength(2)
    expect(tangents.tangents.every((tangent) => tangent.openingId === 'opening-1')).toBe(true)
  })

  it('classifies openings near the perimeter', () => {
    const [opening] = classifyOpeningsNearPerimeter(
      [
        {
          id: 'opening-1',
          widthXMm: 200,
          widthYMm: 300,
          centerXMm: 600,
          centerYMm: 0,
        },
      ],
      1160,
    )

    expect(opening.affected).toBe(true)
  })

  it('keeps verified center perimeter arithmetic unchanged', () => {
    const perimeter = calculateControlPerimeter(defaultPunchingShearInput)

    expect(perimeter.perimeterMm).toBe(2360)
    expect(perimeter.removedPerimeterMm).toBe(0)
    expect(perimeter.segments).toHaveLength(4)
  })
})

function findNonFinitePaths(value: unknown, path = 'value'): string[] {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? [] : [path]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findNonFinitePaths(item, `${path}[${index}]`))
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => findNonFinitePaths(item, `${path}.${key}`))
  }

  return []
}
