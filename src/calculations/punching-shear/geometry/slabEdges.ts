import type { SlabEdgesInput } from '../types'

export function summarizeSlabEdges(edges?: SlabEdgesInput) {
  return {
    hasEdges: Boolean(edges && Object.values(edges).some((value) => value !== undefined)),
    warnings: ['Slab edge geometry is not implemented yet'],
  }
}
