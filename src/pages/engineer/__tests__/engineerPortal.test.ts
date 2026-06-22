import { describe, expect, it } from 'vitest'

import {
  buildCurrentAppLinksCopyText,
  buildReturnChecklistCopyText,
  engineerPortalRoute,
  engineerReturnChecklist,
  engineerWorkflowSteps,
  getEngineerPortalCapabilitySummary,
  officeAppLinkActions,
} from '../engineerPortalContent'

describe('engineer portal content', () => {
  it('defines the engineer portal route', () => {
    expect(engineerPortalRoute).toBe('/engineer')
  })

  it('shows the engineer workflow as four ordered steps', () => {
    expect(engineerWorkflowSteps.map((step) => step.title)).toEqual([
      'Выполнить расчет',
      'Сравнить с эталоном',
      'Подтвердить проверку',
      'Скачать материалы проверки',
    ])

    expect(engineerWorkflowSteps.map((step) => step.href)).toEqual([
      '/',
      '/review',
      '/validation-session',
      '/release-evidence',
    ])
  })

  it('contains human-readable verification materials', () => {
    const checklistText = buildReturnChecklistCopyText()

    expect(engineerReturnChecklist).toContain('Отчет расчета')
    expect(engineerReturnChecklist).toContain('Сохраненная версия проверки')
    expect(engineerReturnChecklist).toContain('Черновик результатов проверки')
    expect(engineerReturnChecklist).toContain('Архив проверки с чеклистом')
    expect(engineerReturnChecklist).toContain('Эталонные расчеты')
    expect(checklistText).toContain('Материалы проверки:')
  })

  it('hides office URLs behind action labels in copied app sections', () => {
    const linksText = buildCurrentAppLinksCopyText()

    for (const link of officeAppLinkActions) {
      expect(linksText).toContain(link.label)
      expect(linksText).toContain(link.href)
    }

    expect(linksText).not.toContain('http://192.168.22.37')
  })

  it('does not expose developer terms in start-page copy', () => {
    const pageCopy = [
      ...engineerWorkflowSteps.flatMap((step) => [
        step.title,
        step.description,
        step.action,
        step.preparedMaterials,
        step.buttonLabel,
      ]),
      ...engineerReturnChecklist,
      buildReturnChecklistCopyText(),
      buildCurrentAppLinksCopyText(),
    ].join(' ')

    expect(pageCopy.toLowerCase()).not.toMatch(
      /manifest|snapshot|validation package|release evidence|trusted evidence|json|markdown/,
    )
  })

  it('does not claim verified status for unchecked calculation areas', () => {
    const summary = getEngineerPortalCapabilitySummary()

    expect(summary.draft.length).toBeGreaterThan(0)
    expect(summary.draft.every((capability) => capability.status === 'draft')).toBe(true)
    expect(summary.draft.map((capability) => capability.id)).toEqual(
      expect.arrayContaining(['edge', 'corner', 'openings', 'shear-reinforcement', 'round-columns']),
    )
  })
})
