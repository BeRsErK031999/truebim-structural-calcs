import { BookOpen, ClipboardCopy, FileDown, FileJson, Lock, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'

import { buildPunchingShearReport, calculatePunchingShear } from '@/calculations/punching-shear'
import { useCalculationStore } from '@/entities/calculation/model/store'
import {
  buildReviewComparison,
  buildReviewSnapshot,
  buildReviewSnapshotHtml,
  buildCandidateSummary,
  compareFrozenReviewSnapshot,
  createReviewSession,
  createVerificationCandidateFromReview,
  downloadCandidateJson,
  exportReviewSession,
  freezeReviewSnapshot,
  hasTrustedVerificationCandidateSource,
  importReviewSession,
  requiredVerificationCandidateExpectedFields,
  saveReviewSession,
  serializeReviewSnapshot,
  transitionReviewStatus,
  type VerificationCandidateCreationResult,
  type ReviewDiffItem,
  type ReviewSession,
  type ReviewStatus,
  type ReviewValueKey,
} from '@/features/review-mode'
import { downloadTextFile } from '@/features/report-export/downloadFile'
import {
  createKnowledgeEntryFromAcceptedReview,
  saveKnowledgeEntry,
} from '@/features/knowledge-base'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

import {
  candidateReturnInstructionsCopyText,
  engineerChecklistCopyText,
  engineerHandoffLinks,
  reviewCandidateHandoffHint,
} from './engineerHandoffHelp'

const expectedFields: Array<{ key: ReviewValueKey; label: string }> = [
  { key: 'controlPerimeterMm', label: 'Контрольный периметр, мм' },
  { key: 'effectiveDepthMm', label: 'Рабочая высота, мм' },
  { key: 'shearStressMpa', label: 'Базовое напряжение среза, МПа' },
  { key: 'maxShearStressMpa', label: 'Максимальное напряжение среза, МПа' },
  { key: 'minShearStressMpa', label: 'Минимальное напряжение среза, МПа' },
  { key: 'eccentricityX', label: 'Эксцентриситет X, мм' },
  { key: 'eccentricityY', label: 'Эксцентриситет Y, мм' },
  { key: 'transferFactorX', label: 'Коэффициент передачи X' },
  { key: 'transferFactorY', label: 'Коэффициент передачи Y' },
  { key: 'stressPointCount', label: 'Количество точек напряжений' },
  { key: 'stressChecksum', label: 'Checksum напряжений' },
  { key: 'verificationLevel', label: 'Уровень проверки' },
]

const sourceOptions = [
  { value: 'manual', label: 'ручной расчет' },
  { value: 'webcad', label: 'webcad' },
  { value: 'excel', label: 'excel' },
  { value: 'hand-calculation', label: 'нормативный пример' },
  { value: 'other', label: 'другое' },
] as const

export function EngineeringReviewPage() {
  const draft = useCalculationStore((state) => state.draft)
  const storeResult = useCalculationStore((state) => state.punchingShearResult)
  const calculationId = useCalculationStore((state) => state.activeCalculationId)
  const setPunchingShearResult = useCalculationStore((state) => state.setPunchingShearResult)
  const result = storeResult ?? calculatePunchingShear(draft)
  const [session, setSession] = useState<ReviewSession>(() => createReviewSession({ input: draft, calculationId }))
  const [candidateResult, setCandidateResult] = useState<VerificationCandidateCreationResult | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [importText, setImportText] = useState('')
  const comparison = useMemo(
    () => buildReviewComparison(result, session.evidence),
    [result, session.evidence],
  )
  const driftItems = session.frozenSnapshots.flatMap((snapshot) =>
    compareFrozenReviewSnapshot(snapshot, result).map((item) => ({
      snapshotId: snapshot.id,
      ...item,
    })),
  )
  const candidatePreview = useMemo(
    () => createVerificationCandidateFromReview(session),
    [session],
  )
  const exportableCandidate = candidateResult?.candidate.candidateStatus === 'ready-for-validation'
  const candidateChecklist = [
    { label: 'статус принятия', complete: session.status === 'accepted' },
    { label: 'доверенный источник', complete: hasTrustedVerificationCandidateSource(session.evidence.source) },
    { label: 'проверяющий', complete: session.evidence.checkedBy.trim().length > 0 },
    { label: 'дата проверки', complete: session.evidence.checkedAt.trim().length > 0 },
    {
      label: 'ожидаемые значения',
      complete: requiredVerificationCandidateExpectedFields.every((field) =>
        Number.isFinite(session.evidence.expectedValues[field]),
      ),
    },
    { label: 'допуски', complete: true },
    { label: 'заметки по осям', complete: session.evidence.axisConventionNotes.trim().length > 0 },
  ]

  const updateSession = (nextSession: ReviewSession, save = false) => {
    setSession(nextSession)
    setCandidateResult(null)

    if (save) {
      saveReviewSession(nextSession)
    }
  }

  const handleRunCurrentDraft = () => {
    const nextResult = calculatePunchingShear(draft)
    const report = buildPunchingShearReport(draft, nextResult)

    setPunchingShearResult(nextResult, report)
    setMessage('Текущий черновик пересчитан для проверки.')
  }

  const handleEvidenceValue = (key: ReviewValueKey, rawValue: string) => {
    const numeric = Number(rawValue)
    const value = rawValue.trim() === '' ? undefined : Number.isFinite(numeric) ? numeric : rawValue

    updateSession({
      ...session,
      updatedAt: new Date().toISOString(),
      evidence: {
        ...session.evidence,
        expectedValues: {
          ...session.evidence.expectedValues,
          [key]: value,
        },
      },
    })
  }

  const handleStatusChange = (status: ReviewStatus) => {
    const evidenceValidation = createVerificationCandidateFromReview({ ...session, status: 'accepted' })
    const nextStatus =
      status === 'accepted' && !evidenceValidation.validation.valid
        ? 'reviewed-needs-evidence'
        : transitionReviewStatus(session.status, status)

    updateSession(
      {
        ...session,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        decision: {
          ...session.decision,
          decidedBy: session.evidence.checkedBy,
          decidedAt: new Date().toISOString(),
        },
      },
      true,
    )
    if (status === 'accepted' && !evidenceValidation.validation.valid) {
      setMessage(`Принятие заблокировано до заполнения доверенных доказательств: ${formatRequirements(evidenceValidation.validation.missingRequirements).join(', ')}`)
    }
  }

  const handleFreeze = () => {
    updateSession(
      freezeReviewSnapshot({
        session,
        result,
        comparisonItems: comparison.items,
      }),
      true,
    )
    setMessage('Снимок проверки сохранен локально.')
  }

  const handleExportJson = () => {
    const snapshot = buildReviewSnapshot({ input: draft, result, session, comparison })

    downloadTextFile('engineering-review-snapshot.json', serializeReviewSnapshot(snapshot), 'application/json')
  }

  const handleExportHtml = () => {
    const snapshot = buildReviewSnapshot({ input: draft, result, session, comparison })

    downloadTextFile('engineering-review-snapshot.html', buildReviewSnapshotHtml(snapshot), 'text/html')
  }

  const handleExportSession = () => {
    downloadTextFile('engineering-review-session.json', exportReviewSession(session), 'application/json')
  }

  const handleCreateKnowledgeEntry = () => {
    try {
      const entry = createKnowledgeEntryFromAcceptedReview({
        reviewSession: session,
        comparisonItems: comparison.items,
      })

      saveKnowledgeEntry(entry)
      setMessage(`Запись базы знаний создана: ${entry.title}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось создать запись базы знаний.')
    }
  }

  const handleImportSession = () => {
    try {
      const imported = importReviewSession(importText)

      setSession(imported)
      setImportText('')
      setMessage('Сессия проверки импортирована.')
    } catch {
      setMessage('Не удалось импортировать JSON сессии проверки.')
    }
  }

  const handleCreateCandidate = () => {
    const nextCandidateResult = createVerificationCandidateFromReview(session)

    setCandidateResult(nextCandidateResult)
    setMessage(
      nextCandidateResult.validation.valid
        ? 'JSON кандидата проверки готов для ручной валидации.'
        : 'Кандидат проверки неполный. Заполните чеклист перед валидацией.',
    )
  }

  const handleExportCandidate = () => {
    const candidate = candidateResult?.candidate ?? candidatePreview.candidate

    if (candidate.candidateStatus !== 'ready-for-validation') {
      setMessage('Неполный кандидат не может быть выгружен.')
      return
    }

    downloadCandidateJson(candidate)
  }

  const handleCopyCandidateSummary = async () => {
    const candidate = candidateResult?.candidate ?? candidatePreview.candidate

    await navigator.clipboard.writeText(buildCandidateSummary(candidate))
    setMessage('Сводка кандидата проверки скопирована.')
  }

  const handleCopyEngineerChecklist = async () => {
    await navigator.clipboard.writeText(engineerChecklistCopyText)
    setMessage('Чеклист инженера скопирован.')
  }

  const handleCopyReturnInstructions = async () => {
    await navigator.clipboard.writeText(candidateReturnInstructionsCopyText)
    setMessage('Инструкции возврата кандидата скопированы.')
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Инженерная проверка
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Ручной сбор доверенных доказательств для инженерного сравнения. Принятая проверка
            фиксирует доказательства, но статус VERIFIED зависит от отдельной логики продвижения.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {engineerHandoffLinks.map((link) => (
            <a
              key={link.href}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={session.status} />
          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
            Уровень проверки: {result.verificationLevel}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
            Заморожено: {session.frozenSnapshots.length}
          </span>
        </div>
      </header>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Ввод ручных доказательств</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Источник
              <select
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
                value={session.evidence.source}
                onChange={(event) =>
                  updateSession({
                    ...session,
                    evidence: {
                      ...session.evidence,
                      source: event.target.value as ReviewSession['evidence']['source'],
                    },
                  })
                }
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <LabelledInput
              label="Проверил"
              value={session.evidence.checkedBy}
              onChange={(value) =>
                updateSession({ ...session, evidence: { ...session.evidence, checkedBy: value } })
              }
            />
            <LabelledInput
              label="Дата проверки"
              value={session.evidence.checkedAt}
              onChange={(value) =>
                updateSession({ ...session, evidence: { ...session.evidence, checkedAt: value } })
              }
            />
          </div>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
            placeholder="Заметки проверяющего, доверенный источник расчета, объяснения расхождений"
            value={session.evidence.notes}
            onChange={(event) =>
              updateSession({
                ...session,
                evidence: { ...session.evidence, notes: event.target.value },
              })
            }
          />
          <textarea
            className="min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
            placeholder="Заметки по соглашению осей"
            value={session.evidence.axisConventionNotes}
            onChange={(event) =>
              updateSession({
                ...session,
                evidence: { ...session.evidence, axisConventionNotes: event.target.value },
              })
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            {expectedFields.map((field) => (
              <LabelledInput
                key={field.key}
                label={field.label}
                value={String(session.evidence.expectedValues[field.key] ?? '')}
                onChange={(value) => handleEvidenceValue(field.key, value)}
              />
            ))}
          </div>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
            Ожидаемые значения должны приходить из доверенного источника, а не копироваться из вывода приложения.
            Используйте мм, МПа или безразмерные значения согласно подписи каждого поля.
          </p>
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-slate-900">Метаданные приложений</p>
            <textarea
              className="min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
              placeholder="Одна ссылка на строку: скриншот, Excel-файл, PDF-страница, WebCAD URL"
              value={session.evidence.attachments.map((item) => item.reference).join('\n')}
              onChange={(event) =>
                updateSession({
                  ...session,
                  evidence: {
                    ...session.evidence,
                    attachments: event.target.value
                      .split('\n')
                      .filter((line) => line.trim().length > 0)
                      .map((reference, index) => ({
                        id: `attachment-${index + 1}`,
                        name: reference.trim(),
                        kind: 'other',
                        reference: reference.trim(),
                      })),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Сравнение рядом</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryTile label="Совпадения" value={comparison.matchCount.toString()} tone="match" />
            <SummaryTile label="Предупреждения допуска" value={comparison.warningCount.toString()} tone="warning" />
            <SummaryTile label="Расхождения" value={comparison.mismatchCount.toString()} tone="mismatch" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[780px] border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="p-3">Раздел</th>
                  <th className="p-3">Поле</th>
                  <th className="p-3">Результат приложения</th>
                  <th className="p-3">Доверенное значение</th>
                  <th className="p-3">Отклонение</th>
                  <th className="p-3">Статус</th>
                </tr>
              </thead>
              <tbody>
                {comparison.items.map((item) => (
                  <DiffRow key={item.key} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Процесс проверки</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleRunCurrentDraft}>
              Пересчитать текущий черновик
            </Button>
            {(
              [
                'pending-review',
                'reviewed',
                'reviewed-needs-evidence',
                'accepted',
                'rejected',
                'needs-investigation',
              ] as ReviewStatus[]
            ).map(
              (status) => (
                <Button
                  key={status}
                  type="button"
                  variant={session.status === status ? 'default' : 'outline'}
                  onClick={() => handleStatusChange(status)}
                >
                  {formatReviewStatus(status)}
                </Button>
              ),
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleFreeze}>
              <Lock />
              Заморозить снимок
            </Button>
            <Button type="button" variant="outline" onClick={handleExportJson}>
              <FileJson />
              Выгрузить JSON снимка
            </Button>
            <Button type="button" variant="outline" onClick={handleExportHtml}>
              <FileDown />
              Выгрузить HTML снимка
            </Button>
            <Button type="button" variant="outline" onClick={handleExportSession}>
              <FileJson />
              Выгрузить JSON сессии
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={session.status !== 'accepted'}
              onClick={handleCreateKnowledgeEntry}
            >
              <BookOpen />
              Создать запись базы знаний
            </Button>
          </div>
          {driftItems.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Отклонение регрессии найдено после ручной проверки: {driftItems.length} полей.
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Отклонений в замороженных снимках не найдено.
            </div>
          )}
          <div className="grid gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-950">{reviewCandidateHandoffHint}</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleCopyEngineerChecklist}>
                <ClipboardCopy />
                Скопировать чеклист инженера
              </Button>
              <Button type="button" variant="outline" onClick={handleCopyReturnInstructions}>
                <ClipboardCopy />
                Скопировать инструкции возврата
              </Button>
            </div>
          </div>
          <div className="grid gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-amber-900">
                Кандидат не является VERIFIED и не добавляется в набор проверочных данных автоматически.
              </p>
              <div className="flex flex-wrap gap-2">
                {candidateChecklist.map((item) => (
                  <span
                    key={item.label}
                    className={
                      item.complete
                        ? 'rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-800'
                        : 'rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-amber-800'
                    }
                  >
                    {item.complete ? 'готово' : 'не заполнено'}: {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateCandidate}
              >
                <FileJson />
                Создать кандидата проверки
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!exportableCandidate}
                onClick={handleExportCandidate}
              >
                <FileDown />
                Выгрузить JSON кандидата
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!exportableCandidate}
                onClick={handleCopyCandidateSummary}
              >
                <ClipboardCopy />
                Скопировать сводку кандидата
              </Button>
            </div>
            {candidateResult && candidateResult.validation.errors.length > 0 ? (
              <ul className="grid gap-1 text-sm font-medium text-amber-900">
                {candidateResult.validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
            {candidateResult?.candidate.candidateStatus === 'incomplete' ? (
              <p className="text-sm font-semibold text-amber-900">Неполный кандидат не может быть выгружен.</p>
            ) : null}
          </div>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
            placeholder="Вставьте JSON сессии проверки для импорта"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
          <Button
            className="w-fit"
            disabled={importText.trim().length === 0}
            type="button"
            variant="outline"
            onClick={handleImportSession}
          >
            <Upload />
            Импортировать сессию
          </Button>
          {message ? <p className="text-sm font-medium text-slate-700">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function LabelledInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function DiffRow({ item }: { item: ReviewDiffItem }) {
  const className = {
    match: 'bg-emerald-50 text-emerald-950',
    warning: 'bg-amber-50 text-amber-950',
    mismatch: 'bg-red-50 text-red-950',
    missing: 'bg-white text-slate-700',
  }[item.severity]

  return (
    <tr className={`border-t border-slate-200 ${className}`}>
      <td className="p-3">{formatSection(item.section)}</td>
      <td className="p-3 font-medium">{item.label}</td>
      <td className="p-3">{formatValue(item.appValue)}</td>
      <td className="p-3">{formatValue(item.expectedValue)}</td>
      <td className="p-3">{formatValue(item.delta)}</td>
      <td className="p-3 font-semibold">{formatSeverity(item.severity)}</td>
    </tr>
  )
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'match' | 'warning' | 'mismatch'
}) {
  const className = {
    match: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    mismatch: 'border-red-200 bg-red-50 text-red-700',
  }[tone]

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span className="rounded-md bg-slate-950 px-2.5 py-1 text-sm font-semibold text-white">
      {formatReviewStatus(status)}
    </span>
  )
}

function formatReviewStatus(status: ReviewStatus) {
  const labels: Record<ReviewStatus, string> = {
    'pending-review': 'ожидает проверки',
    reviewed: 'проверено',
    'reviewed-needs-evidence': 'проверено, нужны доказательства',
    accepted: 'принято',
    rejected: 'отклонено',
    'needs-investigation': 'нужно расследование',
  }

  return labels[status]
}

function formatSection(section: ReviewDiffItem['section']) {
  const labels: Record<ReviewDiffItem['section'], string> = {
    geometry: 'геометрия',
    stress: 'напряжения',
    eccentricity: 'эксцентриситет',
    'transfer factors': 'коэффициенты передачи',
    checksums: 'контрольные суммы',
    'verification level': 'уровень проверки',
  }

  return labels[section]
}

function formatSeverity(severity: ReviewDiffItem['severity']) {
  const labels: Record<ReviewDiffItem['severity'], string> = {
    match: 'совпадает',
    warning: 'предупреждение',
    mismatch: 'расхождение',
    missing: 'не заполнено',
  }

  return labels[severity]
}

function formatValue(value: number | string | null) {
  if (value === null) {
    return '--'
  }

  return typeof value === 'number' ? value.toFixed(6) : value
}

function formatRequirements(values: string[]) {
  const labels: Record<string, string> = {
    'accepted status': 'статус принятия',
    'trusted source': 'доверенный источник',
    checkedBy: 'проверяющий',
    checkedAt: 'дата проверки',
    'axis notes': 'заметки по осям',
  }

  return values.map((value) => labels[value] ?? value)
}
