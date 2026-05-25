import { describe, expect, it } from 'vitest'

import { defaultPunchingShearInput } from '../defaults'
import { calculateControlPerimeter } from '../geometry/perimeter'
import { createBoundingBox } from '../domain/point'
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
})
