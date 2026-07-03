import type { WallEndOpeningsInput } from './types'

const emptyCutouts = [
  { offsetMm: 0, lengthMm: 0 },
  { offsetMm: 0, lengthMm: 0 },
  { offsetMm: 0, lengthMm: 0 },
]

export const defaultWallEndOpeningsInput: WallEndOpeningsInput = {
  scheme: 'floor-columns-above-and-below',
  splitAdditionalMoment: true,
  wallThicknessMm: 220,
  slab: {
    heightMm: 180,
    coverXMm: 40,
    coverYMm: 40,
  },
  forces: {
    fiTon: 15.6,
    myiTonM: -2.78,
    qiTonPerM2: 0,
  },
  concrete: {
    className: 'B25',
    gammaB1: 1,
    gammaB234: 1,
  },
  reinforcement: {
    className: 'A500',
    diameterMm: 10,
    barCount: 2,
    spacingMm: 100,
  },
  cutouts: {
    lx1: [
      { offsetMm: 50, lengthMm: 150 },
      ...emptyCutouts.slice(1),
    ],
    lx2: [
      { offsetMm: 32, lengthMm: 52 },
      ...emptyCutouts.slice(1),
    ],
    ly: [
      { offsetMm: 100, lengthMm: 200 },
      ...emptyCutouts.slice(1),
    ],
  },
  alternateContour: {
    yPlusMm: 0,
    yMinusMm: 0,
  },
}
