import { describe, expect, it } from 'vitest'

import { calculatePunchingShear } from '../../engine'
import { buildPunchingShearReport } from '../../report'
import { calculateSp63Interaction } from '../sp63Interaction'
import type { Sp63InteractionInput } from '../sp63Types'

const mathcadInput: Sp63InteractionInput = {
  concreteClass: 'B30',
  reinforcementClass: 'A240',
  shearBarDiameterMm: 6,
  h: 220,
  h0: 190,
  a1: 800,
  b1: 500,
  Finf: 800,
  Fsup: 0,
  MxInf: 60,
  MxSup: 0,
  MyInf: 50,
  MySup: 0,
  shearReinforcementEnabled: true,
}

const punchingInput = {
  caseType: 'center' as const,
  forces: {
    axialForceKn: 800,
    momentXKnM: 60,
    momentYKnM: 50,
  },
  slab: {
    thicknessMm: 220,
    effectiveDepthMm: 190,
    concreteCoverMm: 30,
  },
  concrete: {
    className: 'B30' as const,
  },
  rectColumn: {
    widthXMm: 500,
    widthYMm: 800,
  },
  openings: [],
  shearReinforcement: {
    enabled: true,
    barDiameterMm: 6,
    barSpacingMm: 60,
    rowCount: 1,
    legsPerRow: 2,
    steelClass: 'A240' as const,
    firstRowDistanceMm: 65,
    rowSpacingMm: 60,
    layoutType: 'custom' as const,
  },
}

describe('SP63 Mathcad benchmark interaction layer', () => {
  it('matches Mathcad benchmark geometry values', () => {
    const result = calculateSp63Interaction(mathcadInput)

    expect(result).not.toBeNull()
    expect(result!.u).toBeCloseTo(3.36, 3)
    expect(result!.Ab).toBeCloseTo(0.638, 3)
    expect(result!.Wx).toBeCloseTo(0.842, 3)
    expect(result!.Wy).toBeCloseTo(1.01, 3)
  })

  it('matches Mathcad concrete capacity values', () => {
    const result = calculateSp63Interaction(mathcadInput)

    expect(result!.FbUlt).toBeCloseTo(734.16, 2)
    expect(result!.MxBUlt).toBeCloseTo(183.933, 2)
    expect(result!.MyBUlt).toBeCloseTo(220.641, 2)
  })

  it('matches Mathcad shear reinforcement values', () => {
    const result = calculateSp63Interaction(mathcadInput)

    expect(result!.sw1).toBe(65)
    expect(result!.sw).toBe(60)
    expect(result!.nw).toBe(2)
    expect(result!.Asw).toBeCloseTo(0.565, 3)
    expect(result!.qsw).toBeCloseTo(160.221, 2)
    expect(result!.FswUlt).toBeCloseTo(430.675, 2)
    expect(result!.MxSwUlt).toBeCloseTo(107.899, 1)
    expect(result!.MySwUlt).toBeCloseTo(129.433, 1)
    expect(result!.Fult).toBeCloseTo(1164.835, 2)
    expect(result!.MxUlt).toBeCloseTo(291.833, 2)
    expect(result!.MyUlt).toBeCloseTo(350.074, 2)
  })

  it('matches Mathcad interaction checks', () => {
    const result = calculateSp63Interaction(mathcadInput)

    expect(result!.Mx).toBe(30)
    expect(result!.My).toBe(25)
    expect(result!.utilizationConcreteOnly).toBeCloseTo(1.366, 3)
    expect(result!.forceCapConcreteOnly).toBeCloseTo(1.635, 3)
    expect(result!.utilizationWithReinforcement).toBeCloseTo(0.861, 3)
    expect(result!.outerContour?.utilization).toBeCloseTo(0.626, 3)
    expect(result!.benchmarkStatus).toBe('matched')
  })

  it('attaches the SP63 interaction result without changing draft verification status', () => {
    const result = calculatePunchingShear(punchingInput)

    expect(result.sp63Interaction).toMatchObject({
      benchmarkStatus: 'mathcad-benchmark-candidate',
      utilizationConcreteOnly: expect.any(Number),
      utilizationWithReinforcement: expect.any(Number),
    })
    expect(result.utilizationRatio).toBeCloseTo(1.826663, 3)
    expect(result.verificationLevel).toBe('draft')
    expect(result.verifiedFeatures).toEqual([])
    expect(result.warnings).toContain(
      'SP63 interaction benchmark candidate based on Mathcad fixture; not VERIFIED for design use.',
    )
  })

  it('adds SP63 interaction trace steps', () => {
    const result = calculatePunchingShear(punchingInput)
    const report = buildPunchingShearReport(punchingInput, result)
    const sp63Trace = report.calculationTrace.find(
      (section) => section.id === 'sp63-interaction-benchmark-trace',
    )

    expect(sp63Trace?.steps.map((step) => step.id)).toEqual([
      'sp63-moment-reduction',
      'sp63-concrete-capacity',
      'sp63-reinforcement-capacity',
      'sp63-interaction-check',
      'sp63-outer-contour-check',
    ])
    expect(report.sp63InteractionSummary).toMatchObject({
      available: true,
      benchmarkStatus: 'mathcad-benchmark-candidate',
      utilizationConcreteOnly: expect.any(Number),
      utilizationWithReinforcement: expect.any(Number),
      outerContourUtilization: expect.any(Number),
    })
  })
})
