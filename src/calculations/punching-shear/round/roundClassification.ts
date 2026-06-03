import type { RoundColumnInput } from '../types'

import { createRoundWarnings } from './roundWarnings'

export type RoundColumnClassification = {
  supported: boolean
  position: RoundColumnInput['position']
  boundaryCondition: 'center' | 'unsupported'
  warnings: string[]
}

export function classifyRoundColumn(roundColumn: RoundColumnInput): RoundColumnClassification {
  const supported = roundColumn.position === 'center'

  return {
    supported,
    position: roundColumn.position,
    boundaryCondition: supported ? 'center' : 'unsupported',
    warnings: createRoundWarnings(roundColumn.position),
  }
}
