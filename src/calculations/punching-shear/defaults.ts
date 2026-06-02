import type { PunchingShearInput } from './types'

export const defaultPunchingShearInput: PunchingShearInput = {
  caseType: 'center',
  forces: {
    axialForceKn: 420,
    momentXKnM: 0,
    momentYKnM: 0,
  },
  slab: {
    thicknessMm: 220,
    effectiveDepthMm: 190,
    concreteCoverMm: 30,
  },
  concrete: {
    className: 'B25',
  },
  rectColumn: {
    widthXMm: 400,
    widthYMm: 400,
  },
  wall: {
    wallLength: 1200,
    wallThickness: 200,
    slabThickness: 220,
    effectiveDepth: 190,
    cover: 30,
  },
  openings: [],
  shearReinforcement: {
    enabled: false,
  },
}
