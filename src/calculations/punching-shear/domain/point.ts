export type Point2D = {
  x: number
  y: number
}

export type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function distanceBetweenPoints(start: Point2D, end: Point2D) {
  return Math.hypot(end.x - start.x, end.y - start.y)
}

export function createBoundingBox(points: Point2D[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
