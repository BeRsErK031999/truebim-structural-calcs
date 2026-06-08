import type { Sp63BenchmarkStatus } from './sp63Types'

export const sp63BenchmarkCandidateWarning =
  'SP63 interaction benchmark candidate based on Mathcad fixture; not VERIFIED for design use.'

export function createSp63BenchmarkWarnings(status: Sp63BenchmarkStatus) {
  return [
    sp63BenchmarkCandidateWarning,
    status === 'matched'
      ? 'Mathcad benchmark values match within test tolerance, but verified capability promotion is still pending engineer acceptance.'
      : 'SP63 interaction benchmark result is pending comparison with trusted evidence for this exact input.',
  ]
}

