import type { Point2D } from '../domain/point'
import type { OpeningInput, OpeningTangent } from '../types'

export type OpeningTangentCone = {
  openingId: string
  minAngleRad: number
  maxAngleRad: number
  tangents: OpeningTangent[]
}

export function constructOpeningTangents(opening: OpeningInput): OpeningTangentCone {
  const corners = getOpeningCorners(opening)
  const angledCorners = corners
    .map((corner) => ({
      point: corner,
      angleRad: normalizeAngle(Math.atan2(corner.y, corner.x)),
    }))
    .sort((left, right) => left.angleRad - right.angleRad)
  const cone = findShortestAngleCone(angledCorners)

  return {
    openingId: opening.id,
    minAngleRad: cone.min.angleRad,
    maxAngleRad: cone.max.angleRad,
    tangents: [
      {
        openingId: opening.id,
        start: { x: 0, y: 0 },
        end: cone.min.point,
        angleRad: cone.min.angleRad,
      },
      {
        openingId: opening.id,
        start: { x: 0, y: 0 },
        end: cone.max.point,
        angleRad: cone.max.angleRad,
      },
    ],
  }
}

export function isAngleInsideCone(angleRad: number, cone: OpeningTangentCone) {
  const angle = normalizeAngle(angleRad)

  if (cone.minAngleRad <= cone.maxAngleRad) {
    return angle >= cone.minAngleRad && angle <= cone.maxAngleRad
  }

  return angle >= cone.minAngleRad || angle <= cone.maxAngleRad
}

function getOpeningCorners(opening: OpeningInput): Point2D[] {
  const minX = opening.centerXMm - opening.widthXMm / 2
  const maxX = opening.centerXMm + opening.widthXMm / 2
  const minY = opening.centerYMm - opening.widthYMm / 2
  const maxY = opening.centerYMm + opening.widthYMm / 2

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
}

function findShortestAngleCone(
  points: Array<{ point: Point2D; angleRad: number }>,
): { min: { point: Point2D; angleRad: number }; max: { point: Point2D; angleRad: number } } {
  let largestGap = -1
  let gapStartIndex = 0

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    const gap = normalizeAngle(next.angleRad - point.angleRad)

    if (gap > largestGap) {
      largestGap = gap
      gapStartIndex = index
    }
  })

  const min = points[(gapStartIndex + 1) % points.length]
  const max = points[gapStartIndex]

  return { min, max }
}

function normalizeAngle(angleRad: number) {
  const fullTurn = Math.PI * 2
  const normalized = angleRad % fullTurn

  return normalized < 0 ? normalized + fullTurn : normalized
}
