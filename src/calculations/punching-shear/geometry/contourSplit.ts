import type { ContourLoop } from '../domain/contour'

export type ContourSplitPlan = {
  contourId: string
  status: 'pending'
}

export function createContourSplitPlan(contour: ContourLoop): ContourSplitPlan {
  return {
    contourId: contour.id,
    status: 'pending',
  }
}
