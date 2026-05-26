import type { PunchingShearInput } from '../types'
import { buildEdgePerimeterContext } from './edgePerimeter'

export function buildCornerPerimeterContext(input: PunchingShearInput) {
  return buildEdgePerimeterContext(input)
}
