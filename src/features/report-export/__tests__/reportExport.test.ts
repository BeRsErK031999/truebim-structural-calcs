import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'
import { calculatePunchingShear } from '@/calculations/punching-shear/engine'
import { buildPunchingShearReport } from '@/calculations/punching-shear/report'
import { useCalculationStore } from '@/entities/calculation/model/store'

import { downloadTextFile } from '../downloadFile'
import {
  buildPunchingShearHtmlReport,
  buildPunchingShearMarkdownReport,
  exportCurrentCalculationAsHtml,
  sanitizeFileName,
} from '../index'

vi.mock('../downloadFile', () => ({
  downloadTextFile: vi.fn(),
}))

const mockedDownloadTextFile = vi.mocked(downloadTextFile)

describe('report export', () => {
  beforeEach(() => {
    mockedDownloadTextFile.mockReset()
    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: null,
      punchingShearReport: null,
      activeSavedCalculationId: null,
    })
  })

  it('builds an HTML report with the draft warning', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('DRAFT CALCULATION - NOT FOR DESIGN USE')
    expect(html).toContain('TrueBIM Structural Calculations - Punching Shear Report')
  })

  it('builds a Markdown report with the formula', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(markdown).toContain('v = N / (u * h0)')
  })

  it('includes input N and calculated u, h0, v and utilization values', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(markdown).toContain(`| N, kN | ${defaultPunchingShearInput.forces.axialForceKn} |`)
    expect(markdown).toContain(`| u, mm | ${result.controlPerimeterMm} |`)
    expect(markdown).toContain(`| h0, mm | ${result.effectiveDepthMm} |`)
    expect(markdown).toContain(`| v, MPa | ${result.shearStressMpa?.toFixed(3)} |`)
    expect(markdown).toContain(`| utilization ratio | ${result.utilizationRatio?.toFixed(3)} |`)
  })

  it('sanitizes unsafe filenames', () => {
    expect(sanitizeFileName(' ../bad:name report?.html ')).toBe('bad-name-report.html')
  })

  it('downloads through a mocked downloadFile implementation without crashing', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: result,
      punchingShearReport: report,
    })

    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: true,
      filename: expect.stringMatching(/^truebim-punching-shear-report-\d{4}-\d{2}-\d{2}\.html$/),
    })
    expect(mockedDownloadTextFile).toHaveBeenCalledOnce()
  })

  it('guards export when no calculation exists', () => {
    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: false,
      error: 'Сначала выполните расчет, затем выгрузите отчет.',
    })
    expect(mockedDownloadTextFile).not.toHaveBeenCalled()
  })
})
