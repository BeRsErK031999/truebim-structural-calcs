import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const trustedSourceMarkers = ['manual', 'webcad', 'excel', 'нормативный пример']

const numericExpectedFields = [
  'controlPerimeterMm',
  'effectiveDepthMm',
  'shearStressMpa',
  'utilizationRatio',
]

const requiredTopLevelFields = [
  'id',
  'title',
  'source',
  'standard',
  'caseType',
  'input',
  'expected',
  'tolerance',
  'notes',
  'status',
]

export function validateVerifiedCase(candidate) {
  const errors = []

  if (!isPlainObject(candidate)) {
    return {
      valid: false,
      errors: ['Файл должен содержать один JSON-объект verification case.'],
    }
  }

  for (const field of requiredTopLevelFields) {
    if (!(field in candidate)) {
      errors.push(`Отсутствует обязательное поле "${field}".`)
    }
  }

  if (candidate.status !== 'verified') {
    errors.push('Поле "status" должно быть равно "verified" для проверенного case.')
  }

  if (typeof candidate.source !== 'string' || candidate.source.trim().length === 0) {
    errors.push('Поле "source" должно быть непустой строкой с доверенным источником.')
  } else if (!hasTrustedSourceMarker(candidate.source)) {
    errors.push(
      `Поле "source" должно содержать один из trusted marker: ${trustedSourceMarkers.join(', ')}.`,
    )
  }

  validateExpected(candidate.expected, errors)
  validateTolerance(candidate.tolerance, errors)

  if (!isPlainObject(candidate.input)) {
    errors.push('Поле "input" должно быть объектом с исходными данными расчета.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function hasTrustedSourceMarker(source) {
  const normalizedSource = source.toLowerCase()

  return trustedSourceMarkers.some((marker) => normalizedSource.includes(marker))
}

export function formatValidationResult(filePath, result) {
  if (result.valid) {
    return [
      `OK: ${filePath}`,
      'Verified case прошел проверку структуры, источника и expected values.',
      'Скрипт ничего не добавил в dataset автоматически.',
    ].join('\n')
  }

  return [
    `Ошибка проверки verified case: ${filePath}`,
    ...result.errors.map((error) => `- ${error}`),
    'Файл не добавлен в dataset. Заполните trusted source и числовые expected values.',
  ].join('\n')
}

export async function validateVerifiedCaseFile(filePath) {
  let parsedJson

  try {
    parsedJson = JSON.parse(await readFile(filePath, 'utf-8'))
  } catch (error) {
    return {
      valid: false,
      errors: [`Не удалось прочитать или разобрать JSON: ${error.message}`],
    }
  }

  return validateVerifiedCase(parsedJson)
}

async function runCli() {
  const filePath = process.argv[2]

  if (!filePath) {
    console.error('Укажите путь к JSON-файлу: npm run verification:validate -- path/to/case.json')
    process.exitCode = 1
    return
  }

  const result = await validateVerifiedCaseFile(filePath)
  const output = formatValidationResult(filePath, result)

  if (result.valid) {
    console.log(output)
  } else {
    console.error(output)
    process.exitCode = 1
  }
}

function validateExpected(expected, errors) {
  if (!isPlainObject(expected)) {
    errors.push('Поле "expected" должно быть объектом.')
    return
  }

  for (const field of numericExpectedFields) {
    if (!Number.isFinite(expected[field])) {
      errors.push(`Поле "expected.${field}" должно быть числом, null/TODO не допускается.`)
    }
  }

  if (typeof expected.passed !== 'boolean') {
    errors.push('Поле "expected.passed" должно быть boolean.')
  }
}

function validateTolerance(tolerance, errors) {
  if (!isPlainObject(tolerance)) {
    errors.push('Поле "tolerance" должно быть объектом.')
    return
  }

  if (!Number.isFinite(tolerance.relativePercent)) {
    errors.push('Поле "tolerance.relativePercent" должно быть числом.')
  }

  if (!Number.isFinite(tolerance.absolute)) {
    errors.push('Поле "tolerance.absolute" должно быть числом.')
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runCli()
}
