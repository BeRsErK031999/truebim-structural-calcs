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

  it('validates wall-corner schema input', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner',
      wallCorner: {
        wallLengthX: 1300,
        wallLengthY: 900,
        wallThicknessX: 220,
        wallThicknessY: 180,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
        orientation: 'bottom-right',
      },
    }

    expect(punchingShearInputSchema.safeParse(input).success).toBe(true)
  })

  it('validates round schema input', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      caseType: 'round',
      roundColumn: {
        diameterMm: 450,
        slabThickness: 240,
        effectiveDepth: 205,
        cover: 35,
        position: 'center',
      },
    }

    expect(punchingShearInputSchema.safeParse(input).success).toBe(true)
  })

  it('creates draft wall-corner geometry without verified promotion', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner',
      wallCorner: {
        wallLengthX: 1300,
        wallLengthY: 900,
        wallThicknessX: 220,
        wallThicknessY: 180,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
        orientation: 'top-left',
      },
    }
    const result = calculatePunchingShear(input)

    expect(['draft_ok', 'draft_failed']).toContain(result.status)
    expect(result.verificationLevel).toBe('draft')
    expect(result.verifiedFeatures).toEqual([])
    expect(result.draftFeatures).toContain('wall-corner')
    expect(result.perimeter.perimeterMm).toBeGreaterThan(0)
    expect(result.perimeter.segments).toHaveLength(6)
    expect(result.perimeter.vertices).toHaveLength(6)
    expect(result.perimeter.cornerAffected).toBe(true)
    expect(result.perimeter.svgPath).toContain('M')
    expect(result.perimeter.warnings).toEqual(
      expect.arrayContaining([
        'No SP63 wall-corner punching coefficients or verified resistance formulas are applied',
      ]),
    )
  })

  it('generates wall-corner SVG elements and labels', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner',
    }
    const result = calculatePunchingShear(input)

    expect(result.svgModel.elements.some((element) => element.role === 'wall')).toBe(true)
    expect(result.svgModel.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'Draft wall corner punching geometry',
        }),
        expect.objectContaining({
          role: 'dimension',
          type: 'line',
          label: '1200 mm wall length X',
        }),
        expect.objectContaining({
          role: 'dimension',
          type: 'line',
          label: '1000 mm wall length Y',
        }),
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'inner corner',
        }),
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'outer corner',
        }),
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

  it('creates draft round center geometry without verified promotion', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      caseType: 'round',
      roundColumn: {
        diameterMm: 400,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
        position: 'center',
      },
      slabEdges: undefined,
    }
    const result = calculatePunchingShear(input)

    expect(['draft_ok', 'draft_failed']).toContain(result.status)
    expect(result.verificationLevel).toBe('draft')
    expect(result.verifiedFeatures).toEqual([])
    expect(result.draftFeatures).toContain('round-columns')
    expect(result.perimeter.perimeterMm).toBeGreaterThan(0)
    expect(result.perimeter.segments).toHaveLength(32)
    expect(result.perimeter.warnings).toContain(
      'Round column perimeter is draft-only and requires SP63 verification.',
    )
  })

  it.each(['edge', 'corner'] as const)(
    'keeps round %s not implemented',
    (position) => {
      const result = calculatePunchingShear({
        ...defaultPunchingShearInput,
        caseType: 'round',
        roundColumn: {
          diameterMm: 400,
          slabThickness: 220,
          effectiveDepth: 190,
          cover: 30,
          position,
        },
      })

      expect(result.status).toBe('not_implemented')
      expect(result.verificationLevel).toBe('draft')
      expect(result.warnings).toContain('Round edge/corner is not implemented yet.')
    },
  )

  it('generates round SVG elements and labels', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      caseType: 'round',
      roundColumn: {
        diameterMm: 400,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
        position: 'center',
      },
    })

    expect(result.svgModel.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'column', type: 'circle', radius: 200 }),
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'Draft round column control perimeter',
        }),
        expect.objectContaining({
          role: 'dimension',
          type: 'line',
          label: '400 mm diameter',
        }),
        expect.objectContaining({
          role: 'dimension',
          type: 'line',
          label: '95 mm draft offset',
        }),
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'round control contour draft',
        }),
      ]),
    )
  })

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

  it('keeps center verified case verified after wall-corner support is added', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(result.verificationLevel).toBe('verified')
    expect(result.verifiedFeatures).toContain('center-force-only')
    expect(result.draftFeatures).toEqual([])
  })

  it('creates draft multiple control contours with expected offsets', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 4,
        offsetStep: 'h0/2',
      },
    }
    const result = calculatePunchingShear(input)

    expect(result.controlContours).toHaveLength(4)
    expect(result.controlContours.map((contour) => contour.offsetMm)).toEqual([95, 190, 285, 380])
    expect(result.contourWarnings).toContain(
      'Multiple contour selection is draft-only and requires SP63 verification.',
    )
  })

  it('selects an existing draft critical contour', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 3,
        offsetStep: 'h0',
      },
    })

    expect(result.selectedContourId).toBeTruthy()
    expect(result.draftCriticalContour?.criterion).toBe('max-utilization')
    expect(result.controlContours.some((contour) => contour.id === result.selectedContourId)).toBe(true)
    expect(result.contourComparison.some((contour) => contour.selected)).toBe(true)
  })

  it('adds multiple contour rows to the report model', () => {
    const input: PunchingShearInput = {
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 2,
        offsetStep: 'h0/2',
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)

    expect(report.multipleControlPerimetersSummary).toHaveLength(2)
    expect(report.warnings).toContain(
      'Multiple contour selection is draft-only and requires SP63 verification.',
    )
  })

  it('labels contours in the SVG model', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 2,
        offsetStep: 'h0/2',
      },
    })

    expect(result.svgModel.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'label', type: 'text', text: 'contour 2' }),
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'contour 1 - selected draft critical contour',
        }),
      ]),
    )
    expect(result.svgModel.elements.some((element) => element.role === 'selected-control-contour')).toBe(true)
  })

  it('keeps existing verified center force-only behavior when multiple contours are disabled', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: false,
        count: 4,
        offsetStep: 'h0/2',
      },
    })

    expect(result.verificationLevel).toBe('verified')
    expect(result.controlContours).toEqual([])
    expect(result.controlPerimeterMm).toBe(2360)
  })

  it('validates shear reinforcement input schema with the draft DTO fields', () => {
    expect(
      punchingShearInputSchema.safeParse({
        ...defaultPunchingShearInput,
        shearReinforcement: {
          enabled: true,
          barDiameterMm: 12,
          barSpacingMm: 100,
          rowCount: 3,
          legsPerRow: 4,
          steelClass: 'A500',
          firstRowDistanceMm: 70,
          rowSpacingMm: 90,
          layoutType: 'studs',
        },
      }).success,
    ).toBe(true)
  })

  it('calculates deterministic draft shear reinforcement area and contribution', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      shearReinforcement: {
        enabled: true,
        barDiameterMm: 10,
        barSpacingMm: 100,
        rowCount: 2,
        legsPerRow: 4,
        steelClass: 'A400',
        firstRowDistanceMm: 80,
        rowSpacingMm: 100,
        layoutType: 'closed-stirrups',
      },
    })

    expect(result.reinforcementAreaMm2).toBeCloseTo(628.3185307)
    expect(result.reinforcementContributionN).toBeCloseTo(175929.1886)
    expect(result.draftCapacityWithReinforcementN).toBeGreaterThan(result.designShearForceN ?? 0)
    expect(result.utilizationWithReinforcement).toBeLessThan(result.utilizationRatio ?? 1)
    expect(result.reinforcementWarnings).toContain(
      'Shear reinforcement contribution is DRAFT-only.',
    )
  })

  it('keeps disabled shear reinforcement on the existing verified center behavior', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: false,
      },
    })

    expect(result.verificationLevel).toBe('verified')
    expect(result.verifiedFeatures).toContain('center-force-only')
    expect(result.draftFeatures).toEqual([])
    expect(result.reinforcementAreaMm2).toBeNull()
    expect(result.controlPerimeterMm).toBe(2360)
  })

  it('marks enabled shear reinforcement as a draft feature without auto verification', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
      },
    })

    expect(['draft_ok', 'draft_failed']).toContain(result.status)
    expect(result.verificationLevel).toBe('draft')
    expect(result.verifiedFeatures).toEqual([])
    expect(result.draftFeatures).toContain('shear-reinforcement')
  })

  it('adds shear reinforcement markers to the SVG model', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
        rowCount: 2,
        legsPerRow: 4,
      },
    })

    expect(result.svgModel.elements.some((element) => element.role === 'reinforcement-row')).toBe(true)
    expect(result.svgModel.elements.filter((element) => element.role === 'reinforcement-marker')).toHaveLength(8)
    expect(result.svgModel.elements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'label',
          type: 'text',
          text: 'Draft reinforcement layout: closed-stirrups',
        }),
      ]),
    )
  })
})
