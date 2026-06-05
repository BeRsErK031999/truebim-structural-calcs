import { describe, expect, it } from 'vitest'

import { defaultPunchingShearInput } from '../defaults'
import { calculatePunchingShear } from '../engine'
import { buildPunchingShearReport } from '../report'
import { buildPunchingShearTrace } from '../trace/traceBuilder'

describe('punching shear calculation trace', () => {
  it('generates a calculation trace section for the center force-only case', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const trace = buildPunchingShearTrace(defaultPunchingShearInput, result)

    expect(trace).toHaveLength(1)
    expect(trace[0]).toMatchObject({
      id: 'calculation-trace',
      title: 'Calculation Trace',
    })
  })

  it('creates the expected trace step count', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const trace = buildPunchingShearTrace(defaultPunchingShearInput, result)

    expect(trace[0].steps.map((step) => step.id)).toEqual([
      'input-validation',
      'geometry-generation',
      'control-perimeter',
      'effective-depth',
      'stress',
      'utilization',
      'verification-level',
    ])
  })

  it('traces the stress formula and substituted values', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const trace = buildPunchingShearTrace(defaultPunchingShearInput, result)
    const stressStep = trace[0].steps.find((step) => step.id === 'stress')

    expect(stressStep).toMatchObject({
      formula: 'v = N / (u * h0)',
      result: result.shearStressMpa?.toFixed(6),
      units: 'MPa',
      sourceType: 'verified',
    })
    expect(stressStep?.substitutedFormula).toContain('420000.000 / (2360.000 * 190.000)')
  })

  it('traces utilization from stress and draft resistance without changing verification logic', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const trace = buildPunchingShearTrace(defaultPunchingShearInput, result)
    const utilizationStep = trace[0].steps.find((step) => step.id === 'utilization')

    expect(utilizationStep).toMatchObject({
      formula: 'eta = v / R',
      result: result.utilizationRatio?.toFixed(6),
      units: 'ratio',
      sourceType: 'verified',
    })
  })

  it('traces the existing verification level and evidence source', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const trace = buildPunchingShearTrace(defaultPunchingShearInput, result)
    const verificationStep = trace[0].steps.find((step) => step.id === 'verification-level')

    expect(verificationStep).toMatchObject({
      result: 'VERIFIED',
      sourceType: 'verified',
      sourceReference: 'verified-center-rect-001',
    })
  })

  it('adds trace sections to the report model', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    expect(report.calculationTrace[0].title).toBe('Calculation Trace')
    expect(report.calculationTrace[0].steps).toHaveLength(7)
  })

  it('adds center moment eccentricity and redistribution trace steps', () => {
    const input = {
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
    }
    const result = calculatePunchingShear(input)
    const trace = buildPunchingShearTrace(input, result)
    const momentSteps = trace.find((section) => section.id === 'center-moment-trace')?.steps ?? []

    expect(momentSteps.map((step) => step.id)).toEqual([
      'force-only-base-stress',
      'moment-eccentricity',
      'draft-stress-redistribution',
      'max-min-stress',
      'moment-utilization',
    ])
    expect(momentSteps.find((step) => step.id === 'moment-eccentricity')?.warnings).toContain(
      'Moment transfer is partial/draft and requires trusted evidence.',
    )
  })

  it('adds wall-end geometry trace steps', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'wall-end' as const,
    }
    const result = calculatePunchingShear(input)
    const trace = buildPunchingShearTrace(input, result)
    const wallSteps = trace.find((section) => section.id === 'wall-end-trace')?.steps ?? []

    expect(wallSteps.map((step) => step.id)).toEqual([
      'wall-geometry',
      'wall-end-control-perimeter',
      'draft-perimeter-offset',
      'draft-stress-formula',
      'draft-wall-utilization',
      'verification-level',
    ])
  })

  it('adds wall-corner orientation trace steps', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner' as const,
    }
    const result = calculatePunchingShear(input)
    const trace = buildPunchingShearTrace(input, result)
    const wallCornerSteps = trace.find((section) => section.id === 'wall-corner-trace')?.steps ?? []

    expect(wallCornerSteps.map((step) => step.id)).toContain('orientation-transform')
  })

  it('adds opening tangent and removed segment trace steps', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'opening' as const,
      openings: [
        {
          id: 'opening-1',
          widthXMm: 400,
          widthYMm: 300,
          centerXMm: 650,
          centerYMm: 0,
        },
      ],
    }
    const result = calculatePunchingShear(input)
    const trace = buildPunchingShearTrace(input, result)
    const openingSteps = trace.find((section) => section.id === 'openings-trace')?.steps ?? []

    expect(openingSteps.map((step) => step.id)).toEqual([
      'opening-classification',
      'tangent-construction',
      'removed-perimeter-segments',
      'active-perimeter',
      'draft-stress-after-openings',
      'verification-level',
    ])
  })

  it('adds multiple contour critical selection trace steps', () => {
    const input = {
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 2,
        offsetStep: 'h0/2' as const,
      },
    }
    const result = calculatePunchingShear(input)
    const trace = buildPunchingShearTrace(input, result)
    const contourSteps = trace.find((section) => section.id === 'multiple-contours-trace')?.steps ?? []

    expect(contourSteps.map((step) => step.id)).toContain('draft-critical-contour-selection')
  })

  it('adds shear reinforcement contribution trace steps', () => {
    const input = {
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
      },
    }
    const result = calculatePunchingShear(input)
    const trace = buildPunchingShearTrace(input, result)
    const reinforcementSteps = trace.find((section) => section.id === 'shear-reinforcement-trace')?.steps ?? []

    expect(reinforcementSteps.map((step) => step.id)).toContain('draft-reinforcement-contribution')
  })

  it('adds round circular perimeter approximation trace steps', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'round' as const,
    }
    const result = calculatePunchingShear(input)
    const trace = buildPunchingShearTrace(input, result)
    const roundSteps = trace.find((section) => section.id === 'round-column-trace')?.steps ?? []

    expect(roundSteps.map((step) => step.id)).toContain('circular-control-perimeter-approximation')
  })

  it('keeps draft feature trace steps out of verified source type', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'wall-end' as const,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
      },
    }
    const result = calculatePunchingShear(input)
    const draftTraceSteps = buildPunchingShearTrace(input, result)
      .flatMap((section) => section.steps)
      .filter((step) => step.id !== 'input-validation')

    expect(draftTraceSteps.some((step) => step.sourceType === 'verified')).toBe(false)
  })
})
