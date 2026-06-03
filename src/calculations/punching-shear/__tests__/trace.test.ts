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
})
