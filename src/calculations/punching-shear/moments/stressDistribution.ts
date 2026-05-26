import type {
  ControlPerimeterResult,
  StressDistribution,
  StressPoint,
} from '../types'

import type { EccentricityResult } from './eccentricity'
import { draftMomentNotes } from './momentWarnings'
import { calculateDraftPerimeterInertia } from './polarInertia'
import { calculateDraftTransferFactors } from './transferFactors'

export function calculateDraftStressDistribution({
  perimeter,
  baseStressMpa,
  eccentricity,
}: {
  perimeter: ControlPerimeterResult
  baseStressMpa: number
  eccentricity: EccentricityResult
}): StressDistribution {
  const inertia = calculateDraftPerimeterInertia(perimeter)
  const transferFactors = calculateDraftTransferFactors(inertia)
  const points = createStressPoints(perimeter, baseStressMpa, eccentricity, transferFactors)
  const stressValues = points.map((point) => point.stressMpa)
  const maxStressMpa = Math.max(...stressValues, baseStressMpa)
  const minStressMpa = Math.min(...stressValues, baseStressMpa)
  const range = Math.max(maxStressMpa - minStressMpa, Number.EPSILON)
  const normalizedPoints = points.map((point) => ({
    ...point,
    normalizedStress: (point.stressMpa - minStressMpa) / range,
  }))
  const pointByKey = new Map(normalizedPoints.map((point) => [point.id, point]))

  return {
    status: 'draft',
    points: normalizedPoints,
    segmentStresses: perimeter.segments.map((segment) => {
      const startStressMpa =
        pointByKey.get(`${segment.id}-start`)?.stressMpa ??
        calculatePointStress(segment.start.x, segment.start.y, baseStressMpa, eccentricity, transferFactors)
      const endStressMpa =
        pointByKey.get(`${segment.id}-end`)?.stressMpa ??
        calculatePointStress(segment.end.x, segment.end.y, baseStressMpa, eccentricity, transferFactors)
      const averageStressMpa = (startStressMpa + endStressMpa) / 2

      return {
        segmentId: segment.id,
        startStressMpa,
        endStressMpa,
        averageStressMpa,
        normalizedStress: (averageStressMpa - minStressMpa) / range,
      }
    }),
    maxStressMpa,
    minStressMpa,
    baseStressMpa,
    notes: draftMomentNotes,
  }
}

function createStressPoints(
  perimeter: ControlPerimeterResult,
  baseStressMpa: number,
  eccentricity: EccentricityResult,
  transferFactors: { factorX: number; factorY: number },
): StressPoint[] {
  return perimeter.segments.flatMap((segment) => {
    const midpoint = {
      x: (segment.start.x + segment.end.x) / 2,
      y: (segment.start.y + segment.end.y) / 2,
    }

    return [
      {
        id: `${segment.id}-start`,
        position: segment.start,
        stressMpa: calculatePointStress(
          segment.start.x,
          segment.start.y,
          baseStressMpa,
          eccentricity,
          transferFactors,
        ),
        normalizedStress: 0,
        sourceSegmentId: segment.id,
      },
      {
        id: `${segment.id}-mid`,
        position: midpoint,
        stressMpa: calculatePointStress(
          midpoint.x,
          midpoint.y,
          baseStressMpa,
          eccentricity,
          transferFactors,
        ),
        normalizedStress: 0,
        sourceSegmentId: segment.id,
      },
      {
        id: `${segment.id}-end`,
        position: segment.end,
        stressMpa: calculatePointStress(
          segment.end.x,
          segment.end.y,
          baseStressMpa,
          eccentricity,
          transferFactors,
        ),
        normalizedStress: 0,
        sourceSegmentId: segment.id,
      },
    ]
  })
}

function calculatePointStress(
  x: number,
  y: number,
  baseStressMpa: number,
  eccentricity: EccentricityResult,
  transferFactors: { factorX: number; factorY: number },
) {
  const draftMultiplier =
    1 + eccentricity.eccentricityX * x * transferFactors.factorX +
    eccentricity.eccentricityY * y * transferFactors.factorY

  return baseStressMpa * draftMultiplier
}
