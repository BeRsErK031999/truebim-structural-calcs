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
  createValidationSession,
  downloadValidationSessionPackageManifest,
  freezeValidationRegressionSnapshot,
  getLatestValidationSession,
  getValidationChecklistProgress,
  markValidationCandidateValidated,
  saveValidationSession,
  setValidationSessionEngineerNotes,
  setValidationSessionExportStatus,
  syncValidationSessionReview,
  type ValidationSession,
} from '@/features/validation-session'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

export function ValidationSessionPage() {
  const draft = useCalculationStore((state) => state.draft)
  const storeResult = useCalculationStore((state) => state.punchingShearResult)
  const storeReport = useCalculationStore((state) => state.punchingShearReport)
  const result = storeResult ?? calculatePunchingShear(draft)
  const report = storeReport ?? buildPunchingShearReport(draft, result)
  const latestReview = useMemo(
    () =>
      listReviewSessions().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      createReviewSession({ input: draft }),
    [draft],
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

  const persist = (nextSession: ValidationSession, nextMessage: string) => {
    setSession(saveValidationSession(nextSession))
    setMessage(nextMessage)
  }

  const handleSyncReview = () => {
    persist(syncValidationSessionReview(session, latestReview), 'Latest review session linked.')
  }

  const handleExportHtml = () => {
    const metadata = createReportMetadata()
    const filename = `validation-session-report-${metadata.calculationId}.html`

    downloadTextFile(filename, buildPunchingShearHtmlReport(draft, result, report, metadata), 'text/html')
    persist(setValidationSessionExportStatus(session, { htmlReportExported: true }), 'HTML report exported.')
  }

  const handleExportMarkdown = () => {
    const metadata = createReportMetadata()
    const filename = `validation-session-report-${metadata.calculationId}.md`

    downloadTextFile(filename, buildPunchingShearMarkdownReport(draft, result, report, metadata), 'text/markdown')
    persist(setValidationSessionExportStatus(session, { markdownReportExported: true }), 'Markdown report exported.')
  }

  const handleExportReviewSnapshot = () => {
    const snapshot = buildReviewSnapshot({
      input: session.input,
      result: session.result,
      session: session.reviewSession,
      comparison: session.reviewComparison,
    })

    downloadTextFile('validation-session-review-snapshot.json', serializeReviewSnapshot(snapshot), 'application/json')
    persist(setValidationSessionExportStatus(session, { reviewSnapshotExported: true }), 'Review snapshot exported.')
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
        ? 'Verification candidate created.'
        : 'Candidate created as incomplete; finish blocking checklist items.',
    )
  }

  const handleExportCandidate = () => {
    if (!session.candidate) {
      setMessage('Create a candidate first.')
      return
    }

    downloadTextFile('validation-session-candidate.json', buildCandidateJson(session.candidate), 'application/json')
    persist(setValidationSessionExportStatus(session, { candidateJsonExported: true }), 'Candidate JSON exported.')
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
      'Engineer notes saved.',
    )
  }

  const handleFreezeRegression = () => {
    persist(freezeValidationRegressionSnapshot(session), 'Regression snapshot frozen.')
  }

  const handleCandidateValidated = () => {
    persist(markValidationCandidateValidated(session, true), 'Candidate validation PASS recorded.')
  }

  const handleExportPackage = () => {
    const nextSession = downloadValidationSessionPackageManifest(session)

    persist(nextSession, 'Validation session package manifest exported.')
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Validation Session
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Engineering evidence package for manual trusted validation. Candidate export does not
            import data and accepted review does not promote VERIFIED.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Review" value={session.reviewSession.status} />
          <StatusPill label="Candidate" value={session.candidate?.candidateStatus ?? 'not-created'} />
          <StatusPill label="Verification" value={session.result.verificationLevel} />
          <StatusPill label="Checklist" value={`${checklist.completePercent}%`} />
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Active Calculation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoGrid
              items={[
                ['case type', session.input.caseType],
                ['N', `${session.input.forces.axialForceKn} kN`],
                ['Mx', `${session.input.forces.momentXKnM} kN*m`],
                ['My', `${session.input.forces.momentYKnM} kN*m`],
                ['status', session.result.status],
                ['verification level', session.result.verificationLevel],
              ]}
            />
            <div className="grid gap-2">
              <p className="font-semibold text-slate-900">Verified features</p>
              <FeatureList features={session.result.verifiedFeatures} />
              <p className="font-semibold text-slate-900">Draft features</p>
              <FeatureList features={session.result.draftFeatures} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Reviewer Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoGrid
              items={[
                ['axis convention', summary.axisConventionStatus],
                ['drift status', summary.driftStatus],
                ['recommendation', summary.recommendation],
                ['open mismatches', summary.openMismatches.length.toString()],
                ['missing evidence', summary.missingTrustedEvidence.join(', ') || 'none'],
              ]}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Checklist Progress</CardTitle>
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
                <p className="font-semibold">{item.complete ? 'complete' : 'missing'}: {item.label}</p>
                {!item.complete ? <p className="mt-1">{item.missingText}</p> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Exports</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={handleExportHtml}>
                <FileDown />
                Export HTML report
              </Button>
              <Button type="button" variant="outline" onClick={handleExportMarkdown}>
                <FileDown />
                Export Markdown report
              </Button>
              <Button type="button" variant="outline" onClick={handleExportReviewSnapshot}>
                <FileJson />
                Export review snapshot
              </Button>
              <Button type="button" variant="outline" onClick={handleExportCandidate}>
                <FileJson />
                Export candidate JSON
              </Button>
            </div>
            <Button type="button" onClick={handleExportPackage}>
              <PackageCheck />
              Export validation package
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Workflow Controls</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={handleSyncReview}>
                <Save />
                Link latest review
              </Button>
              <Button type="button" variant="outline" onClick={handleCreateCandidate}>
                <FileJson />
                Create candidate
              </Button>
              <Button type="button" variant="outline" onClick={handleCandidateValidated}>
                <PackageCheck />
                Mark candidate PASS
              </Button>
              <Button type="button" variant="outline" onClick={handleFreezeRegression}>
                <Lock />
                Freeze regression
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Engineer Evidence</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <textarea
            className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
            placeholder="Engineer notes, comparison comments, mismatch explanations"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Trusted source name"
              value={trustedSourceName}
              onChange={(event) => setTrustedSourceName(event.target.value)}
            />
            <Input
              placeholder="Trusted source reference"
              value={trustedSourceReference}
              onChange={(event) => setTrustedSourceReference(event.target.value)}
            />
          </div>
          <Button className="w-fit" type="button" onClick={handleSaveNotes}>
            <Save />
            Save evidence notes
          </Button>
          <InfoGrid
            items={[
              ['exported reports', `${Number(session.exports.htmlReportExported) + Number(session.exports.markdownReportExported)}/2`],
              ['attached evidence', session.engineerNotes.attachments.length.toString()],
              ['regression snapshot', session.regressionSnapshot.status],
              ['blocking items', checklist.blockingItems.length.toString()],
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
        <li key={feature}>- {feature}</li>
      ))}
    </ul>
  )
}
