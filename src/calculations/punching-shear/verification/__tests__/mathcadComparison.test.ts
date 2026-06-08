import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runVerificationCase } from '../verificationRunner'
import type { VerificationCase } from '../verificationCase'

type MathcadFixture = VerificationCase & {
  verificationLevel: 'draft'
  mathcadExpected: {
    geometry: {
      uMm: number
      AbM2: number
      WxM2: number
      WyM2: number
    }
    designActions: {
      FKn: number
      MxKnM: number
      MyKnM: number
    }
    checks: {
      withoutShearReinforcement: number
      forceCapWithoutShearReinforcement: number
      withShearReinforcement: number
      outerContour: number
    }
  }
  trueBimReportSnapshot: {
    utilizationRatio: number
    shearReinforcementEnabled: boolean
    momentTransferMethod: string
  }
}

const fixturePath = resolve(
  process.cwd(),
  'examples/verification/mathcad-center-column-with-reinforcement.example.json',
)

function loadFixture(): MathcadFixture {
  return JSON.parse(readFileSync(fixturePath, 'utf-8')) as MathcadFixture
}

describe('Mathcad center column with shear reinforcement comparison fixture', () => {
  it('loads as a draft candidate without verified promotion', () => {
    const fixture = loadFixture()

    expect(fixture).toMatchObject({
      id: 'draft-mathcad-center-column-with-reinforcement',
      status: 'draft',
      verificationLevel: 'draft',
      source: expect.stringContaining('manual/mathcad pdf'),
      verificationSource: expect.stringContaining('not imported as verified'),
    })
  })

  it('preserves extracted Mathcad expected values', () => {
    const fixture = loadFixture()

    expect(fixture.expected).toMatchObject({
      controlPerimeterMm: 3360,
      effectiveDepthMm: 190,
      utilizationRatio: 0.861,
      passed: true,
    })
    expect(fixture.mathcadExpected).toMatchObject({
      geometry: {
        uMm: 3360,
        AbM2: 0.638,
        WxM2: 0.842,
        WyM2: 1.01,
      },
      designActions: {
        FKn: 800,
        MxKnM: 30,
        MyKnM: 25,
      },
      checks: {
        withoutShearReinforcement: 1.366,
        forceCapWithoutShearReinforcement: 1.635,
        withShearReinforcement: 0.861,
        outerContour: 0.626,
      },
    })
  })

  it('detects the current TrueBIM mismatch against the Mathcad benchmark', () => {
    const fixture = loadFixture()
    const result = runVerificationCase(fixture)

    expect(result.status).toBe('draft')
    expect(result.statusAllowed).toBe(true)
    expect(result.passed).toBe(false)
    expect(result.verificationLevel).toBe('draft')
    expect(result.verifiedFeatures).toEqual([])
    expect(result.actual.controlPerimeterMm).toBe(3360)
    expect(result.actual.effectiveDepthMm).toBe(190)
    expect(result.fieldResults).toContainEqual(
      expect.objectContaining({
        field: 'utilizationRatio',
        expected: 0.861,
        passed: false,
      }),
    )
  })

  it('documents the exported TrueBIM report factors that explain the mismatch', () => {
    const fixture = loadFixture()

    expect(fixture.trueBimReportSnapshot).toMatchObject({
      utilizationRatio: 1.826663,
      shearReinforcementEnabled: false,
      momentTransferMethod: 'draft-linear-perimeter-redistribution',
    })
    expect(fixture.input.forces).toMatchObject({
      axialForceKn: 800,
      momentXKnM: 60,
      momentYKnM: 50,
    })
    expect(fixture.mathcadExpected.designActions).toMatchObject({
      FKn: 800,
      MxKnM: 30,
      MyKnM: 25,
    })
  })
})
