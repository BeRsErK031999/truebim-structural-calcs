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

  it('returns VERIFIED verification level for the trusted center force-only case', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(result.verificationLevel).toBe('verified')
    expect(result.verifiedFeatures).toContain('center-force-only')
    expect(result.draftFeatures).toEqual([])
    expect(result.verificationEvidenceIds).toContain('verified-center-rect-001')
  })

  it('returns PARTIALLY VERIFIED for center moment transfer until trusted moment evidence exists', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      forces: {
        ...defaultPunchingShearInput.forces,
        momentXKnM: 12,
      },
    })

    expect(result.verificationLevel).toBe('partial')
    expect(result.verifiedFeatures).toContain('center-force-only')
    expect(result.draftFeatures).toContain('center-moment-transfer')
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

  it('returns draft geometry for openings', () => {
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

    const result = calculatePunchingShear(input)

    expect(['draft_ok', 'draft_failed']).toContain(result.status)
    expect(result.perimeter.openingAffected).toBe(true)
    expect(result.perimeter.removedSegments.length).toBeGreaterThan(0)
  })

  it('renders SVG metadata for removed segments and opening tangents', () => {
    const result = calculatePunchingShear({
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
    })

    expect(result.svgModel.elements.some((element) => element.role === 'removed-perimeter')).toBe(true)
    expect(result.svgModel.elements.some((element) => element.role === 'opening-tangent')).toBe(true)
  })

  it.each(['edge', 'corner'] as const)(
    'returns draft geometry for %s cases',
    (caseType) => {
      const input: PunchingShearInput = {
        ...defaultPunchingShearInput,
        caseType,
        slabEdges:
          caseType === 'edge'
            ? {
                leftMm: 0,
              }
            : {
                leftMm: 0,
                topMm: 0,
              },
      }
      const result = calculatePunchingShear(input)

      expect(['draft_ok', 'draft_failed']).toContain(result.status)
      expect(result.perimeter.edgeAffected).toBe(true)
      expect(result.perimeter.cornerAffected).toBe(caseType === 'corner')
      expect(result.verificationLevel).toBe('draft')
      expect(result.draftFeatures).toContain(caseType)
    },
  )

  it('keeps openings as DRAFT verification scope', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      caseType: 'opening',
      openings: [
        {
          id: 'opening-1',
          widthXMm: 300,
          widthYMm: 200,
          centerXMm: 600,
          centerYMm: 0,
        },
      ],
    })

    expect(result.verificationLevel).toBe('draft')
    expect(result.verifiedFeatures).not.toContain('center-force-only')
    expect(result.draftFeatures).toContain('openings')
  })

  it('creates draft wall-end geometry without verified promotion', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      caseType: 'wall-end',
      wall: {
        wallLength: 1200,
        wallThickness: 200,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
      },
    }
    const result = calculatePunchingShear(input)

    expect(['draft_ok', 'draft_failed']).toContain(result.status)
    expect(result.verificationLevel).toBe('draft')
    expect(result.verifiedFeatures).toEqual([])
    expect(result.draftFeatures).toContain('wall-end')
    expect(result.perimeter.perimeterMm).toBeGreaterThan(0)
    expect(result.perimeter.segments).toHaveLength(3)
    expect(result.perimeter.vertices).toHaveLength(4)
    expect(result.perimeter.boundingBox.width).toBeGreaterThan(input.wall!.wallLength)
    expect(result.perimeter.warnings).toEqual(
      expect.arrayContaining([
        'No SP63 wall punching coefficients or verified resistance formulas are applied',
      ]),
    )
  })

  it('generates wall-end SVG elements and labels', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      caseType: 'wall-end',
    }
    const result = calculatePunchingShear(input)

    expect(result.svgModel.elements.some((element) => element.role === 'wall')).toBe(true)
    expect(result.svgModel.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'Draft wall punching geometry',
        }),
        expect.objectContaining({
          role: 'dimension',
          type: 'line',
          label: '1200 mm wall length',
        }),
        expect.objectContaining({
          role: 'dimension',
          type: 'line',
          label: '200 mm wall thickness',
        }),
      ]),
    )
  })

  it.each(['round'] as const)(
    'returns not_implemented for %s cases',
    (caseType) => {
      const input: PunchingShearInput = {
        ...defaultPunchingShearInput,
        caseType,
        roundColumn: { diameterMm: 400 },
        slabEdges: undefined,
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
    expect(report.verificationCapabilities.verified).toContain('center-force-only')
  })
})
