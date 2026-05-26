import { ClipboardCopy, FileDown, FileJson, Lock, Upload } from 'lucide-react'
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
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

const expectedFields: Array<{ key: ReviewValueKey; label: string }> = [
  { key: 'controlPerimeterMm', label: 'Control perimeter, mm' },
  { key: 'effectiveDepthMm', label: 'Effective depth, mm' },
  { key: 'shearStressMpa', label: 'Base shear stress, MPa' },
  { key: 'maxShearStressMpa', label: 'Max shear stress, MPa' },
  { key: 'minShearStressMpa', label: 'Min shear stress, MPa' },
  { key: 'eccentricityX', label: 'Eccentricity X, mm' },
  { key: 'eccentricityY', label: 'Eccentricity Y, mm' },
  { key: 'transferFactorX', label: 'Transfer factor X' },
  { key: 'transferFactorY', label: 'Transfer factor Y' },
  { key: 'stressPointCount', label: 'Stress point count' },
  { key: 'stressChecksum', label: 'Stress checksum' },
  { key: 'verificationLevel', label: 'Verification level' },
]

export function EngineeringReviewPage() {
  const draft = useCalculationStore((state) => state.draft)
  const storeResult = useCalculationStore((state) => state.punchingShearResult)
  const setPunchingShearResult = useCalculationStore((state) => state.setPunchingShearResult)
  const result = storeResult ?? calculatePunchingShear(draft)
  const [session, setSession] = useState<ReviewSession>(() => createReviewSession({ input: draft }))
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
  const candidateChecklist = [
    { label: 'accepted status', complete: session.status === 'accepted' },
    { label: 'trusted source', complete: hasTrustedVerificationCandidateSource(session.evidence.source) },
    { label: 'checkedBy', complete: session.evidence.checkedBy.trim().length > 0 },
    { label: 'checkedAt', complete: session.evidence.checkedAt.trim().length > 0 },
    {
      label: 'expected values',
      complete: requiredVerificationCandidateExpectedFields.every((field) =>
        Number.isFinite(session.evidence.expectedValues[field]),
      ),
    },
    { label: 'tolerances', complete: true },
    { label: 'axis notes', complete: session.evidence.axisConventionNotes.trim().length > 0 },
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
    setMessage('Current draft recalculated for review.')
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
    updateSession(
      {
        ...session,
        status: transitionReviewStatus(session.status, status),
        updatedAt: new Date().toISOString(),
        decision: {
          ...session.decision,
          decidedBy: session.evidence.checkedBy,
          decidedAt: new Date().toISOString(),
        },
      },
      true,
    )
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
    setMessage('Frozen review snapshot saved locally.')
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

  const handleImportSession = () => {
    try {
      const imported = importReviewSession(importText)

      setSession(imported)
      setImportText('')
      setMessage('Review session imported.')
    } catch {
      setMessage('Could not import review session JSON.')
    }
  }

  const handleCreateCandidate = () => {
    const nextCandidateResult = createVerificationCandidateFromReview(session)

    setCandidateResult(nextCandidateResult)
    setMessage(
      nextCandidateResult.validation.valid
        ? 'Verification candidate JSON is ready for manual validation.'
        : 'Verification candidate is incomplete. Complete the checklist before validation.',
    )
  }

  const handleExportCandidate = () => {
    const candidate = candidateResult?.candidate ?? candidatePreview.candidate

    downloadCandidateJson(candidate)
  }

  const handleCopyCandidateSummary = async () => {
    const candidate = candidateResult?.candidate ?? candidatePreview.candidate

    await navigator.clipboard.writeText(buildCandidateSummary(candidate))
    setMessage('Verification candidate summary copied.')
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Engineering Review
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Manual trusted evidence collection for engineering comparison. Accepted review records
            evidence only; VERIFIED still depends on capability promotion logic.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={session.status} />
          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">
            Verification level: {result.verificationLevel}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
            Frozen: {session.frozenSnapshots.length}
          </span>
        </div>
      </header>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Manual Evidence Input</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <LabelledInput
              label="Source"
              value={session.evidence.source}
              onChange={(value) =>
                updateSession({
                  ...session,
                  evidence: { ...session.evidence, source: value as ReviewSession['evidence']['source'] },
                })
              }
            />
            <LabelledInput
              label="Checked by"
              value={session.evidence.checkedBy}
              onChange={(value) =>
                updateSession({ ...session, evidence: { ...session.evidence, checkedBy: value } })
              }
            />
            <LabelledInput
              label="Checked at"
              value={session.evidence.checkedAt}
              onChange={(value) =>
                updateSession({ ...session, evidence: { ...session.evidence, checkedAt: value } })
              }
            />
          </div>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
            placeholder="Reviewer notes, trusted calculation source, mismatch explanations"
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
            placeholder="Axis convention notes"
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
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-slate-900">Attachments metadata</p>
            <textarea
              className="min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
              placeholder="One reference per line: screenshot, Excel file, PDF page, WebCAD URL"
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
          <CardTitle>Side-by-side Comparison</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryTile label="Matches" value={comparison.matchCount.toString()} tone="match" />
            <SummaryTile label="Tolerance warnings" value={comparison.warningCount.toString()} tone="warning" />
            <SummaryTile label="Mismatches" value={comparison.mismatchCount.toString()} tone="mismatch" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[780px] border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="p-3">Section</th>
                  <th className="p-3">Field</th>
                  <th className="p-3">App result</th>
                  <th className="p-3">Trusted value</th>
                  <th className="p-3">Delta</th>
                  <th className="p-3">Status</th>
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
          <CardTitle>Review Workflow</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleRunCurrentDraft}>
              Run current draft
            </Button>
            {(['pending-review', 'reviewed', 'accepted', 'rejected', 'needs-investigation'] as ReviewStatus[]).map(
              (status) => (
                <Button
                  key={status}
                  type="button"
                  variant={session.status === status ? 'default' : 'outline'}
                  onClick={() => handleStatusChange(status)}
                >
                  {status}
                </Button>
              ),
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleFreeze}>
              <Lock />
              Freeze snapshot
            </Button>
            <Button type="button" variant="outline" onClick={handleExportJson}>
              <FileJson />
              Export snapshot JSON
            </Button>
            <Button type="button" variant="outline" onClick={handleExportHtml}>
              <FileDown />
              Export snapshot HTML
            </Button>
            <Button type="button" variant="outline" onClick={handleExportSession}>
              <FileJson />
              Export session JSON
            </Button>
          </div>
          {driftItems.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Regression drift detected after manual review: {driftItems.length} field(s).
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              No frozen snapshot drift detected.
            </div>
          )}
          <div className="grid gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-amber-900">
                Candidate is not VERIFIED and is not automatically added to the verification dataset.
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
                    {item.complete ? 'ok' : 'missing'}: {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={session.status !== 'accepted'}
                onClick={handleCreateCandidate}
              >
                <FileJson />
                Create verification candidate
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!candidateResult}
                onClick={handleExportCandidate}
              >
                <FileDown />
                Export candidate JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!candidateResult}
                onClick={handleCopyCandidateSummary}
              >
                <ClipboardCopy />
                Copy candidate summary
              </Button>
            </div>
            {candidateResult && candidateResult.validation.errors.length > 0 ? (
              <ul className="grid gap-1 text-sm font-medium text-amber-900">
                {candidateResult.validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
            placeholder="Paste review session JSON to import"
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
            Import session
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
      <td className="p-3">{item.section}</td>
      <td className="p-3 font-medium">{item.label}</td>
      <td className="p-3">{formatValue(item.appValue)}</td>
      <td className="p-3">{formatValue(item.expectedValue)}</td>
      <td className="p-3">{formatValue(item.delta)}</td>
      <td className="p-3 font-semibold">{item.severity}</td>
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
      {status}
    </span>
  )
}

function formatValue(value: number | string | null) {
  if (value === null) {
    return '--'
  }

  return typeof value === 'number' ? value.toFixed(6) : value
}
