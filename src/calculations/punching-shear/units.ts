import type { PunchingShearInput } from './types'

export function cmToMm(value: number) {
  return value * 10
}

export function mmToCm(value: number) {
  return value / 10
}

export function knToN(value: number) {
  return value * 1000
}

export function nToKn(value: number) {
  return value / 1000
}

export function normalizePunchingShearInput(input: PunchingShearInput): PunchingShearInput {
  return {
    ...input,
    forces: { ...input.forces },
    slab: { ...input.slab },
    concrete: { ...input.concrete },
    rectColumn: input.rectColumn ? { ...input.rectColumn } : undefined,
    roundColumn: input.roundColumn ? { ...input.roundColumn } : undefined,
    slabEdges: input.slabEdges ? { ...input.slabEdges } : undefined,
    openings: input.openings.map((opening) => ({ ...opening })),
    shearReinforcement: { ...input.shearReinforcement },
  }
}
