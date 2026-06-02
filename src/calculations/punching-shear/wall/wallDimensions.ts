import type { WallInput } from '../types'

export type WallDimensions = {
  wallLengthMm: number
  wallThicknessMm: number
  slabThicknessMm: number
  effectiveDepthMm: number
  coverMm: number
  draftOffsetMm: number
}

export function resolveWallDimensions(wall: WallInput): WallDimensions {
  return {
    wallLengthMm: wall.wallLength,
    wallThicknessMm: wall.wallThickness,
    slabThicknessMm: wall.slabThickness,
    effectiveDepthMm: wall.effectiveDepth,
    coverMm: wall.cover,
    draftOffsetMm: wall.effectiveDepth / 2,
  }
}
