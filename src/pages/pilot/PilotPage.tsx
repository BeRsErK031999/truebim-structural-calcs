import { Download, FileJson, Send, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

import {
  buildPilotFeedbackExportFileName,
  buildPilotFeedbackExportJson,
  createEmptyPilotFeedbackInput,
  listPilotFeedback,
  pilotIssueCategories,
  savePilotFeedback,
  type PilotFeedbackInput,
  type PilotIssueCategory,
} from '@/features/pilot-feedback'
import { downloadTextFile } from '@/features/report-export'
import { getAppMetadata } from '@/shared/config/appMetadata'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import {
  buildPilotDashboard,
  pilotQuickStartSteps,
  pilotReadinessNotes,
  pilotWarnings,
  type PilotDashboard,
} from './pilotContent'

export function PilotPage() {
  const metadata = getAppMetadata()
  const [feedback, setFeedback] = useState(() => listPilotFeedback())
  const [form, setForm] = useState<PilotFeedbackInput>(() => createEmptyPilotFeedbackInput())
  const [message, setMessage] = useState<string | null>(null)
  const dashboard = buildPilotDashboard()

  const updateForm = (patch: Partial<PilotFeedbackInput>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSaveFeedback = () => {
    const saved = savePilotFeedback(form)

    setFeedback(listPilotFeedback())
    setForm(createEmptyPilotFeedbackInput())
    setMessage(`Feedback saved locally: ${saved.id}`)
  }

  const handleExportFeedback = () => {
    const currentFeedback = listPilotFeedback()

    downloadTextFile(
      buildPilotFeedbackExportFileName(),
      buildPilotFeedbackExportJson(currentFeedback, metadata),
      'application/json',
    )
    setFeedback(currentFeedback)
    setMessage(`Feedback JSON exported: ${currentFeedback.length} item(s).`)
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Pilot MVP Mode</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Office pilot workspace for engineers to run punching shear calculations, review trusted
              evidence, create verification candidates, and return validation packages to development.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleExportFeedback}>
            <Download className="size-4" />
            Export feedback JSON
          </Button>
        </div>
      </header>

      <PilotDashboardSummary dashboard={dashboard} />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-950">
              <ShieldAlert className="size-5" />
              Engineer Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm font-medium text-amber-950">
              {pilotWarnings.map((warning) => (
                <li key={warning} className="rounded-lg border border-amber-200 bg-white p-3">
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>What Works Today</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-700">
            {pilotReadinessNotes.map((note) => (
              <p key={note} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                {note}
              </p>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Quick Start Wizard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pilotQuickStartSteps.map((step, index) => (
              <a
                key={step.title}
                className="grid min-h-36 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 hover:border-slate-400 hover:bg-white"
                href={step.href}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="grid gap-1">
                  <span className="font-semibold text-slate-950">{step.title}</span>
                  <span className="text-sm leading-6 text-slate-600">{step.description}</span>
                </span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <CapabilityCard title="VERIFIED" items={dashboard.verifiedFeatures.map((feature) => feature.label)} />
        <div className="grid gap-4 md:grid-cols-2">
          <CapabilityCard title="PARTIAL" items={dashboard.partialFeatures.map((feature) => feature.label)} />
          <CapabilityCard title="DRAFT" items={dashboard.draftFeatures.map((feature) => feature.label)} />
        </div>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Local Pilot Feedback</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <LabelledInput label="Engineer" value={form.engineer} onChange={(value) => updateForm({ engineer: value })} />
            <LabelledInput label="Date" type="date" value={form.date} onChange={(value) => updateForm({ date: value })} />
            <LabelledInput
              label="Calculation"
              value={form.calculation}
              onChange={(value) => updateForm({ calculation: value })}
            />
            <LabelledInput
              label="Calculation ID"
              value={form.calculationId}
              onChange={(value) => updateForm({ calculationId: value })}
            />
            <LabelledInput
              label="Review status"
              value={form.reviewStatus}
              onChange={(value) => updateForm({ reviewStatus: value })}
            />
            <LabelledInput
              label="Verification level"
              value={form.verificationLevel}
              onChange={(value) => updateForm({ verificationLevel: value })}
            />
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Category</span>
            <Select
              value={form.category}
              onValueChange={(value) => updateForm({ category: value as PilotIssueCategory })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pilotIssueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <LabelledTextarea label="Problem" value={form.problem} onChange={(value) => updateForm({ problem: value })} />
            <LabelledTextarea label="Note" value={form.note} onChange={(value) => updateForm({ note: value })} />
            <LabelledTextarea
              label="Suggestion"
              value={form.suggestion}
              onChange={(value) => updateForm({ suggestion: value })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSaveFeedback}>
              <Send className="size-4" />
              Save local feedback
            </Button>
            <Button type="button" variant="outline" onClick={handleExportFeedback}>
              <FileJson className="size-4" />
              Export JSON
            </Button>
            <span className="text-sm font-medium text-slate-700">
              Stored locally: {feedback.length}
            </span>
          </div>
          {message ? <p className="text-sm font-medium text-slate-700">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function PilotDashboardSummary({ dashboard }: { dashboard: PilotDashboard }) {
  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
      <SummaryTile label="verified features" value={dashboard.verifiedFeatures.length.toString()} />
      <SummaryTile label="partial features" value={dashboard.partialFeatures.length.toString()} />
      <SummaryTile label="draft features" value={dashboard.draftFeatures.length.toString()} />
      <SummaryTile label="feedback" value={dashboard.feedbackCount.toString()} />
      <SummaryTile label="validation sessions" value={dashboard.validationSessionsCount.toString()} />
      <SummaryTile label="candidates" value={dashboard.candidatesCount.toString()} />
      <SummaryTile label="release evidence" value={dashboard.releaseEvidenceStatus} />
    </section>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function CapabilityCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function LabelledInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function LabelledTextarea({
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
      <textarea
        className="min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus-visible:border-slate-500 focus-visible:ring-3 focus-visible:ring-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
