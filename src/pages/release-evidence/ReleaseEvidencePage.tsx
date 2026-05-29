import { Download } from 'lucide-react'

import { getSavedCalculationCount } from '@/entities/calculation/model/calculationStorage'
import { useCalculationStore } from '@/entities/calculation/model/store'
import {
  buildReleaseEvidenceFromDiagnostics,
  buildReleaseEvidenceSummary,
  downloadReleaseEvidence,
} from '@/features/release-evidence'
import { getAppMetadata } from '@/shared/config/appMetadata'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

import { buildDiagnosticsModel, isLocalStorageAvailable } from '../diagnostics/diagnostics'

export function ReleaseEvidencePage() {
  const currentStatus = useCalculationStore((state) => state.punchingShearResult?.status)
  const metadata = getAppMetadata()
  const diagnostics = buildDiagnosticsModel({
    metadata,
    localStorageAvailable: isLocalStorageAvailable(),
    savedCalculationsCount: getSavedCalculationCount(),
    currentCalculationStatus: currentStatus,
  })
  const evidence = buildReleaseEvidenceFromDiagnostics({ metadata, diagnostics })
  const summary = buildReleaseEvidenceSummary(evidence)

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Release Evidence</h1>
            <p className="text-sm text-slate-600">
              Audit-only bundle for release reproducibility. No verification status is promoted here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => downloadReleaseEvidence(evidence, 'html')}>
              <Download className="size-4" />
              HTML
            </Button>
            <Button type="button" variant="outline" onClick={() => downloadReleaseEvidence(evidence, 'md')}>
              <Download className="size-4" />
              Markdown
            </Button>
            <Button type="button" variant="outline" onClick={() => downloadReleaseEvidence(evidence, 'json')}>
              <Download className="size-4" />
              JSON
            </Button>
          </div>
        </div>
      </header>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Release Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            <EvidenceItem label="Current commit" value={summary.commit} />
            <EvidenceItem label="App version" value={summary.version} />
            <EvidenceItem label="Build time" value={evidence.buildTime} />
            <EvidenceItem label="Generated at" value={summary.generatedAt} />
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Verification Matrix</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-md">verified: {evidence.counts.verified}</Badge>
            <Badge variant="secondary" className="rounded-md">
              draft: {evidence.counts.draft}
            </Badge>
            <Badge variant="secondary" className="rounded-md">
              partial: {evidence.counts.partial}
            </Badge>
          </div>
          <dl className="grid gap-3 md:grid-cols-2">
            {evidence.verificationCapabilityMatrix.map((capability) => (
              <EvidenceItem
                key={capability.id}
                label={capability.label}
                value={`${capability.status} | arithmetic: ${capability.arithmeticSupport}`}
              />
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Server URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            {evidence.officeUrlsStatus.map((urlStatus) => (
              <EvidenceItem
                key={urlStatus.url}
                label={urlStatus.url}
                value={`${urlStatus.status}: ${urlStatus.details}`}
              />
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Diagnostics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            {summary.diagnosticsSummary.map((item) => {
              const [label, ...value] = item.split(': ')

              return <EvidenceItem key={item} label={label} value={value.join(': ')} />
            })}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Validation Session Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            {summary.validationSessionReadiness.map((item) => {
              const [label, ...value] = item.split(': ')

              return <EvidenceItem key={item} label={label} value={value.join(': ')} />
            })}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Known Blockers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-slate-700">
            {summary.knownBlockers.map((blocker) => (
              <li key={blocker} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                {blocker}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function EvidenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-base font-semibold text-slate-950">{value}</dd>
    </div>
  )
}
