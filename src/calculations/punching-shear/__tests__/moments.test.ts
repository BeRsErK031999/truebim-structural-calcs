import { describe, expect, it } from 'vitest'

import { calculatePunchingShear } from '../engine'
import { calculateDraftEccentricity } from '../moments/eccentricity'
import { defaultPunchingShearInput } from '../defaults'

describe('draft moment transfer engine', () => {
  it('calculates draft eccentricity from Mx/My and axial force', () => {
    expect(
      calculateDraftEccentricity({
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      }),
    ).toEqual({
      eccentricityX: 19.04761904761905,
      eccentricityY: 28.57142857142857,
    })
  })

  it('generates stress distribution points along the perimeter', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
    })

    expect(result.momentTransferEnabled).toBe(true)
    expect(result.stressDistribution?.status).toBe('draft')
    expect(result.stressDistribution?.points).toHaveLength(12)
    expect(result.stressDistribution?.segmentStresses).toHaveLength(4)
  })

  it('generates max and min stress values from draft redistribution', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
    })

    expect(result.maxShearStressMpa).toBeCloseTo(1.2390571372412647)
    expect(result.minShearStressMpa).toBeCloseTo(0.6342702490210013)
    expect(result.utilizationRatio).toBeCloseTo(1.180054416420252)
  })

  it('adds SVG stress metadata and deterministic stress elements', () => {
    const result = calculatePunchingShear({
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
    })

    expect(result.svgModel.metadata.stressDiagram).toBe('draft')
    expect(result.svgModel.elements.some((element) => element.id === 'moment-arrow-mx')).toBe(true)
    expect(result.svgModel.elements.some((element) => element.id === 'moment-arrow-my')).toBe(true)
    expect(result.svgModel.elements.some((element) => element.id === 'eccentricity-marker')).toBe(true)
    expect(
      result.svgModel.elements.filter((element) => element.role === 'stress-segment'),
    ).toHaveLength(4)
  })

  it('keeps the verified center case arithmetic unchanged when moments are zero', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(result.shearStressMpa).toBeCloseTo(0.936663693131133)
    expect(result.utilizationRatio).toBeCloseTo(0.8920606601248884)
    expect(result.maxShearStressMpa).toBeCloseTo(result.shearStressMpa ?? 0)
    expect(result.minShearStressMpa).toBeCloseTo(result.shearStressMpa ?? 0)
  })
})
