import { createBoundingBox, type BoundingBox, type Point2D } from './point'

export type SafeBoundingBoxResult = {
  boundingBox: BoundingBox
  warnings: string[]
}

export function createBoundingBoxFromPoints(points: Point2D[]): BoundingBox {
  const finitePoints = points.filter(isFinitePoint)

  return createBoundingBox(finitePoints)
}

export function createSafeBoundingBox(
  points: Point2D[],
  fallback: BoundingBox,
): SafeBoundingBoxResult {
  const finiteFallback = isFiniteBoundingBox(fallback) ? fallback : createBoundingBox([])
  const finitePoints = points.filter(isFinitePoint)

  if (finitePoints.length === 0) {
    return {
      boundingBox: finiteFallback,
      warnings: ['Bounding box used finite fallback because no finite points were available.'],
    }
  }

  const boundingBox = createBoundingBox(finitePoints)

  if (!isFiniteBoundingBox(boundingBox)) {
    return {
      boundingBox: finiteFallback,
      warnings: ['Bounding box used finite fallback because generated bounds were non-finite.'],
    }
  }

  return {
    boundingBox,
    warnings: [],
  }
}

export function isFiniteBoundingBox(box: BoundingBox | null | undefined): boolean {
  return box !== null && box !== undefined && Object.values(box).every(Number.isFinite)
}

function isFinitePoint(point: Point2D) {
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}
