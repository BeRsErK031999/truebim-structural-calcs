import { createBoundingBox, type BoundingBox } from '../domain/point'
import type { SlabEdgesInput } from '../types'

export type SlabBoundary = {
  slabBox: BoundingBox | null
  activeEdges: Array<'left' | 'right' | 'top' | 'bottom'>
}

export function classifySlabBoundary(slabEdges?: SlabEdgesInput): SlabBoundary {
  if (!slabEdges) {
    return {
      slabBox: null,
      activeEdges: [],
    }
  }

  const minX = slabEdges.leftMm === undefined ? Number.NEGATIVE_INFINITY : -slabEdges.leftMm
  const maxX = slabEdges.rightMm === undefined ? Number.POSITIVE_INFINITY : slabEdges.rightMm
  const minY = slabEdges.topMm === undefined ? Number.NEGATIVE_INFINITY : -slabEdges.topMm
  const maxY = slabEdges.bottomMm === undefined ? Number.POSITIVE_INFINITY : slabEdges.bottomMm
  const finitePoints = [
    { x: Number.isFinite(minX) ? minX : -5000, y: Number.isFinite(minY) ? minY : -5000 },
    { x: Number.isFinite(maxX) ? maxX : 5000, y: Number.isFinite(maxY) ? maxY : 5000 },
  ]

  return {
    slabBox: {
      ...createBoundingBox(finitePoints),
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
    activeEdges: [
      slabEdges.leftMm === undefined ? null : 'left',
      slabEdges.rightMm === undefined ? null : 'right',
      slabEdges.topMm === undefined ? null : 'top',
      slabEdges.bottomMm === undefined ? null : 'bottom',
    ].filter((edge): edge is 'left' | 'right' | 'top' | 'bottom' => edge !== null),
  }
}
