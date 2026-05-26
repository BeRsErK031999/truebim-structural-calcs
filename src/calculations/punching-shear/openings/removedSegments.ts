import type { ControlPerimeterSegment } from '../types'
import { sumSegmentLengths } from '../edge-corner/clippedSegments'

export function summarizeRemovedSegments(segments: ControlPerimeterSegment[]) {
  return {
    count: segments.length,
    removedPerimeterMm: sumSegmentLengths(segments),
    openingRemovedPerimeterMm: sumSegmentLengths(
      segments.filter((segment) => segment.removedBy === 'opening'),
    ),
    boundaryRemovedPerimeterMm: sumSegmentLengths(
      segments.filter((segment) => segment.removedBy === 'boundary'),
    ),
  }
}
