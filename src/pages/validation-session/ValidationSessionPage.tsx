import { FileDown, FileJson, Lock, PackageCheck, Save } from 'lucide-react'
import { useMemo, useState } from 'react'

import { buildPunchingShearReport, calculatePunchingShear } from '@/calculations/punching-shear'
import { useCalculationStore } from '@/entities/calculation/model/store'
import { downloadTextFile } from '@/features/report-export'
import { buildPunchingShearHtmlReport } from '@/features/report-export/reportHtml'
import { buildPunchingShearMarkdownReport } from '@/features/report-export/reportMarkdown'
import { createReportMetadata } from '@/features/report-export/reportMetadata'
import {
  buildCandidateJson,
  buildReviewSnapshot,
  createReviewSession,
  createVerificationCandidateFromReview,
  listReviewSessions,
  serializeReviewSnapshot,
} from '@/features/review-mode'
import {
  buildValidationSessionReviewerSummary,
  canExportValidationSessionPackage,
  canMarkValidationCandidatePass,
  createValidationSession,
  downloadValidationSessionPackageManifest,
  freezeValidationRegressionSnapshot,
  getLatestValidationSession,
  getValidationChecklistProgress,
  markValidationCandidateValidated,
  saveValidationSession,
  setValidationCandidateCliResult,
  setValidationSessionEngineerNotes,
  setValidationSessionExportStatus,
  syncValidationSessionReview,
  type ValidationSession,
} from '@/features/validation-session'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { formatFeatureLabel } from '@/shared/labels/featureLabels'

