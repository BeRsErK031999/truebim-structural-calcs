import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'
import { calculatePunchingShear } from '@/calculations/punching-shear/engine'
import { buildPunchingShearReport } from '@/calculations/punching-shear/report'
import { buildEngineeringReportListing } from '@/calculations/punching-shear/trace/engineeringReportLines'
import { useCalculationStore } from '@/entities/calculation/model/store'

import { downloadTextFile } from '../downloadFile'
import {
  buildReportSummary,
  buildPunchingShearHtmlReport,
  buildPunchingShearMarkdownReport,
  createCalculationId,
  exportCurrentCalculationAsHtml,
  exportCurrentCalculationAsMarkdown,
  formatUtilization,
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
      activeCalculationId: null,
      activeSavedCalculationId: null,
    })
  })

  it('builds print-first engineering note exports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('Расчет на продавливание')
    expect(html).toContain('@page { size: A4; margin: 18mm 20mm; }')
    expect(html).toContain('Печать / Сохранить PDF')
    expect(html).toContain('Допущения и предпосылки')
    expect(html).toContain('Исходные данные')
    expect(html).toContain('Расчет')
    expect(markdown).toContain('# Расчет на продавливание')
    expect(markdown).toContain('## 3. Расчет')
  })

  it('uses one governing utilization in listing, HTML, Markdown and summary', () => {
    const input = {
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
        inputMode: 'manual' as const,
        manualAswMm2: 628.3185307,
        manualSwMm: 100,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const listing = buildEngineeringReportListing(input, result, report)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)
    const expected = result.governingUtilization?.toFixed(3)

    expect(expected).toBeDefined()
    expect(listing.resultSummary.utilizationText).toBe(expected)
    expect(html).toContain(`η = ${expected}`)
    expect(markdown).toContain(`η = ${expected}`)
    expect(buildReportSummary(result)).toContain(`util=${expected}`)
  })

  it('renders reinforcement formula chain without contradicting the conclusion', () => {
    const input = {
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
        inputMode: 'manual' as const,
        manualAswMm2: 628.3185307,
        manualSwMm: 100,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(markdown).toContain('q_sw = Rsw · Asw / sw')
    expect(markdown).toContain('F_sw,raw = 0.8 · q_sw · u')
    expect(markdown).toContain('F_sw,raw ≥ 0.25 · F_b,ult')
    expect(markdown).toContain('F_sw,raw ≤ F_b,ult')
    expect(markdown).toContain('F_sw,used')
    expect(markdown).toContain('Fult = F_b,ult + F_sw,used')
    expect(markdown).toContain(`= ${result.governingUtilization?.toFixed(3)}`)
  })

  it('renders migrated bar-count reinforcement as manual Asw without calculation count fields', () => {
    const input = {
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
        inputMode: 'bar-count' as const,
        steelClass: 'A240' as const,
        barDiameterMm: 8,
        simpleBarCount: 8,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(result.shearReinforcement.inputMode).toBe('manual')
    expect(markdown).toContain('A240')
    expect(markdown).toContain('Asw =')
    expect(markdown).toContain('sw')
    expect(markdown).not.toContain('\u00d88')
  })


  it('omits inactive scenario noise and forbidden report text', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    for (const content of [html, markdown]) {
      expect(content).not.toContain('Параметр недоступен')
      expect(content).not.toContain('offset')
      expect(content).not.toContain('черновое смещение')
      expect(content).not.toContain('studs')
      expect(content).not.toContain('Поперечная арматура</h3>')
      expect(content).not.toContain('Поперечная арматура\n')
    }
  })

  it('renders SVG with engineering labels and no offset/debug labels', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('<title>Расчетная схема продавливания</title>')
    expect(html).toContain('Колонна')
    expect(html).toContain('class="svg-legend"')
    expect(html).toContain('.svg-wrap { break-inside: avoid; margin: 4mm 0 7mm; overflow: hidden;')
    expect(html).toContain('колонна X')
    expect(html).toContain('колонна Y')
    expect(html).toContain('контур X')
    expect(html).toContain('контур Y')
    expect(html).not.toContain('maxY - 16')
    expect(html).not.toContain('1 единица = 1 мм')
    expect(html).not.toContain(' mm ')
    expect(html).not.toContain('offset')
  })

  it('formats copy report summary with governing utilization', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(buildReportSummary(result)).toBe(
      'N=420kN | u=2360mm | h0=190mm | v=0.937MPa | util=0.892',
    )
  })

  it('generates calculation IDs with timestamp and short commit', () => {
    expect(createCalculationId(new Date(2026, 4, 26, 4, 17, 54))).toMatch(
      /^ps-center-20260526-041754-[a-zA-Z0-9-]+$/,
    )
  })

  it('formats utilization with ratio and percent', () => {
    expect(formatUtilization(0.8920606601248884)).toBe('0.892 (89.2%)')
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
      activeCalculationId: 'calc-stable-report-id',
    })

    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: true,
      filename: 'truebim-punching-shear-report-calc-stable-report-id.html',
    })
    expect(mockedDownloadTextFile).toHaveBeenCalledOnce()
    expect(mockedDownloadTextFile.mock.calls[0][1]).toContain('calc-stable-report-id')
  })

  it('uses the same stable calculation ID for HTML and Markdown exports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)

    useCalculationStore.setState({
      draft: defaultPunchingShearInput,
      punchingShearResult: result,
      punchingShearReport: report,
      activeCalculationId: 'calc-shared-id',
    })

    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: true,
      filename: 'truebim-punching-shear-report-calc-shared-id.html',
    })
    expect(exportCurrentCalculationAsMarkdown()).toEqual({
      ok: true,
      filename: 'truebim-punching-shear-report-calc-shared-id.md',
    })
    expect(mockedDownloadTextFile.mock.calls[0][1]).toContain('calc-shared-id')
    expect(mockedDownloadTextFile.mock.calls[1][1]).toContain('calc-shared-id')
  })
})
