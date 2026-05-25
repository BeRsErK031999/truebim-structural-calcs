import { createBoundingBox, type BoundingBox, type Point2D } from '../domain/point'

export function createPaddedViewBox(points: Point2D[], paddingMm: number): BoundingBox {
  const box = createBoundingBox(points)

  return {
    minX: box.minX - paddingMm,
    minY: box.minY - paddingMm,
    maxX: box.maxX + paddingMm,
    maxY: box.maxY + paddingMm,
    width: box.width + paddingMm * 2,
    height: box.height + paddingMm * 2,
  }
}

export function viewBoxToString(viewBox: BoundingBox) {
  return `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`
}
