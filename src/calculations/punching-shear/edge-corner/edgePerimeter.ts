import type { PunchingShearInput } from '../types'
import { classifyEdgeCornerCondition } from './edgeClassification'
import { classifySlabBoundary } from './slabBoundary'

export function buildEdgePerimeterContext(input: PunchingShearInput) {
  return {
    classification: classifyEdgeCornerCondition(input.caseType, input.slabEdges),
    boundary: classifySlabBoundary(input.slabEdges),
  }
}
