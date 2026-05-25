import { describe, expect, it } from 'vitest'

import { defaultPunchingShearInput } from '../defaults'
import { calculatePunchingShear } from '../engine'
import { buildPunchingShearReport } from '../report'
import { punchingShearInputSchema } from '../schemas'
import type { PunchingShearInput } from '../types'
import { useCalculationStore } from '@/entities/calculation/model/store'

describe('punching shear draft center check', () => {
  it('validates the default input', () => {
    expect(() => punchingShearInputSchema.parse(defaultPunchingShearInput)).not.toThrow()
  })

  it('rejects negative geometry in the schema', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      slab: {
        ...defaultPunchingShearInput.slab,
        effectiveDepthMm: -190,
      },
    }

    expect(punchingShearInputSchema.safeParse(input).success).toBe(false)
  })

  it('rejects NaN before it can reach the engine from the form', () => {
    const input = {
      ...defaultPunchingShearInput,
      rectColumn: {
        ...defaultPunchingShearInput.rectColumn,
        widthXMm: Number.NaN,
      },
    }

    expect(punchingShearInputSchema.safeParse(input).success).toBe(false)
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

  it('handles form-like numeric values for the center rectangular case', () => {
    const formLikeInput: PunchingShearInput = {
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 600,
        momentXKnM: 12,
        momentYKnM: 8,
      },
      slab: {
        thicknessMm: 240,
        effectiveDepthMm: 205,
        concreteCoverMm: 35,
      },
      rectColumn: {
        widthXMm: 500,
        widthYMm: 350,
      },
      concrete: {
        className: 'B30',
      },
      shearReinforcement: {
        enabled: false,
      },
    }
    const result = calculatePunchingShear(formLikeInput)

    expect(['draft_ok', 'draft_failed']).toContain(result.status)
    expect(result.controlPerimeterMm).toBeGreaterThan(0)
  })

  it('does not produce NaN result values for valid default input', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const numericValues = [
      result.utilization,
      result.designShearForceN,
      result.controlPerimeterMm,
      result.effectiveDepthMm,
      result.shearStressMpa,
      result.draftConcreteResistanceMpa,
      result.utilizationRatio,
    ].filter((value): value is number => value !== null)

    expect(numericValues.every(Number.isFinite)).toBe(true)
  })

  it('updates the calculation store result after calculation', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    useCalculationStore.getState().setDraft(defaultPunchingShearInput)
    useCalculationStore.getState().setPunchingShearResult(result, report)

    expect(useCalculationStore.getState().punchingShearResult).toBe(result)
    expect(useCalculationStore.getState().punchingShearReport).toBe(report)
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
