import { describe, expect, it } from 'vitest'

import {
  buildPilotFeedbackExport,
  buildPilotFeedbackExportFileName,
  pilotIssueCategories,
  savePilotFeedback,
} from '@/features/pilot-feedback'
import { createValidationSession, saveValidationSession } from '@/features/validation-session'
import { calculatePunchingShear, buildPunchingShearReport } from '@/calculations/punching-shear'
import { defaultPunchingShearInput } from '@/calculations/punching-shear/defaults'

import {
  buildPilotDashboard,
  pilotNotDesignUseItems,
  pilotRoadmapItems,
  pilotRoute,
  pilotUsableItems,
  pilotWarnings,
} from '../pilotContent'

describe('pilot mode', () => {
  it('defines the pilot route', () => {
    expect(pilotRoute).toBe('/pilot')
  })

  it('renders the required issue categories through content data', () => {
    expect(pilotIssueCategories).toEqual([
      'UI',
      'Геометрия',
      'Напряжения',
      'Проверка',
      'Экспорт',
      'Процесс проверки',
      'Документация',
      'Другое',
    ])
  })

  it('renders pilot engineer warnings through content data', () => {
    expect(pilotWarnings).toEqual(
      expect.arrayContaining([
        'Статус ПРОВЕРЕНО не означает полную поддержку СП 63.',
        'Крайние колонны, угловые колонны и отверстия пока остаются черновыми.',
        'Передача моментов поддерживается частично и требует доверенной инженерной проверки.',
        'Каждый пилотный расчет требует ручной проверки перед инженерным применением.',
        'Доверенные проверочные материалы нужно вернуть вместе с пакетом валидации.',
      ]),
    )
  })

  it('exposes pilot readiness text and roadmap items', () => {
    expect(pilotUsableItems).toEqual(
      expect.arrayContaining([
        'Тестировать расчетный UI и сравнивать результат с доверенными инженерными материалами.',
        'Выгружать HTML/Markdown отчеты для пакетов проверки.',
        'Использовать режим проверки для фиксации принятия, отклонения и расхождений.',
      ]),
    )
    expect(pilotNotDesignUseItems).toEqual(
      expect.arrayContaining([
        'Нельзя использовать приложение как единственный источник проектного решения.',
        'Нельзя считать полную поддержку СП 63.13330.2018 реализованной.',
      ]),
    )
    expect(pilotRoadmapItems).toEqual(
      expect.arrayContaining([
        'Проверенный центр только от силы',
        'Проверенный центр с моментами',
        'Проверенные край/угол',
        'Проверенные отверстия',
        'Случаи у стены и торца стены',
        'Несколько контрольных контуров',
        'Поперечная арматура',
        'Официальный отчет DOCX/PDF',
        'Полная трассировка СП 63',
        'Пакет эталонных примеров',
      ]),
    )
  })

  it('does not claim complete SP63 production coverage in pilot copy', () => {
    const pilotCopy = [
      ...pilotWarnings,
      ...pilotUsableItems,
      ...pilotNotDesignUseItems,
      ...pilotRoadmapItems,
    ].join('\n')

    expect(pilotCopy).not.toMatch(new RegExp(['full', 'SP63', 'production', 'support'].join(' '), 'i'))
    expect(pilotCopy).not.toMatch(new RegExp(['production', 'SP63', 'support', 'is', 'implemented'].join(' '), 'i'))
  })

  it('counts dashboard readiness data from local storage', () => {
    const storage = createMemoryStorage()
    const input = defaultPunchingShearInput
    const result = calculatePunchingShear(input)
    const report = buildPunchingShearReport(input, result)
    const session = createValidationSession({ input, result, report })

    savePilotFeedback(
      {
        engineer: 'Инженер',
        date: '2026-06-02',
        calculation: 'center + Mx',
        category: 'Напряжения',
        problem: 'Проверить точку напряжений',
        note: 'Нужна проверка',
        suggestion: 'Вернуть доверенное сравнение',
        calculationId: 'calc-1',
        reviewStatus: 'accepted',
        verificationLevel: 'partial',
      },
      storage,
      new Date('2026-06-02T08:00:00.000Z'),
    )
    saveValidationSession(
      {
        ...session,
        candidate: {
          id: 'candidate-1',
          createdAt: '2026-06-02T08:00:00.000Z',
          sourceReviewSessionId: 'review-1',
          calculationId: 'calc-1',
          input,
          expected: {},
          tolerances: {},
          source: 'manual',
          checkedBy: 'Engineer',
          checkedAt: '2026-06-02',
          comparisonNotes: '',
          axisConventionNotes: '',
          attachments: [],
          candidateStatus: 'incomplete',
        },
        exports: {
          ...session.exports,
          packageExported: true,
        },
      },
      storage,
    )

    const dashboard = buildPilotDashboard(storage)

    expect(dashboard.verifiedFeatures).toHaveLength(1)
    expect(dashboard.partialFeatures).toHaveLength(1)
    expect(dashboard.draftFeatures).toHaveLength(6)
    expect(dashboard.draftFeatures).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'wall-end' })]),
    )
    expect(dashboard.feedbackCount).toBe(1)
    expect(dashboard.validationSessionsCount).toBe(1)
    expect(dashboard.candidatesCount).toBe(1)
    expect(dashboard.releaseEvidenceStatus).toBe('ready')
  })

  it('exports feedback JSON with app and review metadata', () => {
    const storage = createMemoryStorage()
    const entry = savePilotFeedback(
      {
        engineer: 'Инженер',
        date: '2026-06-02',
        calculation: 'edge',
        category: 'Геометрия',
        problem: 'Расхождение обрезки границы',
        note: 'Сравнить с ручным эскизом',
        suggestion: 'Добавить поле скриншота в пакет',
        calculationId: 'calc-edge-1',
        reviewStatus: 'needs-investigation',
        verificationLevel: 'draft',
      },
      storage,
      new Date('2026-06-02T09:00:00.000Z'),
    )

    const exported = buildPilotFeedbackExport(
      [entry],
      {
        version: '1.2.3',
        commit: 'abc1234',
        buildTime: '2026-06-02T08:00:00.000Z',
        environment: 'production',
      },
      new Date('2026-06-02T10:00:00.000Z'),
    )

    expect(buildPilotFeedbackExportFileName(new Date('2026-06-02T10:00:00.000Z'))).toBe(
      'pilot-feedback-2026-06-02.json',
    )
    expect(exported.appVersion).toBe('1.2.3')
    expect(exported.commit).toBe('abc1234')
    expect(exported.feedback[0]).toMatchObject({
      category: 'Геометрия',
      calculationId: 'calc-edge-1',
      reviewStatus: 'needs-investigation',
      verificationLevel: 'draft',
      notes: expect.stringContaining('Расхождение обрезки границы'),
    })
  })
})

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}
