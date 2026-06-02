export type VerifiedFeatureId =
  | 'center-force-only'
  | 'center-moment-transfer'
  | 'edge'
  | 'corner'
  | 'openings'
  | 'wall-end'
  | 'shear-reinforcement'
  | 'round-columns'

export type VerifiedCapabilityStatus = 'verified' | 'partial' | 'draft'

export type VerificationLevel = 'verified' | 'partial' | 'draft'

export type VerificationEvidence = {
  id: string
  title: string
  source: string
  verificationSource: string
  checkedBy: string | null
  checkedAt: string | null
  status: VerifiedCapabilityStatus
}

export type VerifiedStatus = {
  verifiedMode: VerificationLevel
  verificationLevel: VerificationLevel
  verifiedFeatures: VerifiedFeatureId[]
  draftFeatures: VerifiedFeatureId[]
  verificationEvidenceIds: string[]
  verificationEvidence: VerificationEvidence[]
}
