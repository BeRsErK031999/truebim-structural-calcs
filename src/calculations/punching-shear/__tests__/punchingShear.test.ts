import { describe, expect, it } from 'vitest'

import { defaultPunchingShearInput } from '../defaults'
import { calculatePunchingShear } from '../engine'
import { buildPunchingShearReport } from '../report'
import { punchingShearInputSchema } from '../schemas'
import type { PunchingShearInput } from '../types'

describe('punching shear draft center check', () => {
  it('validates the default input', () => {
    expect(() => punchingShearInputSchema.parse(defaultPunchingShearInput)).not.toThrow()
  })

  it('returns a draft status for the default center input', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(['draft_ok', 'draft_failed']).toContain(result.status)
    expect(result.status).not.toBe('not_implemented')
  })

  it('calculates utilization ratio from draft stress and draft resistance', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const expectedStress =
      result.designShearForceN! / (result.controlPerimeterMm! * result.effectiveDepthMm!)
    const expectedUtilization = expectedStress / result.draftConcreteResistanceMpa!

    expect(result.shearStressMpa).toBeCloseTo(expectedStress)
    expect(result.utilizationRatio).toBeCloseTo(expectedUtilization)
  })

  it('returns a boolean passed value for supported draft checks', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(typeof result.passed).toBe('boolean')
  })

  it('returns not_implemented for openings', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      openings: [
        {
          id: 'opening-1',
          widthXMm: 300,
          widthYMm: 200,
          centerXMm: 600,
          centerYMm: 0,
        },
      ],
    }

    expect(calculatePunchingShear(input).status).toBe('not_implemented')
  })

  it.each(['edge', 'corner', 'round'] as const)(
    'returns not_implemented for %s cases',
    (caseType) => {
      const input: PunchingShearInput = {
        ...defaultPunchingShearInput,
        caseType,
        roundColumn: caseType === 'round' ? { diameterMm: 400 } : undefined,
        slabEdges:
          caseType === 'edge' || caseType === 'corner'
            ? {
                leftMm: 0,
              }
            : undefined,
      }

      expect(calculatePunchingShear(input).status).toBe('not_implemented')
    },
  )

  it('returns invalid_input for negative dimensions', () => {
    const input = {
      ...defaultPunchingShearInput,
      slab: {
        ...defaultPunchingShearInput.slab,
        thicknessMm: -220,
      },
    } as PunchingShearInput

    expect(calculatePunchingShear(input).status).toBe('invalid_input')
  })

  it('includes the draft warning in the report', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    expect(report.warnings).toContain(
      'Draft calculation. Verify formulas and coefficients against СП63.13330 before design use.',
    )
    expect(report.formulaSummary).toContain('DRAFT / NOT FOR DESIGN USE')
  })
})
