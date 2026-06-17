const exactTranslations: Record<string, string> = {
  'Calculation Trace': 'Трассировка расчета',
  'Center Moment Trace': 'Трассировка передачи моментов',
  'Openings Trace': 'Трассировка отверстий',
  'Wall-End Trace': 'Трассировка конца стены',
  'Wall-Corner Trace': 'Трассировка угла стены',
  'Round Column Trace': 'Трассировка круглой колонны',
  'Shear Reinforcement Trace': 'Трассировка поперечной арматуры',
  'SP63 Interaction Benchmark Trace': 'Трассировка проверки взаимодействия СП63',
  'Unsupported Draft Trace': 'Трассировка неподдерживаемого чернового случая',
  'Input validation': 'Проверка исходных данных',
  'Geometry generation': 'Формирование геометрии',
  'Control perimeter': 'Контрольный периметр',
  'Effective depth': 'Рабочая высота',
  Stress: 'Напряжение',
  Utilization: 'Коэффициент использования',
  'Verification level': 'Уровень проверки',
  'Force-only base stress': 'Базовое напряжение от силы',
  'Moment eccentricity': 'Эксцентриситет от моментов',
  'Draft stress redistribution': 'Черновое перераспределение напряжений',
  'Max/min stress': 'Максимальное/минимальное напряжение',
  'Utilization with moment stress': 'Коэффициент использования с учетом моментов',
  'Opening classification': 'Классификация отверстий',
  'Tangent construction': 'Построение касательных',
  'Removed perimeter segments': 'Исключенные участки периметра',
  'Active perimeter': 'Рабочий периметр',
  'Draft stress after openings': 'Черновое напряжение после учета отверстий',
  'Wall geometry': 'Геометрия стены',
  'Wall end control perimeter': 'Контрольный периметр конца стены',
  'Draft perimeter offset': 'Черновое смещение периметра',
  'Draft stress formula': 'Черновая формула напряжения',
  'Draft utilization': 'Черновой коэффициент использования',
  'L-shaped wall geometry': 'Геометрия Г-образной стены',
  'Orientation transform': 'Преобразование ориентации',
  'Wall corner control perimeter': 'Контрольный периметр угла стены',
  'Round edge/corner support': 'Круглая колонна у края/угла',
  'Round geometry': 'Геометрия круглой колонны',
  'Circular control perimeter approximation': 'Приближение круглого контрольного периметра',
  'Draft perimeter': 'Черновой периметр',
  'Draft stress': 'Черновое напряжение',
  'Reinforcement input': 'Исходные данные армирования',
  'Steel class draft data': 'Черновые данные класса стали',
  'Reinforcement area': 'Площадь поперечной арматуры',
  'Draft reinforcement contribution': 'Черновой вклад поперечной арматуры',
  'Draft utilization with reinforcement': 'Черновой коэффициент использования с арматурой',
  'Moment reduction': 'Приведение моментов',
  'Concrete capacity': 'Несущая способность бетона',
  'Reinforcement capacity': 'Несущая способность армирования',
  'Interaction check': 'Проверка взаимодействия',
  'Outer contour check': 'Проверка внешнего контура',
  'Unsupported scenario': 'Неподдерживаемый случай',
  'valid input': 'исходные данные корректны',
  'invalid input': 'ошибка исходных данных',
  disabled: 'отключено',
  draft: 'черновик',
  matched: 'совпадает',
  none: 'нет',
  'n/a': 'н/д',
  VERIFIED: 'ПРОВЕРЕНО',
  PARTIAL: 'ЧАСТИЧНО',
  DRAFT: 'ЧЕРНОВИК',
  'application input schema': 'схема исходных данных приложения',
  'no linked verified evidence': 'подтвержденные доказательства не привязаны',
  'SP63 trace foundation explainability layer': 'пояснительный слой трассировки СП63',
  'center-force-only evidence: verified-center-rect-001':
    'доказательство для центральной колонны только от силы: verified-center-rect-001',
  'SP63 interaction benchmark candidate based on Mathcad PDF fixture':
    'кандидат проверки взаимодействия СП63 по эталону Mathcad/PDF',
  'Moment transfer is partial/draft and requires trusted evidence.':
    'Передача моментов частично/черновая и требует доверенного подтверждения.',
  'Moment transfer is DRAFT-only and not verified for design use':
    'Передача моментов имеет статус только ЧЕРНОВИК и не проверена для проектного применения',
  'Verify moment transfer formulas against SP63 before design use':
    'Перед проектным применением проверьте формулы передачи моментов по СП63',
  'Stress redistribution is provisional and not verified':
    'Перераспределение напряжений является предварительным и не проверено',
  'Draft geometry source is used for this trace step.':
    'На этом шаге используется черновой источник геометрии.',
  'Draft formula or draft verification scope is present.':
    'На шаге есть черновая формула или черновая область проверки.',
  'Draft reinforcement data is present and is not verified.':
    'Заданы черновые данные поперечной арматуры; они не проверены.',
  'Shear reinforcement contribution is DRAFT-only.':
    'Вклад поперечной арматуры имеет статус только ЧЕРНОВИК.',
  'SP63 interaction benchmark is not VERIFIED and must remain draft until engineer acceptance.':
    'Кандидат проверки взаимодействия СП63 не имеет статуса ПРОВЕРЕНО и остается черновым до приемки инженером.',
  'SP63 interaction benchmark candidate based on Mathcad fixture; not VERIFIED for design use.':
    'Кандидат проверки взаимодействия СП63 основан на эталоне Mathcad; не имеет статуса ПРОВЕРЕНО для проектного применения.',
  'Mathcad benchmark values match within test tolerance, but verified capability promotion is still pending engineer acceptance.':
    'Значения эталона Mathcad совпадают в пределах допуска теста, но повышение статуса до проверенного ожидает приемки инженером.',
  'SP63 interaction benchmark result is pending comparison with trusted evidence for this exact input.':
    'Результат кандидата проверки взаимодействия СП63 ожидает сравнения с доверенным подтверждением для этих исходных данных.',
  'Draft-only calculation: no trusted verified evidence is linked to this feature set.':
    'Черновой расчет: для этого набора возможностей не привязано доверенное подтверждение.',
  'Only rectangular center, edge, corner, opening, wall-end, wall-corner, and round-center draft geometry cases are implemented':
    'Реализованы только черновые случаи геометрии: прямоугольная колонна в центре, у края, в углу, с отверстием, конец стены, угол стены и круглая колонна в центре.',
  'Round edge/corner trace is explanatory only; no verified or draft formula is claimed.':
    'Трассировка круглой колонны у края/угла носит пояснительный характер; проверенная или черновая формула не заявляется.',
}

