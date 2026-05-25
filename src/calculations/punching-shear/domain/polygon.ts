import { createClosedSegments, segmentLength } from './segment'
import type { Point2D } from './point'

export type Polygon2D = {
  id: string
  vertices: Point2D[]
}

export function polygonPerimeter(polygon: Polygon2D) {
  return createClosedSegments(polygon.vertices, polygon.id).reduce(
    (sum, segment) => sum + segmentLength(segment),
    0,
  )
}

export function polygonArea(polygon: Polygon2D) {
  const signedArea = signedPolygonArea(polygon.vertices)

  return Math.abs(signedArea)
}

export function isClockwise(polygon: Polygon2D) {
  return signedPolygonArea(polygon.vertices) < 0
}

export function normalizePolygon(polygon: Polygon2D): Polygon2D {
  return isClockwise(polygon)
    ? {
        ...polygon,
        vertices: [...polygon.vertices].reverse(),
      }
    : {
        ...polygon,
        vertices: [...polygon.vertices],
      }
}

function signedPolygonArea(vertices: Point2D[]) {
  if (vertices.length < 3) {
    return 0
  }

  const doubledArea = vertices.reduce((sum, point, index) => {
    const nextPoint = vertices[(index + 1) % vertices.length]

    return sum + point.x * nextPoint.y - nextPoint.x * point.y
  }, 0)

  return doubledArea / 2
}
