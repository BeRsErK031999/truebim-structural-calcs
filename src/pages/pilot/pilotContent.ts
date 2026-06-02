import { getVerifiedCapabilityMatrix, type VerifiedCapability } from '@/calculations/punching-shear/verified/verifiedCapabilities'
import { listPilotFeedback } from '@/features/pilot-feedback'
import { listValidationSessions } from '@/features/validation-session'

export const pilotRoute = '/pilot'

export const pilotWarnings = [
  'VERIFIED does not mean full SP63 support.',
  'Edge columns, corner columns, and openings are still DRAFT.',
  'Moment transfer is PARTIAL and requires trusted engineering evidence.',
  'Every pilot calculation requires manual review before engineering use.',
  'Trusted evidence must be returned with the validation package.',
] as const

export const pilotQuickStartSteps = [
  {
    title: 'Run calculation',
    description: 'Enter geometry, materials, forces, and run the punching shear calculation.',
    href: '/',
  },
  {
    title: 'Check report',
    description: 'Export or inspect the calculation report and note all assumptions.',
    href: '/',
  },
  {
    title: 'Open Review',
    description: 'Compare app output against trusted manual, Excel, WebCAD, or reference evidence.',
    href: '/review',
  },
  {
    title: 'Create Candidate',
    description: 'Create a verification candidate only after trusted values and review status are filled.',
    href: '/review',
  },
  {
    title: 'Prepare Validation Session',
    description: 'Link review evidence, freeze regression context, and export the validation package manifest.',
    href: '/validation-session',
  },
  {
    title: 'Send package to developer',
    description: 'Return report, review snapshot, candidate JSON, validation package, and feedback JSON.',
    href: '/release-evidence',
  },
] as const

export const pilotReadinessNotes = [
  'Center force-only calculations are VERIFIED for the current trusted case scope.',
  'Center calculations with Mx/My are supported as PARTIAL moment-transfer pilot cases.',
  'Edge, corner, opening, reinforcement, and round-column cases must be treated as DRAFT.',
  'Review accepted status records evidence only and never promotes auto VERIFIED.',
] as const

export type PilotDashboard = {
  verifiedFeatures: VerifiedCapability[]
  partialFeatures: VerifiedCapability[]
  draftFeatures: VerifiedCapability[]
  feedbackCount: number
  validationSessionsCount: number
  candidatesCount: number
  releaseEvidenceStatus: 'ready' | 'needs-validation-package'
}

export function buildPilotDashboard(storage: Storage | undefined = globalThis.localStorage): PilotDashboard {
  const capabilities = getVerifiedCapabilityMatrix()
  const validationSessions = listValidationSessions(storage)
  const candidatesCount = validationSessions.filter((session) => session.candidate).length

  return {
    verifiedFeatures: capabilities.filter((capability) => capability.status === 'verified'),
    partialFeatures: capabilities.filter((capability) => capability.status === 'partial'),
    draftFeatures: capabilities.filter((capability) => capability.status === 'draft'),
    feedbackCount: listPilotFeedback(storage).length,
    validationSessionsCount: validationSessions.length,
    candidatesCount,
    releaseEvidenceStatus: validationSessions.some((session) => session.exports.packageExported)
      ? 'ready'
      : 'needs-validation-package',
  }
}
