import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { calculatePunchingShear, buildPunchingShearReport } from '@/calculations/punching-shear'
import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'
import { useCalculationStore } from '@/entities/calculation/model/store'

import { CalculationForm } from '../CalculationForm'
import { engineeringHelp, inputSectionOrder } from '../engineeringUx'

describe('CalculationForm engineering UX', () => {
  it('renders the requested input section order', () => {
    const html = renderForm()
    const indexes = inputSectionOrder.map((title) => html.indexOf(title))

    indexes.forEach((index) => expect(index).toBeGreaterThan(-1))
    expect(indexes).toEqual([...indexes].sort((left, right) => left - right))
  })

  it('hides cover when h0 is direct input', () => {
    const html = renderForm()

    expect(html).toContain('h0')
    expect(html).not.toContain('concreteCoverMm')
  })

  it('renders moment and column engineering labels', () => {
    const html = renderForm()

    expect(html).toContain('Mx')
    expect(html).toContain('My')
    expect(html).toContain('Колонна')
    expect(html).toContain('Размер колонны по оси X')
    expect(html).toContain('Размер колонны по оси Y')
    expect(html).toContain('Момент в плоскости оси X')
    expect(html).toContain('Момент в плоскости оси Y')
  })

  it('renders engineering help text', () => {
    const html = renderForm()

    expect(html).toContain(engineeringHelp.h)
    expect(html).toContain(engineeringHelp.h0)
  })

  it('keeps inputs editable after a calculation exists', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: result,
      punchingShearReport: report,
      activeCalculationId: 'calculation-form-editable-test',
      activeSavedCalculationId: null,
    })

    const html = renderForm(false)

    expect(html).toContain('name="forces.axialForceKn"')
    expect(html).not.toMatch(/<input[^>]+name="forces\.axialForceKn"[^>]+disabled/)
    expect(html).toContain('Рассчитать')
  })
})

function renderForm(resetStore = true) {
  if (resetStore) {
    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: null,
      punchingShearReport: null,
      activeCalculationId: null,
      activeSavedCalculationId: null,
    })
  }

  return renderToStaticMarkup(<CalculationForm />)
}
