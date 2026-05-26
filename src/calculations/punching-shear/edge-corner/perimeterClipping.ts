import type { BoundingBox, Point2D } from '../domain/point'
import type { ControlPerimeterSegment } from '../types'
import { sumSegmentLengths, toControlSegments } from './clippedSegments'

type ParamInterval = {
  start: number
  end: number
}

export type BoundaryClippingResult = {
  activeSegments: ControlPerimeterSegment[]
  removedSegments: ControlPerimeterSegment[]
  clippedPerimeterMm: number
  removedPerimeterMm: number
}

export function clipSegmentsToSlabBox(
  segments: ControlPerimeterSegment[],
  slabBox: BoundingBox | null,
): BoundaryClippingResult {
  if (!slabBox) {
    return {
      activeSegments: segments,
      removedSegments: [],
      clippedPerimeterMm: sumSegmentLengths(segments),
      removedPerimeterMm: 0,
    }
  }

  const activeSegments: ControlPerimeterSegment[] = []
  const removedSegments: ControlPerimeterSegment[] = []

  segments.forEach((segment) => {
    const activeInterval = getInsideInterval(segment.start, segment.end, slabBox)
    const activePieces = activeInterval ? [intervalToSegment(segment, activeInterval)] : []
    const removedPieces = invertInterval(activeInterval).map((interval) =>
      intervalToSegment(segment, interval),
    )

    activeSegments.push(
      ...toControlSegments(
        activePieces.map((piece, index) => ({
          ...piece,
          id: `${segment.id}-clip-${index + 1}`,
        })),
        'boundary-clipped',
      ),
    )
    removedSegments.push(
      ...toControlSegments(
        removedPieces.map((piece, index) => ({
          ...piece,
          id: `${segment.id}-boundary-removed-${index + 1}`,
          removedBy: 'boundary' as const,
        })),
        'boundary-clipped',
      ).map((piece) => ({ ...piece, removedBy: 'boundary' as const })),
    )
  })

  return {
    activeSegments,
    removedSegments,
    clippedPerimeterMm: sumSegmentLengths(activeSegments),
    removedPerimeterMm: sumSegmentLengths(removedSegments),
  }
}

function getInsideInterval(start: Point2D, end: Point2D, box: BoundingBox): ParamInterval | null {
  let minT = 0
  let maxT = 1
  const dx = end.x - start.x
  const dy = end.y - start.y

  for (const [p, q] of [
    [-dx, start.x - box.minX],
    [dx, box.maxX - start.x],
    [-dy, start.y - box.minY],
    [dy, box.maxY - start.y],
  ] as const) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) {
        return null
      }
      continue
    }

    const t = q / p
    if (p < 0) {
      minT = Math.max(minT, t)
    } else {
      maxT = Math.min(maxT, t)
    }
  }

  return minT <= maxT ? { start: minT, end: maxT } : null
}

function intervalToSegment(
  segment: ControlPerimeterSegment,
  interval: ParamInterval,
): Omit<ControlPerimeterSegment, 'kind' | 'lengthMm'> {
  return {
    id: segment.id,
    start: pointAt(segment.start, segment.end, interval.start),
    end: pointAt(segment.start, segment.end, interval.end),
  }
}

function pointAt(start: Point2D, end: Point2D, t: number): Point2D {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  }
}

function invertInterval(interval: ParamInterval | null): ParamInterval[] {
  if (!interval) {
    return [{ start: 0, end: 1 }]
  }

  return [
    interval.start > 0 ? { start: 0, end: interval.start } : null,
    interval.end < 1 ? { start: interval.end, end: 1 } : null,
  ].filter((item): item is ParamInterval => item !== null)
}
