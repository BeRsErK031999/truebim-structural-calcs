import type { Point2D } from '../domain/point'
import type { PunchingShearInput, WallInput } from '../types'

export type WallGeometry = {
  input: WallInput
  vertices: Point2D[]
  endFace: {
    start: Point2D
    end: Point2D
  }
}

export function createWallInputFromPunchingShearInput(input: PunchingShearInput): WallInput | null {
  if (!input.wall) {
    return null
  }

  return {
    wallLength: input.wall.wallLength,
    wallThickness: input.wall.wallThickness,
    slabThickness: input.wall.slabThickness,
    effectiveDepth: input.wall.effectiveDepth,
    cover: input.wall.cover,
  }
}

export function createWallGeometry(wall: WallInput): WallGeometry {
  const halfThickness = wall.wallThickness / 2

  return {
    input: wall,
    vertices: [
      { x: 0, y: -halfThickness },
      { x: wall.wallLength, y: -halfThickness },
      { x: wall.wallLength, y: halfThickness },
      { x: 0, y: halfThickness },
    ],
    endFace: {
      start: { x: 0, y: -halfThickness },
      end: { x: 0, y: halfThickness },
    },
  }
}
