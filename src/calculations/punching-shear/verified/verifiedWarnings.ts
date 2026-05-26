import type { VerifiedStatus } from './verifiedMode'

export function createVerifiedWarnings(status: VerifiedStatus) {
  if (status.verificationLevel === 'verified') {
    return [
      'Verified scope is limited to the listed features; global SP63 support remains draft.',
    ]
  }

  if (status.verificationLevel === 'partial') {
    return [
      'Partially verified calculation: only listed verified features have trusted evidence.',
      'Center moment transfer remains provisional until a trusted moment verification case passes.',
    ]
  }

  return [
    'Draft-only calculation: no trusted verified evidence is linked to this feature set.',
  ]
}
