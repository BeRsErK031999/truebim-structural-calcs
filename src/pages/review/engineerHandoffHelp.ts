export const engineerHandoffLinks = [
  { label: 'Инструкция инженеру', href: '/docs/engineer-handoff.md' },
  { label: 'Checklist review', href: '/docs/engineer-review-checklist.md' },
  { label: 'Evidence templates', href: '/docs/evidence-template-pack/README.md' },
] as const

export const reviewCandidateHandoffHint =
  'После accepted review создайте verification candidate и отправьте JSON разработчику. Candidate != VERIFIED и не добавляется автоматически в verification dataset.'

export const engineerChecklistCopyText = [
  '# Engineer Review Checklist',
  '',
  '- [ ] input data checked',
  '- [ ] units checked',
  '- [ ] axis convention checked',
  '- [ ] Mx/My signs checked',
  '- [ ] perimeter checked',
  '- [ ] h0 checked',
  '- [ ] max stress checked',
  '- [ ] min stress checked',
  '- [ ] utilization checked',
  '- [ ] unsupported features acknowledged',
  '- [ ] draft warnings acknowledged',
  '- [ ] source named',
  '- [ ] checkedBy filled',
  '- [ ] checkedAt filled',
  '- [ ] attachments/screenshots attached',
  '- [ ] candidate exported',
].join('\n')

export const candidateReturnInstructionsCopyText = [
  '# Candidate Return Instructions',
  '',
  'Верните разработчику:',
  '- HTML report;',
  '- Markdown report, если выгружен;',
  '- review snapshot JSON или HTML;',
  '- verification candidate JSON;',
  '- заполненный engineer review checklist;',
  '- trusted evidence attachments: WebCAD, Excel, PDF, screenshots, manual calculation;',
  '- axis convention notes и комментарии по Mx/My signs;',
  '- список расхождений и решение инженера.',
  '',
  'Accepted Review != VERIFIED.',
  'Candidate != VERIFIED.',
  'Candidate не импортируется автоматически в verification dataset.',
].join('\n')
