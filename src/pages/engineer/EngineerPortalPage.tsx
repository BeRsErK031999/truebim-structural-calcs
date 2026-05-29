import {
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  FileArchive,
  FileText,
  Link as LinkIcon,
  ListChecks,
  PackageCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { buildPunchingShearReport, calculatePunchingShear } from '@/calculations/punching-shear'
import { useCalculationStore } from '@/entities/calculation/model/store'
import { getLatestValidationSession, getValidationChecklistProgress } from '@/features/validation-session'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

import {
  buildCurrentAppLinksCopyText,
  buildEngineerInstructionsCopyText,
  buildReturnChecklistCopyText,
  engineerReturnChecklist,
  engineerWorkflowSteps,
  getEngineerPortalCapabilitySummary,
  officeAppLinks,
} from './engineerPortalContent'

type CopyTarget = 'instructions' | 'checklist' | 'links'

const stepIcons = [FileText, PackageCheck, ClipboardCheck, FileArchive] as const

export function EngineerPortalPage() {
  const draft = useCalculationStore((state) => state.draft)
  const storeResult = useCalculationStore((state) => state.punchingShearResult)
  const storeReport = useCalculationStore((state) => state.punchingShearReport)
  const result = storeResult ?? calculatePunchingShear(draft)
  const report = storeReport ?? buildPunchingShearReport(draft, result)
  const latestSession = getLatestValidationSession()
  const checklist = latestSession ? getValidationChecklistProgress(latestSession) : null
  const capabilities = getEngineerPortalCapabilitySummary()
  const [copied, setCopied] = useState<CopyTarget | null>(null)

  const copyText = async (target: CopyTarget, text: string) => {
    await writeClipboardText(text)
    setCopied(target)
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Engineer Portal</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Start page for the engineering handoff: run the calculation, review trusted evidence,
              package validation materials and export release evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton
              copied={copied === 'instructions'}
              label="Copy engineer instructions"
              onClick={() => void copyText('instructions', buildEngineerInstructionsCopyText())}
            />
            <CopyButton
              copied={copied === 'checklist'}
              label="Copy return checklist"
              onClick={() => void copyText('checklist', buildReturnChecklistCopyText())}
            />
            <CopyButton
              copied={copied === 'links'}
              label="Copy current app links"
              onClick={() => void copyText('links', buildCurrentAppLinksCopyText())}
            />
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-4">
        {engineerWorkflowSteps.map((step, index) => {
          const Icon = stepIcons[index]

          return (
            <Card key={step.href} className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-4 text-slate-700" />
                  {index + 1}. {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-slate-700">
                <p>{step.description}</p>
                <InfoBlock label="What to do" value={step.action} />
                <InfoBlock label="Return to developer" value={step.returnToDeveloper} />
                <Button asChild variant="outline" className="w-fit">
                  <Link to={step.href}>
                    <ExternalLink className="size-4" />
                    Open section
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Status Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 md:grid-cols-2">
              <StatusCard label="current verification level" value={result.verificationLevel} />
              <StatusCard label="verified features" value={formatList(result.verifiedFeatures)} />
              <StatusCard label="draft features" value={formatList(result.draftFeatures)} />
              <StatusCard
                label="candidate workflow status"
                value={latestSession?.candidate?.candidateStatus ?? 'not-created'}
              />
              <StatusCard
                label="validation package readiness"
                value={checklist ? `${checklist.completePercent}% checklist complete` : 'no validation session'}
              />
              <StatusCard label="release evidence status" value="ready to export: HTML, Markdown, JSON" />
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>What to return to developer</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ul className="grid gap-2 text-sm text-slate-700">
              {engineerReturnChecklist.map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <ListChecks className="size-4 text-slate-700" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Verification Capability Matrix</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-md">verified: {capabilities.verified.length}</Badge>
              <Badge variant="secondary" className="rounded-md">
                partial: {capabilities.partial.length}
              </Badge>
              <Badge variant="secondary" className="rounded-md">
                draft: {capabilities.draft.length}
              </Badge>
            </div>
            <CapabilityList title="Verified" items={capabilities.verified.map((item) => item.label)} />
            <CapabilityList title="Partial" items={capabilities.partial.map((item) => item.label)} />
            <CapabilityList title="Draft" items={capabilities.draft.map((item) => item.label)} />
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Current App Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {officeAppLinks.map((link) => (
              <a
                key={link}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
                href={link}
              >
                <LinkIcon className="size-4" />
                {link}
              </a>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Calculation Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-3">
            <StatusCard label="case type" value={draft.caseType} />
            <StatusCard label="calculation status" value={result.status} />
            <StatusCard label="report warnings" value={String(report.warnings.length)} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function CopyButton({
  copied,
  label,
  onClick,
}: {
  copied: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      {copied ? <CheckCircle2 className="size-4" /> : <Clipboard className="size-4" />}
      {copied ? 'Copied' : label}
    </Button>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 leading-6 text-slate-800">{value}</p>
    </div>
  )
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-base font-semibold text-slate-950">{value}</dd>
    </div>
  )
}

function CapabilityList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <ul className="mt-2 grid gap-1 text-slate-700">
        {(items.length > 0 ? items : ['none']).map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  )
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(', ') : 'none'
}

async function writeClipboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}
