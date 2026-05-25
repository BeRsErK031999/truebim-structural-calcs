import type { BoundingBox, Point2D } from './point'
import { createBoundingBox } from './point'
import type { Segment2D } from './segment'
import { createClosedSegments } from './segment'

export type ContourLoop = {
  id: string
  vertices: Point2D[]
  segments: Segment2D[]
  boundingBox: BoundingBox
}

export function createContourLoop(id: string, vertices: Point2D[]): ContourLoop {
  return {
    id,
    vertices,
    segments: createClosedSegments(vertices, id),
    boundingBox: createBoundingBox(vertices),
  }
}
