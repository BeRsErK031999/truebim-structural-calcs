import { createBoundingBox, type BoundingBox, type Point2D } from '../domain/point'
import type { PunchingShearInput, WallCornerInput, WallCornerOrientation } from '../types'

export type WallCornerGeometry = {
  input: WallCornerInput
  vertices: Point2D[]
  boundingBox: BoundingBox
  innerCorner: Point2D
  outerCorner: Point2D
  labels: {
    orientation: WallCornerOrientation
    xArm: Point2D
    yArm: Point2D
  }
}

export function createWallCornerInputFromPunchingShearInput(
  input: PunchingShearInput,
): WallCornerInput | null {
  if (!input.wallCorner) {
    return null
  }

  return {
    wallLengthX: input.wallCorner.wallLengthX,
    wallLengthY: input.wallCorner.wallLengthY,
    wallThicknessX: input.wallCorner.wallThicknessX,
    wallThicknessY: input.wallCorner.wallThicknessY,
    slabThickness: input.wallCorner.slabThickness,
    effectiveDepth: input.wallCorner.effectiveDepth,
    cover: input.wallCorner.cover,
    orientation: input.wallCorner.orientation,
  }
}

export function createWallCornerGeometry(wallCorner: WallCornerInput): WallCornerGeometry {
  const baseVertices: Point2D[] = [
    { x: 0, y: 0 },
    { x: wallCorner.wallLengthX, y: 0 },
    { x: wallCorner.wallLengthX, y: wallCorner.wallThicknessX },
    { x: wallCorner.wallThicknessY, y: wallCorner.wallThicknessX },
    { x: wallCorner.wallThicknessY, y: wallCorner.wallLengthY },
    { x: 0, y: wallCorner.wallLengthY },
  ]
  const vertices = transformByOrientation(baseVertices, wallCorner.orientation)
  const xSign = wallCorner.orientation === 'top-right' || wallCorner.orientation === 'bottom-right' ? -1 : 1
  const ySign = wallCorner.orientation === 'bottom-left' || wallCorner.orientation === 'bottom-right' ? -1 : 1

  return {
    input: wallCorner,
    vertices,
    boundingBox: createBoundingBox(vertices),
    innerCorner: { x: 0, y: 0 },
    outerCorner: transformByOrientation(
      [{ x: wallCorner.wallThicknessY, y: wallCorner.wallThicknessX }],
      wallCorner.orientation,
    )[0],
    labels: {
      orientation: wallCorner.orientation,
      xArm: { x: xSign * wallCorner.wallLengthX * 0.55, y: ySign * wallCorner.wallThicknessX * 0.55 },
      yArm: { x: xSign * wallCorner.wallThicknessY * 0.55, y: ySign * wallCorner.wallLengthY * 0.55 },
    },
  }
}

export function transformByOrientation(
  points: Point2D[],
  orientation: WallCornerOrientation,
): Point2D[] {
  const xSign = orientation === 'top-right' || orientation === 'bottom-right' ? -1 : 1
  const ySign = orientation === 'bottom-left' || orientation === 'bottom-right' ? -1 : 1

  return points.map((point) => ({
    x: point.x * xSign,
    y: point.y * ySign,
  }))
}
