import { describe, expect, it } from 'vitest'

import { calculateWallEndOpenings, defaultWallEndOpeningsInput } from '..'

describe('wall end openings calculation', () => {
  it('matches the screenshot baseline from the Excel reference', () => {
    const result = calculateWallEndOpenings(defaultWallEndOpeningsInput)

    expect(result.status).toBe('draft_reference')
    expect(result.geometry.h0Mm).toBeCloseTo(140, 6)
    expect(result.geometry.lx1M).toBeCloseTo(0.36, 6)
    expect(result.geometry.lx2M).toBeCloseTo(0.36, 6)
    expect(result.geometry.lyM).toBeCloseTo(0.36, 6)
    expect(result.geometry.uM).toBeCloseTo(0.678, 6)
    expect(result.geometry.staticMomentM3).toBeCloseTo(0.13568, 6)
    expect(result.geometry.wallCentroidYM).toBeCloseTo(0.18, 6)
    expect(result.geometry.contourCentroidYM).toBeCloseTo(0.200118, 6)
    expect(result.geometry.e0yM).toBeCloseTo(0.020118, 6)

    expect(result.loads.fq1Ton).toBeCloseTo(-0.049896, 6)
    expect(result.loads.fTon).toBeCloseTo(15.550104, 6)
    expect(result.loads.myLocalTonM).toBeCloseTo(-1.39, 6)
    expect(result.loads.myFromForceTonM).toBeCloseTo(-0.15692, 5)
    expect(result.loads.myTonM).toBeCloseTo(-1.54692, 5)

    expect(result.concrete.fbUltTon).toBeCloseTo(10.156, 3)
    expect(result.concrete.forceRatio).toBeCloseTo(1.531, 3)
    expect(result.concrete.mbyUltTonM).toBeCloseTo(1.471, 3)
    expect(result.concrete.momentRatio).toBeCloseTo(1.052, 3)
    expect(result.concrete.utilization).toBeCloseTo(2.297, 3)
    expect(result.concrete.passed).toBe(false)

    expect(result.reinforcement.aswCm2).toBeCloseTo(1.571, 3)
    expect(result.reinforcement.qswTonPerM).toBeCloseTo(48.066, 3)
    expect(result.reinforcement.fswUltTon).toBeCloseTo(26.071, 3)
    expect(result.reinforcement.fUltTon).toBeCloseTo(20.313, 3)
    expect(result.reinforcement.utilization).toBeCloseTo(1.148, 3)
    expect(result.reinforcement.excessMessage).toContain('избытком')
  })

  it('can reproduce the saved workbook state when the lx2 cutout is zeroed', () => {
    const input = {
      ...defaultWallEndOpeningsInput,
      cutouts: {
        ...defaultWallEndOpeningsInput.cutouts,
        lx2: [
          { offsetMm: 0, lengthMm: 0 },
          { offsetMm: 0, lengthMm: 0 },
          { offsetMm: 0, lengthMm: 0 },
        ],
      },
    }

    const result = calculateWallEndOpenings(input)

    expect(result.geometry.uM).toBeCloseTo(0.73, 6)
    expect(result.geometry.staticMomentM3).toBeCloseTo(0.1544, 6)
    expect(result.concrete.fbUltTon).toBeCloseTo(10.935, 3)
  })
})
