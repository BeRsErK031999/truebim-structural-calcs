import { describe, expect, it } from 'vitest'

import { featureLabels, formatFeatureLabel } from '../featureLabels'

const knownFeatures = [
  'center-force-only',
  'center-moment-transfer',
  'edge',
  'corner',
  'openings',
  'wall-end',
  'wall-corner',
  'multiple-contours',
  'shear-reinforcement',
  'round-columns',
  'round-center',
  'round-edge',
  'round-corner',
]

describe('feature labels', () => {
  it('covers known punching shear feature IDs with readable labels', () => {
    for (const feature of knownFeatures) {
      expect(featureLabels[feature]).toBeTruthy()
      expect(formatFeatureLabel(feature)).not.toBe(feature)
    }
  })
})
