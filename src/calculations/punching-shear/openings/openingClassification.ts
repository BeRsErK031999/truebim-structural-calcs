import type { OpeningInput } from '../types'

export type ClassifiedOpening = OpeningInput & {
  distanceToColumnCenterMm: number
  affected: boolean
}

export function classifyOpeningsNearPerimeter(
  openings: OpeningInput[],
  influenceRadiusMm: number,
): ClassifiedOpening[] {
  return openings.map((opening) => {
    const nearestX = Math.max(
      opening.centerXMm - opening.widthXMm / 2,
      Math.min(0, opening.centerXMm + opening.widthXMm / 2),
    )
    const nearestY = Math.max(
      opening.centerYMm - opening.widthYMm / 2,
      Math.min(0, opening.centerYMm + opening.widthYMm / 2),
    )
    const distanceToColumnCenterMm = Math.hypot(nearestX, nearestY)

    return {
      ...opening,
      distanceToColumnCenterMm,
      affected: distanceToColumnCenterMm <= influenceRadiusMm,
    }
  })
}
