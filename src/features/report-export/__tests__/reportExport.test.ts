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
  formatUtilization,
  exportCurrentCalculationAsHtml,
  exportCurrentCalculationAsMarkdown,
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

  it('builds an HTML report with the draft warning', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('ЧЕРНОВОЙ РАСЧЕТ - НЕ ДЛЯ ПРОЕКТНОГО ПРИМЕНЕНИЯ')
    expect(html).toContain('TrueBIM: отчет по продавливанию')
  })

  it('includes verification capability sections', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('Возможности проверки')
    expect(html).toContain('Доказательства проверки')
    expect(markdown).toContain('## Возможности проверки')
    expect(markdown).toContain('verified-center-rect-001')
  })

  it('includes the applicability section in exported reports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('Применимость')
    expect(html).toContain('Подходит для пилотной проверки, сравнения и сбора доказательств.')
    expect(html).toContain('Это не финальный проектный документ')
    expect(markdown).toContain('## Применимость')
    expect(markdown).toContain('- Частичные возможности: нет')
    expect(markdown).toContain('- Черновые возможности: нет')
  })

  it('builds a Markdown report with the formula', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(markdown).toContain('v = N / (u * h0)')
  })

  it('includes the calculation trace section in exported reports', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('Трассировка')
    expect(html).toContain('раздел / шаг')
    expect(html).toContain('формула | подстановка | результат | источник проверки')
    expect(html).toContain('Input validation')
    expect(html).toContain('Verified evidence - center-force-only evidence: verified-center-rect-001')
    expect(markdown).toContain('## Трассировка расчета')
    expect(markdown).not.toContain('## Трассировка\n\n## Трассировка расчета')
    expect(markdown).toContain('| раздел / шаг | формула \\| подстановка \\| результат \\| источник проверки |')
    expect(markdown).toContain('Calculation Trace / Stress')
    expect(markdown).toContain('v = N / (u * h0)')
  })

  it('includes scenario trace steps in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
      multipleContours: {
        enabled: true,
        count: 2,
        offsetStep: 'h0/2' as const,
      },
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(html).toContain('Center Moment Trace / Moment eccentricity')
    expect(html).toContain('Трассировка нескольких контуров / Выбор критического чернового контура')
    expect(html).toContain('Shear Reinforcement Trace / Draft reinforcement contribution')
    expect(markdown).toContain('Center Moment Trace / Moment eccentricity')
    expect(markdown).toContain('Moment transfer is partial/draft and requires trusted evidence.')
  })

  it('includes moment transfer and stress distribution sections', () => {
    const input = {
      ...defaultPunchingShearInput,
      forces: {
        axialForceKn: 420,
        momentXKnM: 12,
        momentYKnM: 8,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(html).toContain('Передача моментов')
    expect(html).toContain('Трассировка')
    expect(html).toContain('Mx - момент в плоскости оси X')
    expect(html).toContain('ЧЕРНОВОЕ предварительное линейное перераспределение')
    expect(markdown).toContain('## Передача моментов')
    expect(markdown).toContain('## Трассировка')
    expect(markdown).toContain('Mx - момент в плоскости оси X')
  })

  it('includes input N and calculated u, h0, v and utilization values', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(markdown).toContain(`| N | ${defaultPunchingShearInput.forces.axialForceKn} кН |`)
    expect(markdown).toContain(`| u | ${result.controlPerimeterMm} mm |`)
    expect(markdown).toContain(`| h0 | ${result.effectiveDepthMm} mm |`)
    expect(markdown).toContain(`| v | ${result.shearStressMpa?.toFixed(3)} MPa |`)
    expect(markdown).toContain(
      `| коэффициент использования | ${result.utilizationRatio?.toFixed(3)} (${(
        (result.utilizationRatio ?? 0) * 100
      ).toFixed(1)}%) |`,
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

  it('includes assumptions, unsupported features and verification source in reports', () => {
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

    expect(html).toContain('допущения')
    expect(html).toContain('Отверстия используют черновую геометрию вычитания по касательным')
    expect(html).toContain('Не поддерживается в этом черновике')
    expect(html).toContain('проверенные коэффициенты СП 63')
    expect(html).toContain('Источник проверки')
    expect(html).toContain('НЕ ПРОВЕРЕНО')
    expect(markdown).toContain('допущения')
    expect(markdown).toContain('## Не поддерживается в этом черновике')
    expect(markdown).toContain('- Источник проверки: НЕ ПРОВЕРЕНО')
  })

  it('renders SVG numeric labels and axes in HTML report', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)

    expect(html).toContain('400 mm column X')
    expect(html).toContain('95 mm draft offset')
    expect(html).toContain('X')
    expect(html).toContain('Y')
    expect(html).toContain('Scale: 1 unit = 1 mm, fit-to-view')
  })

  it('includes wall geometry section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'wall-end' as const,
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.wallGeometrySummary).toMatchObject({
      enabled: true,
      wallLengthMm: 1200,
      wallThicknessMm: 200,
    })
    expect(html).toContain('Геометрия стены')
    expect(html).toContain('длина стены')
    expect(markdown).toContain('### Геометрия стены')
    expect(markdown).toContain('| длина стены | 1200 мм |')
    expect(markdown).toContain('Поддержка продавливания у конца стены является только черновой геометрией.')
  })

  it('hides unused geometry sections for the center case', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)
    const report = buildPunchingShearReport(defaultPunchingShearInput, result)
    const html = buildPunchingShearHtmlReport(defaultPunchingShearInput, result, report)
    const markdown = buildPunchingShearMarkdownReport(defaultPunchingShearInput, result, report)

    expect(html).not.toContain('<h3>Геометрия стены</h3>')
    expect(html).not.toContain('<h3>Геометрия угла стены</h3>')
    expect(markdown).not.toContain('### Геометрия стены')
    expect(markdown).not.toContain('### Геометрия угла стены')
  })

  it('includes wall corner geometry section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'wall-corner' as const,
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.wallCornerGeometrySummary).toMatchObject({
      enabled: true,
      wallLengthXMm: 1200,
      wallLengthYMm: 1000,
      wallThicknessXMm: 200,
      wallThicknessYMm: 220,
      orientation: 'top-left',
      applicability: 'draft-only',
    })
    expect(html).toContain('Геометрия угла стены')
    expect(html).toContain('длина стены X')
    expect(markdown).toContain('### Геометрия угла стены')
    expect(markdown).toContain('| длина стены X | 1200 мм |')
    expect(markdown).toContain('Поддержка продавливания в углу стены является только черновой геометрией.')
  })

  it('includes round column geometry section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      caseType: 'round' as const,
      roundColumn: {
        diameterMm: 400,
        slabThickness: 220,
        effectiveDepth: 190,
        cover: 30,
        position: 'center' as const,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.roundGeometrySummary).toMatchObject({
      enabled: true,
      diameterMm: 400,
      position: 'center',
      applicability: 'draft-only',
    })
    expect(html).toContain('диаметр')
    expect(html).toContain('400 мм')
    expect(markdown).toContain('| диаметр | 400 мм |')
    expect(markdown).toContain('Периметр круглой колонны является черновым и требует проверки по СП 63.')
  })

  it('includes multiple control perimeter section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      multipleContours: {
        enabled: true,
        count: 2,
        offsetStep: 'h0/2' as const,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(html).toContain('Несколько контрольных контуров')
    expect(html).toContain('Выбор нескольких контуров является черновым и требует проверки по СП 63.')
    expect(markdown).toContain('## Несколько контрольных контуров')
    expect(markdown).toContain('draft-contour-1')
  })

  it('includes shear reinforcement section in exported reports', () => {
    const input = {
      ...defaultPunchingShearInput,
      shearReinforcement: {
        ...defaultPunchingShearInput.shearReinforcement,
        enabled: true,
      },
    }
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const html = buildPunchingShearHtmlReport(input, result, report)
    const markdown = buildPunchingShearMarkdownReport(input, result, report)

    expect(report.shearReinforcementSummary).toMatchObject({
      enabled: true,
      steelClass: 'A400',
      layoutType: 'closed-stirrups',
      rowCount: 2,
      legsPerRow: 4,
    })
    expect(html).toContain('Поперечная арматура')
    expect(html).toContain('closed-stirrups')
    expect(markdown).toContain('## Поперечная арматура')
    expect(markdown).toContain('| класс стали | A400 |')
    expect(markdown).toContain('Вклад поперечной арматуры является черновым при включении')
  })

  it('includes SP63 interaction benchmark sections in exported reports', () => {
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
    expect(html).toContain('Предельные усилия по бетону')
    expect(html).toContain('Mathcad benchmark values match within test tolerance')
    expect(html).toContain('Проверка за зоной усиления')
    expect(markdown).toContain('## Проверка за зоной усиления')
    expect(markdown).toContain('SP63 Interaction Benchmark Trace / Interaction check')
  })

  it('formats copy report summary', () => {
    const result = calculatePunchingShear(defaultPunchingShearInput)

    expect(buildReportSummary(result)).toBe(
      'N=420kN | u=2360mm | h0=190mm | v=0.937MPa | util=0.892',
    )
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

    expect(exportCurrentCalculationAsHtml()).toMatchObject({
      ok: true,
      filename: 'truebim-punching-shear-report-calc-shared-id.html',
    })
    expect(exportCurrentCalculationAsMarkdown()).toMatchObject({
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
    expect(mockedDownloadTextFile).not.toHaveBeenCalled()
  })
})
