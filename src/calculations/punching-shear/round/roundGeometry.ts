import type { Point2D } from '../domain/point'
import type { PunchingShearInput, RoundColumnInput } from '../types'

export type RoundColumnGeometry = {
  input: RoundColumnInput
  center: Point2D
  radiusMm: number
  diameterMm: number
}

export function createRoundColumnInputFromPunchingShearInput(
  input: PunchingShearInput,
): RoundColumnInput | null {
  if (!input.roundColumn) {
    return null
  }

  return {
    diameterMm: input.roundColumn.diameterMm,
    slabThickness: input.roundColumn.slabThickness,
    effectiveDepth: input.roundColumn.effectiveDepth,
    cover: input.roundColumn.cover,
    position: input.roundColumn.position,
  }
}

export function createRoundColumnGeometry(roundColumn: RoundColumnInput): RoundColumnGeometry {
  return {
    input: roundColumn,
    center: { x: 0, y: 0 },
    radiusMm: roundColumn.diameterMm / 2,
    diameterMm: roundColumn.diameterMm,
  }
}

export function createCircleVertices(radiusMm: number, segmentCount: number): Point2D[] {
  return Array.from({ length: segmentCount }, (_, index) => {
    const angle = (Math.PI * 2 * index) / segmentCount

    return {
      x: roundCoordinate(Math.cos(angle) * radiusMm),
      y: roundCoordinate(Math.sin(angle) * radiusMm),
    }
  })
}

function roundCoordinate(value: number) {
  return Math.abs(value) < 0.000001 ? 0 : Number(value.toFixed(6))
}
