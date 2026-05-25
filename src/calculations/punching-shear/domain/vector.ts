import type { Point2D } from './point'

export type Vector2D = {
  x: number
  y: number
}

export function vectorFromPoints(start: Point2D, end: Point2D): Vector2D {
  return {
    x: end.x - start.x,
    y: end.y - start.y,
  }
}

export function vectorLength(vector: Vector2D) {
  return Math.hypot(vector.x, vector.y)
}
