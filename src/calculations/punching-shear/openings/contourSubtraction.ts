import type { ControlPerimeterSegment, OpeningInput, OpeningTangent } from '../types'
import { sumSegmentLengths } from '../edge-corner/clippedSegments'
import { classifyOpeningsNearPerimeter } from './openingClassification'
import { isAngleInsideCone, constructOpeningTangents } from './tangentConstruction'

export type OpeningSubtractionResult = {
  activeSegments: ControlPerimeterSegment[]
  removedSegments: ControlPerimeterSegment[]
  openingTangents: OpeningTangent[]
  affectedOpeningIds: string[]
  openingAffected: boolean
  removedPerimeterMm: number
}

export function subtractOpeningsFromContour(
  segments: ControlPerimeterSegment[],
  openings: OpeningInput[],
  influenceRadiusMm: number,
): OpeningSubtractionResult {
  const classifiedOpenings = classifyOpeningsNearPerimeter(openings, influenceRadiusMm)
  const affectedOpenings = classifiedOpenings.filter((opening) => opening.affected)
  const cones = affectedOpenings.map(constructOpeningTangents)
  const activeSegments: ControlPerimeterSegment[] = []
  const removedSegments: ControlPerimeterSegment[] = []

  segments.forEach((segment) => {
    const midpoint = {
      x: (segment.start.x + segment.end.x) / 2,
      y: (segment.start.y + segment.end.y) / 2,
    }
    const midpointAngle = Math.atan2(midpoint.y, midpoint.x)
    const openingCone = cones.find((cone) => isAngleInsideCone(midpointAngle, cone))

    if (openingCone) {
      removedSegments.push({
        ...segment,
        id: `${segment.id}-opening-removed-${openingCone.openingId}`,
        source: 'opening-subtracted',
        removedBy: 'opening',
        openingId: openingCone.openingId,
      })
    } else {
      activeSegments.push(segment)
    }
  })

  return {
    activeSegments,
    removedSegments,
    openingTangents: cones.flatMap((cone) => cone.tangents),
    affectedOpeningIds: affectedOpenings.map((opening) => opening.id),
    openingAffected: affectedOpenings.length > 0,
    removedPerimeterMm: sumSegmentLengths(removedSegments),
  }
}
