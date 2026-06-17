import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'
import { calculatePunchingShear } from '@/calculations/punching-shear/engine'
import { buildPunchingShearReport } from '@/calculations/punching-shear/report'
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

  it('builds exported reports around the engineering calculation sequence', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('TrueBIM: отчет по продавливанию')
    expect(html).toContain('ЧЕРНОВОЙ РАСЧЕТ - НЕ ДЛЯ ПРОЕКТНОГО ПРИМЕНЕНИЯ')
    expect(html).toContain('1. Итог проверки')
    expect(html).toContain('2. Исходные данные')
    expect(html).toContain('3. Ход расчета')
    expect(html).toContain('4. Проверка условия')
    expect(html).toContain('5. Заключение')
    expect(markdown).toContain('## 1. Итог проверки')
    expect(markdown).toContain('## 3. Ход расчета')
    expect(markdown).toContain('v = N / (u × h0)')
    expect(markdown).toContain('η = v / R')
  })

  it('renders formulas as listing lines rather than trace cards', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(markdown).toContain('Ab = u × h0')
    expect(markdown).toContain('Ab = 2360 × 190')
    expect(markdown).toContain('Ab = 448400 мм²')
    expect(markdown).not.toContain('Формула:')
    expect(markdown).not.toContain('Подстановка:')
    expect(markdown).not.toContain('Результат:')
    expect(html).not.toContain('Формула:')
    expect(html).not.toContain('Подстановка:')
    expect(html).not.toContain('Результат:')
  })

  it('does not expose pseudo formulas or raw n/a values in user-facing exports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    for (const content of [markdown, html]) {
      expect(content).not.toMatch(/\bu = u\b|\bh0 = h0\b|\bR = R\b|η = η/)
      expect(content).not.toContain('n/a')
      expect(content).toContain('Параметр недоступен для данного режима расчета.')
    }
  })

  it('keeps verification, evidence, applicability and metadata in service information', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const metadata = {
      generatedAt: '2026-05-26T04:17:54.000Z',
      calculationId: 'ps-center-20260526-041754-d576a71',
      verificationSource: 'NOT VERIFIED' as const,
    }
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report, metadata)
    const markdown = buildPunchingShearMarkdownReport(
      defaultPunchingShearInput,
      result,
      report,
      metadata,
    )

    expect(html).toContain('6. Служебная информация')
    expect(html).toContain('Статус проверки')
    expect(html).toContain('Доказательства проверки')
    expect(html).toContain('Применимость')
    expect(html).toContain('Метаданные')
    expect(html).toContain('НЕ ПРОВЕРЕНО')
    expect(markdown).toContain('## 6. Служебная информация')
    expect(markdown).toContain('### Статус проверки')
    expect(markdown).toContain('verified-center-rect-001')
    expect(markdown).toContain('ps-center-20260526-041754-d576a71')
  })

  it('includes moment transfer, reinforcement, and SP63 values inside the calculation listing', () => {
    const input = {
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 800,
        momentXKnM: 60,
        momentYKnM: 50,
      },
      concrete: {
        className: 'B30' as const,
      },
      rectColumn: {
        widthXMm: 500,
        widthYMm: 800,
      },
      shearReinforcement: {
        enabled: true,
        barDiameterMm: 6,
        barSpacingMm: 60,
        rowCount: 1,
        legsPerRow: 2,
        steelClass: 'A240' as const,
        firstRowDistanceMm: 65,
        rowSpacingMm: 60,
        layoutType: 'custom' as const,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(result.sp63Interaction?.benchmarkStatus).toBe('matched')
    expect(html).toContain('Передача моментов')
    expect(html).toContain('Поперечная арматура')
    expect(html).toContain('Fb.ult')
    expect(html).toContain('Mx.ult')
    expect(html).toContain('Fult')
    expect(markdown).toContain('### Передача моментов')
    expect(markdown).toContain('### Поперечная арматура')
    expect(markdown).toContain('Wx =')
    expect(markdown).toContain('Wy =')
  })

  it('renders SVG numeric labels and axes in HTML report', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('400 mm колонна X')
    expect(html).toContain('95 mm черновое смещение')
    expect(html).toContain('X')
    expect(html).toContain('Y')
    expect(html).toContain('Масштаб: 1 единица = 1 мм, вписано в область')
  })

  it('formats copy report summary', () => {
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

  it('guards export when no calculation exists', () => {
    expect(exportCurrentCalculationAsHtml()).toEqual({
      ok: false,
      error: 'Сначала выполните расчет, затем выгрузите отчет.',
    })
    expect(exportCurrentCalculationAsMarkdown()).toEqual({
      ok: false,
      error: 'Сначала выполните расчет, затем выгрузите отчет.',
    })
    expect(mockedDownloadTextFile).not.toHaveBeenCalled()
  })
})
