import { describe, expect, it } from 'vitest'

import {
  buildCurrentAppLinksCopyText,
  buildReturnChecklistCopyText,
  engineerPortalRoute,
  engineerReturnChecklist,
  engineerWorkflowSteps,
  getEngineerPortalCapabilitySummary,
  officeAppLinks,
} from '../engineerPortalContent'

describe('engineer portal content', () => {
  it('defines the engineer portal route', () => {
    expect(engineerPortalRoute).toBe('/engineer')
  })

  it('contains the required portal links', () => {
    expect(engineerWorkflowSteps.map((step) => step.href)).toEqual([
      '/',
      '/validation-session',
      '/review',
      '/release-evidence',
    ])
  })

  it('contains the return checklist text', () => {
    const checklistText = buildReturnChecklistCopyText()

    expect(engineerReturnChecklist).toContain('HTML/Markdown отчет')
    expect(engineerReturnChecklist).toContain('снимок проверки')
    expect(engineerReturnChecklist).toContain('JSON кандидата проверки')
    expect(engineerReturnChecklist).toContain('пакет сессии проверки')
    expect(engineerReturnChecklist).toContain('приложения с доверенными расчетами')
    expect(engineerReturnChecklist).toContain('заполненный чеклист')
    expect(checklistText).toContain('Что вернуть разработчику:')
  })

  it('copies current app links with office URLs', () => {
    const linksText = buildCurrentAppLinksCopyText()

    for (const link of officeAppLinks) {
      expect(linksText).toContain(link)
    }
  })

  it('does not claim VERIFIED for draft features', () => {
    const summary = getEngineerPortalCapabilitySummary()

    expect(summary.draft.length).toBeGreaterThan(0)
    expect(summary.draft.every((capability) => capability.status === 'draft')).toBe(true)
    expect(summary.draft.map((capability) => capability.id)).toEqual(
      expect.arrayContaining(['edge', 'corner', 'openings', 'shear-reinforcement', 'round-columns']),
    )
  })
})