export function ValidationSessionPage() {
  const draft = useCalculationStore((state) => state.draft)
  const storeResult = useCalculationStore((state) => state.punchingShearResult)
  const storeReport = useCalculationStore((state) => state.punchingShearReport)
  const calculationId = useCalculationStore((state) => state.activeCalculationId)
  const result = storeResult ?? calculatePunchingShear(draft)
  const report = storeReport ?? buildPunchingShearReport(draft, result)
  const latestReview = useMemo(
    () =>
      listReviewSessions().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      createReviewSession({ input: draft, calculationId }),
    [calculationId, draft],
  )
  const [session, setSession] = useState<ValidationSession>(() => {
    const stored = getLatestValidationSession()

    return stored ?? createValidationSession({ input: draft, result, report, reviewSession: latestReview })
  })
  const [notes, setNotes] = useState(session.engineerNotes.text)
  const [trustedSourceName, setTrustedSourceName] = useState('')
  const [trustedSourceReference, setTrustedSourceReference] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const checklist = getValidationChecklistProgress(session)
  const summary = buildValidationSessionReviewerSummary(session)
  const candidateExportErrors =
    session.candidate && session.candidate.candidateStatus !== 'ready-for-validation'
      ? ['Incomplete candidate cannot be exported.', ...createVerificationCandidateFromReview(session.reviewSession).validation.errors]
      : []
  const canExportCandidate = session.candidate?.candidateStatus === 'ready-for-validation'
  const canExportPackage = canExportValidationSessionPackage(session)
  const passBlockingReason = getCandidatePassBlockingReason(session)

  const persist = (nextSession: ValidationSession, nextMessage: string) => {
    setSession(saveValidationSession(nextSession))
    setMessage(nextMessage)
  }

  const handleSyncReview = () => {
    persist(syncValidationSessionReview(session, latestReview), 'Последняя сессия проверки привязана.')
  }

  const handleExportHtml = () => {
    const metadata = createReportMetadata(new Date(), session.calculationId ?? calculationId ?? undefined)
    const filename = `validation-session-report-${metadata.calculationId}.html`

    downloadTextFile(filename, buildPunchingShearHtmlReport(draft, result, report, metadata), 'text/html')
    persist(setValidationSessionExportStatus(session, { htmlReportExported: true }), 'HTML-отчет выгружен.')
  }

  const handleExportMarkdown = () => {
    const metadata = createReportMetadata(new Date(), session.calculationId ?? calculationId ?? undefined)
    const filename = `validation-session-report-${metadata.calculationId}.md`

    downloadTextFile(filename, buildPunchingShearMarkdownReport(draft, result, report, metadata), 'text/markdown')
    persist(setValidationSessionExportStatus(session, { markdownReportExported: true }), 'Markdown-отчет выгружен.')
  }

  const handleExportReviewSnapshot = () => {
    const snapshot = buildReviewSnapshot({
      input: session.input,
      result: session.result,
      session: session.reviewSession,
      comparison: session.reviewComparison,
    })

    downloadTextFile('validation-session-review-snapshot.json', serializeReviewSnapshot(snapshot), 'application/json')
    persist(setValidationSessionExportStatus(session, { reviewSnapshotExported: true }), 'Снимок проверки выгружен.')
  }

  const handleCreateCandidate = () => {
    const candidateResult = createVerificationCandidateFromReview(session.reviewSession)

    persist(
      {
        ...session,
        candidate: candidateResult.candidate,
        updatedAt: new Date().toISOString(),
      },
      candidateResult.validation.valid
        ? 'Кандидат проверки создан.'
        : 'Кандидат создан как неполный; завершите блокирующие пункты чеклиста.',
    )
  }

  const handleExportCandidate = () => {
    if (!canExportCandidate || !session.candidate) {
      setMessage(candidateExportErrors[0] ?? 'Create a ready-for-validation candidate before exporting JSON.')
      return
    }

    downloadTextFile('validation-session-candidate.json', buildCandidateJson(session.candidate), 'application/json')
    persist(setValidationSessionExportStatus(session, { candidateJsonExported: true }), 'JSON кандидата выгружен.')
  }

  const handleSaveNotes = () => {
    const attachments = [
      ...session.engineerNotes.attachments.filter((attachment) => attachment.kind !== 'trusted-source'),
      ...(trustedSourceName.trim() && trustedSourceReference.trim()
        ? [
            {
              id: `trusted-source-${Date.now()}`,
              name: trustedSourceName.trim(),
              reference: trustedSourceReference.trim(),
              kind: 'trusted-source' as const,
            },
          ]
        : []),
    ]

    persist(
      setValidationSessionEngineerNotes(session, {
        text: notes,
        attachedAt: new Date().toISOString(),
        attachments,
      }),
      'Заметки инженера сохранены.',
    )
  }

  const handleFreezeRegression = () => {
    persist(freezeValidationRegressionSnapshot(session), 'Снимок регрессии заморожен.')
  }

  const handleCandidateValidated = () => {
    persist(markValidationCandidateValidated(session, true), 'PASS валидации кандидата зафиксирован.')
  }

  const handleAttachCandidateCliPass = () => {
    persist(setValidationCandidateCliResult(session, 'PASS'), 'CLI validation PASS attached.')
  }

  const handleExportPackage = () => {
    const nextSession = downloadValidationSessionPackageManifest(session)

    persist(nextSession, 'Манифест пакета валидации выгружен.')
  }

  const handleExportIncompletePackage = () => {
    const nextSession = downloadValidationSessionPackageManifest(session, { incompleteDebug: true })

    persist(nextSession, 'Incomplete debug validation package exported with warning.')
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Сессия валидации
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Пакет инженерных материалов для ручной доверенной проверки. Экспорт кандидата не
            импортирует данные, а принятая проверка не повышает статус до VERIFIED.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Проверка" value={formatReviewStatus(session.reviewSession.status)} />
          <StatusPill label="Кандидат" value={formatCandidateStatus(session.candidate?.candidateStatus ?? 'not-created')} />
          <StatusPill label="Уровень" value={formatVerificationLevel(session.result.verificationLevel)} />
          <StatusPill label="Чеклист" value={`${checklist.completePercent}%`} />
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Активный расчет</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoGrid
              items={[
                ['тип случая', formatCaseType(session.input.caseType)],
                ['N', `${session.input.forces.axialForceKn} kN`],
                ['Mx', `${session.input.forces.momentXKnM} kN*m`],
                ['My', `${session.input.forces.momentYKnM} kN*m`],
                ['статус', formatCalculationStatus(session.result.status)],
                ['уровень проверки', formatVerificationLevel(session.result.verificationLevel)],
              ]}
            />
            <div className="grid gap-2">
              <p className="font-semibold text-slate-900">Проверенные возможности</p>
              <FeatureList features={session.result.verifiedFeatures} />
              <p className="font-semibold text-slate-900">Черновые возможности</p>
              <FeatureList features={session.result.draftFeatures} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Сводка проверяющего</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoGrid
              items={[
                ['соглашение осей', formatAxisConventionStatus(summary.axisConventionStatus)],
                ['статус отклонений', formatDriftStatus(summary.driftStatus)],
                ['рекомендация', formatRecommendation(summary.recommendation)],
                ['открытые расхождения', summary.openMismatches.length.toString()],
                ['недостающие доказательства', formatMissingEvidence(summary.missingTrustedEvidence)],
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Прогресс чеклиста</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${checklist.completePercent}%` }}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {checklist.items.map((item) => (
              <div
                key={item.key}
                className={[
                  'rounded-lg border p-3 text-sm',
                  item.complete
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : item.blocking
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900',
                ].join(' ')}
              >
                <p className="font-semibold">{item.complete ? 'готово' : 'не заполнено'}: {item.label}</p>
                {!item.complete ? <p className="mt-1">{item.missingText}</p> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Экспорт</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={handleExportHtml}>
                <FileDown />
                Выгрузить HTML-отчет
              </Button>
              <Button type="button" variant="outline" onClick={handleExportMarkdown}>
                <FileDown />
                Выгрузить Markdown-отчет
              </Button>
              <Button type="button" variant="outline" onClick={handleExportReviewSnapshot}>
                <FileJson />
                Выгрузить снимок проверки
              </Button>
              <Button type="button" variant="outline" disabled={!canExportCandidate} onClick={handleExportCandidate}>
                <FileJson />
                Выгрузить JSON кандидата
              </Button>
            </div>
            {session.candidate?.candidateStatus === 'incomplete' ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                Incomplete candidate cannot be exported.
              </p>
            ) : null}
            {candidateExportErrors.length > 0 ? (
              <ul className="grid gap-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {candidateExportErrors.map((error) => (
                  <li key={error}>- {error}</li>
                ))}
              </ul>
            ) : null}
            <Button type="button" disabled={!canExportPackage} onClick={handleExportPackage}>
              <PackageCheck />
              Выгрузить пакет валидации
            </Button>
            {!canExportPackage ? (
              <p className="text-sm font-medium text-red-700">
                Normal package export is blocked until checklist blocking items are complete.
              </p>
            ) : null}
            <Button type="button" variant="outline" onClick={handleExportIncompletePackage}>
              <PackageCheck />
              Export incomplete package for debugging
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Управление процессом</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={handleSyncReview}>
                <Save />
                Привязать последнюю проверку
              </Button>
              <Button type="button" variant="outline" onClick={handleCreateCandidate}>
                <FileJson />
                Создать кандидата
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={session.candidate?.candidateStatus !== 'ready-for-validation'}
                onClick={handleAttachCandidateCliPass}
              >
                <PackageCheck />
                Attach CLI PASS result
              </Button>
              <Button type="button" variant="outline" disabled={!canMarkValidationCandidatePass(session)} onClick={handleCandidateValidated}>
                <PackageCheck />
                Отметить PASS кандидата
              </Button>
              <Button type="button" variant="outline" onClick={handleFreezeRegression}>
                <Lock />
                Заморозить регрессию
              </Button>
            </div>
            {passBlockingReason ? <p className="text-sm font-medium text-red-700">{passBlockingReason}</p> : null}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Материалы инженера</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <textarea
            className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
            placeholder="Заметки инженера, комментарии сравнения, объяснения расхождений"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Название доверенного источника"
              value={trustedSourceName}
              onChange={(event) => setTrustedSourceName(event.target.value)}
            />
            <Input
              placeholder="Ссылка или обозначение доверенного источника"
              value={trustedSourceReference}
              onChange={(event) => setTrustedSourceReference(event.target.value)}
            />
          </div>
          <Button className="w-fit" type="button" onClick={handleSaveNotes}>
            <Save />
            Сохранить заметки доказательств
          </Button>
          <InfoGrid
            items={[
              ['выгруженные отчеты', `${Number(session.exports.htmlReportExported) + Number(session.exports.markdownReportExported)}/2`],
              ['приложенные доказательства', session.engineerNotes.attachments.length.toString()],
              ['снимок регрессии', formatDriftStatus(session.regressionSnapshot.status)],
              ['блокирующие пункты', checklist.blockingItems.length.toString()],
            ]}
          />
          {message ? <p className="text-sm font-medium text-slate-700">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-800">
      {label}: {value}
    </span>
  )
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid gap-2 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</dt>
          <dd className="mt-2 break-words text-base font-semibold text-slate-950">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="grid gap-1 text-sm text-slate-700">
      {(features.length > 0 ? features : ['none']).map((feature) => (
        <li key={feature}>- {feature === 'none' ? formatFeature(feature) : formatFeatureLabel(feature)}</li>
      ))}
    </ul>
  )
}

function formatCaseType(value: string) {
  const labels: Record<string, string> = {
    center: 'центральная колонна',
    edge: 'крайняя колонна',
    corner: 'угловая колонна',
  }

  return labels[value] ?? value
}

function formatCalculationStatus(value: string) {
  const labels: Record<string, string> = {
    draft_ok: 'черновик без ошибок',
    draft_warning: 'черновик с предупреждением',
    failed: 'не проходит',
  }

  return labels[value] ?? value
}

function formatVerificationLevel(value: string) {
  const labels: Record<string, string> = {
    verified: 'проверенный',
    partial: 'частично проверенный',
    draft: 'черновой',
    unsupported: 'неподдерживаемый',
  }

  return labels[value] ?? value
}

function formatReviewStatus(value: string) {
  const labels: Record<string, string> = {
    'pending-review': 'ожидает проверки',
    reviewed: 'проверено',
    accepted: 'принято',
    rejected: 'отклонено',
    'needs-investigation': 'требует расследования',
    'reviewed-needs-evidence': 'проверено, нужны доказательства',
  }

  return labels[value] ?? value
}

function formatCandidateStatus(value: string) {
  const labels: Record<string, string> = {
    'not-created': 'не создан',
    incomplete: 'неполный',
    'ready-for-validation': 'готов к валидации',
    'ready for verification': 'готов к проверке',
    validated: 'валидирован',
    rejected: 'отклонен',
  }

  return labels[value] ?? value
}

function formatAxisConventionStatus(value: string) {
  const labels: Record<string, string> = {
    missing: 'не заполнено',
    documented: 'задокументировано',
  }

  return labels[value] ?? value
}

function formatDriftStatus(value: string) {
  const labels: Record<string, string> = {
    'not-frozen': 'не заморожен',
    frozen: 'заморожен',
    stable: 'стабилен',
    'drift-detected': 'есть отклонения',
  }

  return labels[value] ?? value
}

function formatRecommendation(value: string) {
  const labels: Record<string, string> = {
    'keep partial': 'оставить частичным',
    'ready for verification': 'готово к проверке',
    'ready for release evidence': 'готово к доказательствам релиза',
    'requires investigation': 'требует расследования',
  }

  return labels[value] ?? value
}

function formatMissingEvidence(values: string[]) {
  if (values.length === 0) {
    return 'нет'
  }

  return values.map((value) => formatMissingEvidenceItem(value)).join(', ')
}

function formatMissingEvidenceItem(value: string) {
  const labels: Record<string, string> = {
    'ready verification candidate': 'готовый кандидат проверки',
  }

  return labels[value] ?? value
}

function formatFeature(value: string) {
  const labels: Record<string, string> = {
    'center-force-only': 'центральная колонна, только сила',
    none: 'нет',
  }

  return labels[value] ?? value
}

function getCandidatePassBlockingReason(session: ValidationSession) {
  if (!session.candidate) {
    return 'Mark candidate PASS is blocked: create a candidate first.'
  }

  if (session.candidate.candidateStatus !== 'ready-for-validation') {
    return 'Mark candidate PASS is blocked: candidate is incomplete or rejected.'
  }

  if (session.candidateCliValidation.status !== 'PASS') {
    return 'Mark candidate PASS is blocked: attach a CLI validation result with PASS.'
  }

  return null
}
