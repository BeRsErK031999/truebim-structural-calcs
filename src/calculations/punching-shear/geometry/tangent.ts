import type { Point2D } from '../domain/point'

export type TangentRay = {
  origin: Point2D
  through: Point2D
  status: 'pending'
}

export function createOpeningTangents(origin: Point2D): TangentRay[] {
  return [
    {
      origin,
      through: origin,
      status: 'pending',
    },
  ]
}
