import type { ControlPerimeterResult } from '../types'

export type DraftPerimeterInertia = {
  radiusXSquaredMm2: number
  radiusYSquaredMm2: number
  polarRadiusSquaredMm2: number
}

export function calculateDraftPerimeterInertia(
  perimeter: ControlPerimeterResult,
): DraftPerimeterInertia {
  if (perimeter.segments.length === 0 || perimeter.perimeterMm <= 0) {
    return {
      radiusXSquaredMm2: 1,
      radiusYSquaredMm2: 1,
      polarRadiusSquaredMm2: 2,
    }
  }

  const weighted = perimeter.segments.reduce(
    (accumulator, segment) => {
      const midX = (segment.start.x + segment.end.x) / 2
      const midY = (segment.start.y + segment.end.y) / 2

      return {
        x: accumulator.x + midX * midX * segment.lengthMm,
        y: accumulator.y + midY * midY * segment.lengthMm,
      }
    },
    { x: 0, y: 0 },
  )
  const radiusXSquaredMm2 = Math.max(weighted.x / perimeter.perimeterMm, 1)
  const radiusYSquaredMm2 = Math.max(weighted.y / perimeter.perimeterMm, 1)

  return {
    radiusXSquaredMm2,
    radiusYSquaredMm2,
    polarRadiusSquaredMm2: radiusXSquaredMm2 + radiusYSquaredMm2,
  }
}
