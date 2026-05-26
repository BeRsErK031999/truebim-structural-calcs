import type { PunchingShearInput } from '../types'

export type AxisConvention = {
  id: 'truebim-draft-mm-xy'
  traversal: 'clockwise' | 'counterclockwise'
  xPositiveDirection: 'left' | 'right'
  yPositiveDirection: 'up' | 'down'
  momentXSignConvention:
    | 'positive-mx-increases-positive-y-stress'
    | 'positive-mx-increases-negative-y-stress'
  momentYSignConvention:
    | 'positive-my-increases-positive-x-stress'
    | 'positive-my-increases-negative-x-stress'
  coordinateUnits: 'mm'
}

export const defaultAxisConvention: AxisConvention = {
  id: 'truebim-draft-mm-xy',
  traversal: 'counterclockwise',
  xPositiveDirection: 'right',
  yPositiveDirection: 'up',
  momentXSignConvention: 'positive-mx-increases-positive-y-stress',
  momentYSignConvention: 'positive-my-increases-positive-x-stress',
  coordinateUnits: 'mm',
}

export function getAxisConventionForInput(_input?: PunchingShearInput) {
  void _input

  return defaultAxisConvention
}
