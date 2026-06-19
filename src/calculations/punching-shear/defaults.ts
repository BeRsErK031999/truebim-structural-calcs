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
  roundColumn: {
    diameterMm: 400,
    slabThickness: 220,
    effectiveDepth: 190,
    cover: 30,
    position: 'center',
  },
  wall: {
    wallLength: 1200,
    wallThickness: 200,
    slabThickness: 220,
    effectiveDepth: 190,
    cover: 30,
  },
  wallCorner: {
    wallLengthX: 1200,
    wallLengthY: 1000,
    wallThicknessX: 200,
    wallThicknessY: 220,
    slabThickness: 220,
    effectiveDepth: 190,
    cover: 30,
    orientation: 'top-left',
  },
  openings: [],
  shearReinforcement: {
    enabled: false,
    inputMode: 'manual',
    barDiameterMm: 10,
    simpleBarCount: 8,
    barSpacingMm: 100,
    rowCount: 2,
    legsPerRow: 4,
    steelClass: 'A400',
    firstRowDistanceMm: 80,
    rowSpacingMm: 100,
    layoutType: 'closed-stirrups',
    manualAswMm2: 628.319,
    manualSwMm: 100,
  },
  multipleContours: {
    enabled: false,
    count: 4,
    offsetStep: 'h0/2',
  },
}
