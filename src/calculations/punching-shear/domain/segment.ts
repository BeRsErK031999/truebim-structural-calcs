import { distanceBetweenPoints, type Point2D } from './point'

export type Segment2D = {
  id: string
  start: Point2D
  end: Point2D
}

export function segmentLength(segment: Segment2D) {
  return distanceBetweenPoints(segment.start, segment.end)
}

export function createClosedSegments(points: Point2D[], idPrefix: string): Segment2D[] {
  return points.map((point, index) => ({
    id: `${idPrefix}-${index + 1}`,
    start: point,
    end: points[(index + 1) % points.length],
  }))
}
