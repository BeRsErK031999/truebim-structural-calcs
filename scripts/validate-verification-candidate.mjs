import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const trustedVerificationCandidateSourceMarkers = [
  'manual',
  'webcad',
  'excel',
  'нормативный пример',
]

export const requiredVerificationCandidateExpectedFields = [
  'controlPerimeterMm',
  'effectiveDepthMm',
  'shearStressMpa',
  'maxShearStressMpa',
  'minShearStressMpa',
  'eccentricityX',
  'eccentricityY',
  'transferFactorX',
  'transferFactorY',
  'stressPointCount',
]

const requiredTopLevelFields = [
  'id',
  'createdAt',
  'sourceReviewSessionId',
  'calculationId',
  'input',
  'expected',
  'tolerances',
  'source',
  'checkedBy',
  'checkedAt',
  'comparisonNotes',
  'axisConventionNotes',
  'attachments',
  'candidateStatus',
]

export function validateVerificationCandidateJson(candidate) {
  const errors = []
  const missingRequirements = []

  if (!isPlainObject(candidate)) {
    return {
      valid: false,
      errors: ['Candidate file must contain one JSON object.'],
      missingRequirements: ['candidate object'],
    }
  }

  for (const field of requiredTopLevelFields) {
    if (!(field in candidate)) {
      errors.push(`Missing required field "${field}".`)
      missingRequirements.push(field)
    }
  }

  if (!['ready-for-validation', 'incomplete', 'rejected'].includes(candidate.candidateStatus)) {
    errors.push('candidateStatus must be ready-for-validation, incomplete, or rejected.')
    missingRequirements.push('candidateStatus')
  }

  if (candidate.candidateStatus !== 'ready-for-validation') {
    errors.push('candidateStatus must be "ready-for-validation" before CLI validation can pass.')
  }

  if (typeof candidate.source !== 'string' || !hasTrustedSource(candidate.source)) {
    errors.push(
      `source must contain a trusted marker: ${trustedVerificationCandidateSourceMarkers.join(', ')}.`,
    )
    missingRequirements.push('trusted source')
  }

  if (typeof candidate.checkedBy !== 'string' || candidate.checkedBy.trim().length === 0) {
    errors.push('checkedBy is required.')
    missingRequirements.push('checkedBy')
  }

  if (typeof candidate.checkedAt !== 'string' || candidate.checkedAt.trim().length === 0) {
    errors.push('checkedAt is required.')
    missingRequirements.push('checkedAt')
  }

  validateExpected(candidate.expected, errors, missingRequirements)
  validateTolerances(candidate.tolerances, errors, missingRequirements)

  if (typeof candidate.axisConventionNotes !== 'string' || candidate.axisConventionNotes.trim().length === 0) {
    errors.push('axisConventionNotes is required.')
    missingRequirements.push('axis notes')
  }

  if (!isPlainObject(candidate.input)) {
    errors.push('input must be an object.')
    missingRequirements.push('input')
  }

  return {
    valid: errors.length === 0,
    errors,
    missingRequirements: [...new Set(missingRequirements)],
  }
}

export function formatCandidateValidationResult(filePath, result) {
  if (result.valid) {
    return [
      `PASS: ${filePath}`,
      'Verification candidate is ready for manual validation.',
      'No dataset import was performed.',
    ].join('\n')
  }

  return [
    `FAIL: ${filePath}`,
    ...result.errors.map((error) => `- ${error}`),
    `Missing requirements: ${result.missingRequirements.join(', ') || 'none'}`,
    'No dataset import was performed.',
  ].join('\n')
}

export async function validateVerificationCandidateFile(filePath) {
  let parsedJson

  try {
    const fileContent = await readFile(filePath, 'utf-8')

    parsedJson = JSON.parse(fileContent.replace(/^\uFEFF/, ''))
  } catch (error) {
    return {
      valid: false,
      errors: [`Could not read or parse JSON: ${error.message}`],
      missingRequirements: ['valid JSON'],
    }
  }

  return validateVerificationCandidateJson(parsedJson)
}

async function runCli() {
  const filePath = process.argv[2]

  if (!filePath) {
    console.error('Usage: npm run verification:candidate -- path/to/candidate.json')
    process.exitCode = 1
    return
  }

  const result = await validateVerificationCandidateFile(filePath)
  const output = formatCandidateValidationResult(filePath, result)

  if (result.valid) {
    console.log(output)
  } else {
    console.error(output)
    process.exitCode = 1
  }
}

function validateExpected(expected, errors, missingRequirements) {
  if (!isPlainObject(expected)) {
    errors.push('expected must be an object.')
    missingRequirements.push('expected')
    return
  }

  for (const field of requiredVerificationCandidateExpectedFields) {
    if (!Number.isFinite(expected[field])) {
      errors.push(`expected.${field} must be a numeric value.`)
      missingRequirements.push(`expected.${field}`)
    }
  }
}

function validateTolerances(tolerances, errors, missingRequirements) {
  if (!isPlainObject(tolerances)) {
    errors.push('tolerances must be an object.')
    missingRequirements.push('tolerances')
    return
  }

  for (const field of requiredVerificationCandidateExpectedFields) {
    if (!isPlainObject(tolerances[field])) {
      errors.push(`tolerances.${field} is required.`)
      missingRequirements.push(`tolerances.${field}`)
    }
  }
}

function hasTrustedSource(source) {
  const normalizedSource = source.toLowerCase()

  return trustedVerificationCandidateSourceMarkers.some((marker) =>
    normalizedSource.includes(marker.toLowerCase()),
  )
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runCli()
}