const partialTranslations: Array<[RegExp, string]> = [
  [
    /Draft calculation\. Verify formulas and coefficients against .+63\.13330 before design use\./g,
    'Черновой расчет. Проверьте формулы и коэффициенты по СП63.13330 перед проектным применением.',
  ],
  [
    /Moment transfer uses draft-only stress redistribution when Mx\/My are provided/g,
    'Передача моментов использует черновое перераспределение напряжений при заданных Mx/My.',
  ],
  [
    /Openings and boundary clipping are draft geometry only\.?/g,
    'Отверстия и обрезка по границам являются только черновой геометрией.',
  ],
  [
    /Wall-end punching support is draft geometry only/g,
    'Продавливание у конца стены поддерживается только как черновая геометрия.',
  ],
  [
    /Wall-corner punching support is draft geometry only/g,
    'Продавливание в углу стены поддерживается только как черновая геометрия.',
  ],
  [
    /Round column support is draft center-only geometry/g,
    'Круглая колонна поддерживается только черновой геометрией для центрального положения.',
  ],
  [
    /Shear reinforcement contribution is draft-only when enabled/g,
    'Вклад поперечной арматуры при включении остается черновым.',
  ],
  [
    /Draft formula must be verified before design use/g,
    'Черновая формула должна быть проверена перед проектным применением.',
  ],
  [
    /Shear reinforcement is not verified against SP63\.13330\./g,
    'Поперечная арматура не проверена по СП63.13330.',
  ],
  [
    /Shear reinforcement layout assumptions require engineer review\./g,
    'Допущения по схеме поперечной арматуры требуют проверки инженером.',
  ],
  [
    /Draft steel strengths must be verified against SP63 before design use\./g,
    'Черновые расчетные сопротивления стали должны быть проверены по СП63 перед проектным применением.',
  ],
  [
    /Round column perimeter is draft-only and requires SP63 verification\./g,
    'Периметр круглой колонны является черновым и требует проверки по СП63.',
  ],
  [
    /Round draft offset uses h0\/2 placeholder values pending SP63 verification\./g,
    'Черновое смещение круглой колонны использует значение h0/2 до проверки по СП63.',
  ],
  [/Round edge\/corner is not implemented yet\./g, 'Круглая колонна у края/угла пока не реализована.'],
  [/\bclosed-stirrups\b/g, 'замкнутые хомуты'],
  [/\bcustom\b/g, 'пользовательская'],
  [/\bcaseType\b/g, 'тип случая'],
  [/\bverificationLevel\b/g, 'уровень проверки'],
  [/\bexisting verified status result\b/g, 'текущий статус проверки'],
  [/\bgeometry DTO -> control perimeter segments\b/g, 'геометрия DTO -> сегменты контрольного периметра'],
  [/\bcontrol perimeter\b/g, 'контрольный периметр'],
  [/\beffective depth\b/g, 'рабочая высота'],
  [/\bnot_implemented\b/g, 'не реализовано'],
  [/\bdraft-contour\b/g, 'черновой-контур'],
  [/\bconcrete\b/g, 'бетон'],
  [/\bverified\b/g, 'проверено'],
  [/\bdraft\b/g, 'черновик'],
  [/\benabled\b/g, 'включено'],
  [/\bdisabled\b/g, 'отключено'],
  [/\bnone\b/g, 'нет'],
  [/\bn\/a\b/g, 'н/д'],
  [/\bsegment\(s\)\b/g, 'сегментов'],
  [/\bvertex\/vertices\b/g, 'вершин'],
  [/\btangent\(s\)\b/g, 'касательных'],
  [/\brow\(s\)\b/g, 'рядов'],
  [/\bleg\(s\)\b/g, 'стержней'],
  [/\bopening segment\(s\) removed\b/g, 'участков отверстий исключено'],
  [/\bopenings\b/g, 'отверстия'],
  [/\baffected openings\b/g, 'учтенные отверстия'],
  [/\bremoved\b/g, 'исключено'],
  [/\bdiameter\b/g, 'диаметр'],
  [/\bposition\b/g, 'положение'],
  [/\blength\b/g, 'длина'],
  [/\bthickness\b/g, 'толщина'],
  [/\borientation\b/g, 'ориентация'],
  [/\boffset\b/g, 'смещение'],
  [/\blayout\b/g, 'схема'],
  [/\bsteel\b/g, 'сталь'],
  [/\bpoints\b/g, 'точек'],
  [/\bsegments\b/g, 'сегментов'],
  [/\bperimeter geometry\b/g, 'геометрия периметра'],
  [/\bnot implemented\b/g, 'не реализовано'],
  [/\bouter contour disabled\b/g, 'внешний контур отключен'],
  [/\bconcrete =/g, 'бетон ='],
  [/\breinforcement =/g, 'армирование ='],
  [/\bcapacity =/g, 'несущая способность ='],
]

export function localizeTraceText(value: string) {
  if (/^verified-[a-z0-9-]+-\d+$/.test(value)) {
    return value
  }

  const exact = exactTranslations[value]

  if (exact) {
    return exact
  }

  return partialTranslations.reduce(
    (localized, [pattern, replacement]) => localized.replace(pattern, replacement),
    value,
  )
}

export function localizeTraceWarnings(warnings: string[]) {
  return warnings.map(localizeTraceText)
}
