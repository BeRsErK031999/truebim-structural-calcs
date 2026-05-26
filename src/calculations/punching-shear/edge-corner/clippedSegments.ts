import { segmentLength } from '../domain/segment'
import type { ControlPerimeterSegment } from '../types'

export function toControlSegments(
  segments: Array<Omit<ControlPerimeterSegment, 'kind' | 'lengthMm'>>,
  source: ControlPerimeterSegment['source'],
) {
  return segments
    .filter((segment) => segmentLength(segment) > 0.001)
    .map<ControlPerimeterSegment>((segment) => ({
      ...segment,
      kind: 'line',
      lengthMm: segmentLength(segment),
      source,
    }))
}

export function sumSegmentLengths(segments: ControlPerimeterSegment[]) {
  return segments.reduce((sum, segment) => sum + segment.lengthMm, 0)
}
