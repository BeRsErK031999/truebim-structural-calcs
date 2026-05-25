export type CalculationResult = {
  demand: number
  capacity: number
  utilization: number
}

export const emptyCalculationResult: CalculationResult = {
  demand: 0,
  capacity: 0,
  utilization: 0,
}

export * from './punching-shear'
