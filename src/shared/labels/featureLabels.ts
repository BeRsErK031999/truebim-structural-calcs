export const featureLabels: Record<string, string> = {
  'center-force-only': 'центральная колонна, только сила',
  'center-moment-transfer': 'центральная колонна с моментами',
  edge: 'крайняя колонна',
  corner: 'угловая колонна',
  openings: 'отверстия',
  'wall-end': 'продавливание у конца стены',
  'wall-corner': 'продавливание в углу стены',
  'multiple-contours': 'несколько контрольных контуров',
  'shear-reinforcement': 'поперечная арматура',
  'round-columns': 'круглые колонны',
  'round-center': 'круглая колонна в центре',
  'round-edge': 'круглая колонна у края',
  'round-corner': 'круглая колонна в углу',
}

export function formatFeatureLabel(feature: string) {
  return featureLabels[feature] ?? feature
}
