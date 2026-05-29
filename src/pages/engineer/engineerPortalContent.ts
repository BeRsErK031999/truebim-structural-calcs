import { getVerifiedCapabilityMatrix } from '@/calculations/punching-shear/verified/verifiedCapabilities'

export const engineerPortalRoute = '/engineer'

export const officeAppLinks = [
  'http://192.168.22.37/',
  'http://192.168.22.37/review',
  'http://192.168.22.37/validation-session',
  'http://192.168.22.37/release-evidence',
  'http://192.168.22.37/diagnostics',
] as const

export const engineerWorkflowSteps = [
  {
    title: 'Run calculation',
    href: '/',
    description: 'Create or load the punching shear calculation and export the report.',
    action: 'Check inputs, units, warnings, verification level, verified features and draft features.',
    returnToDeveloper: 'HTML/Markdown report and the calculation identifier from the export.',
  },
  {
    title: 'Check report',
    href: '/validation-session',
    description: 'Collect the calculation report, validation package metadata and checklist progress.',
    action: 'Link the latest review, export report files, add trusted evidence references and freeze the snapshot.',
    returnToDeveloper: 'Validation session package with manifest, checklist and engineer notes.',
  },
  {
    title: 'Fill Engineering Review',
    href: '/review',
    description: 'Compare app values against WebCAD, Excel, manual or normative trusted evidence.',
    action: 'Fill source, checked-by, checked-at, expected values, tolerances and axis convention notes.',
    returnToDeveloper: 'Review snapshot and verification candidate JSON after manual acceptance.',
  },
  {
    title: 'Download Release Evidence',
    href: '/release-evidence',
    description: 'Export the audit bundle for release reproducibility and diagnostics.',
    action: 'Download HTML, Markdown or JSON evidence without changing verification status.',
    returnToDeveloper: 'Release evidence bundle and trusted evidence attachments.',
  },
] as const

export const engineerReturnChecklist = [
  'HTML/Markdown report',
  'review snapshot',
  'verification candidate JSON',
  'validation session package',
  'trusted evidence attachments',
  'filled checklist',
] as const

export const engineerInstructionsText = [
  'Engineer handoff instructions',
  '',
  '1. Run the calculation and review warnings, verification level, verified features and draft features.',
  '2. Check the report against trusted WebCAD, Excel, manual or normative evidence.',
  '3. Fill Engineering Review with source, checked-by, checked-at, expected values and axis notes.',
  '4. Create and export the verification candidate JSON only after manual acceptance.',
  '5. Build the validation session package and attach trusted evidence references.',
  '6. Export release evidence for audit and reproducibility.',
  '',
  'Important: accepted review and candidate JSON do not promote VERIFIED. Draft features remain draft until manual dataset import and verification runner pass.',
] as const

export function buildEngineerInstructionsCopyText() {
  return engineerInstructionsText.join('\n')
}

export function buildReturnChecklistCopyText() {
  return ['What to return to developer:', ...engineerReturnChecklist.map((item) => `- ${item}`)].join('\n')
}

export function buildCurrentAppLinksCopyText() {
  return ['Current app links:', ...officeAppLinks.map((link) => `- ${link}`)].join('\n')
}

export function getEngineerPortalCapabilitySummary() {
  const capabilities = getVerifiedCapabilityMatrix()

  return {
    verified: capabilities.filter((capability) => capability.status === 'verified'),
    partial: capabilities.filter((capability) => capability.status === 'partial'),
    draft: capabilities.filter((capability) => capability.status === 'draft'),
  }
}
