import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  candidateReturnInstructionsCopyText,
  engineerChecklistCopyText,
  engineerHandoffLinks,
  reviewCandidateHandoffHint,
} from '../engineerHandoffHelp'

describe('engineer handoff help', () => {
  it('help links render from the review help model', () => {
    expect(engineerHandoffLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Инструкция инженеру',
          href: '/docs/engineer-handoff.md',
        }),
        expect.objectContaining({
          label: 'Checklist review',
          href: '/docs/engineer-review-checklist.md',
        }),
      ]),
    )
  })

  it('review hint mentions candidate is not verified', () => {
    expect(reviewCandidateHandoffHint).toContain('accepted review')
    expect(reviewCandidateHandoffHint).toContain('Candidate != VERIFIED')
    expect(reviewCandidateHandoffHint).toContain('не добавляется автоматически')
  })

  it('checklist copy text exists', () => {
    expect(engineerChecklistCopyText).toContain('input data checked')
    expect(engineerChecklistCopyText).toContain('axis convention checked')
    expect(engineerChecklistCopyText).toContain('candidate exported')
  })

  it('return instructions copy text names expected evidence package', () => {
    expect(candidateReturnInstructionsCopyText).toContain('verification candidate JSON')
    expect(candidateReturnInstructionsCopyText).toContain('trusted evidence attachments')
    expect(candidateReturnInstructionsCopyText).toContain('Candidate != VERIFIED')
  })

  it('README has engineer handoff docs links', () => {
    const readme = readFileSync('README.md', 'utf-8')

    expect(readme).toContain('Engineer handoff')
    expect(readme).toContain('docs/engineer-handoff.md')
    expect(readme).toContain('docs/engineer-review-checklist.md')
    expect(readme).toContain('docs/evidence-template-pack/README.md')
  })
})
