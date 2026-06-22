import {
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  FileArchive,
  FileText,
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
  officeAppLinkActions,
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
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Портал инженера</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Стартовая страница проверки расчета: выполните расчет, сравните его с эталоном, подтвердите
              проверку и скачайте материалы для передачи.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton
              copied={copied === 'instructions'}
              label="Скопировать инструкции инженеру"
              onClick={() => void copyText('instructions', buildEngineerInstructionsCopyText())}
            />
            <CopyButton
              copied={copied === 'checklist'}
              label="Скопировать список материалов"
              onClick={() => void copyText('checklist', buildReturnChecklistCopyText())}
            />
            <CopyButton
              copied={copied === 'links'}
              label="Скопировать разделы приложения"
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
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Шаг {index + 1}</p>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="size-4 text-slate-700" />
                      {step.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-slate-700">
                <p>{step.description}</p>
                <InfoBlock label="Что сделать" value={step.action} />
                <InfoBlock label="Что будет подготовлено" value={step.preparedMaterials} />
                <Button asChild variant="outline" className="w-fit">
                  <Link to={step.href}>
                    <ExternalLink className="size-4" />
                    {step.buttonLabel}
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
            <CardTitle>Статусы</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 md:grid-cols-2">
              <StatusCard label="статус расчета" value={formatVerificationLevel(result.verificationLevel)} />
              <StatusCard label="проверено" value={formatFeatureList(result.verifiedFeatures)} />
              <StatusCard label="требует проверки" value={formatFeatureList(result.draftFeatures)} />
              <StatusCard
                label="результаты проверки"
                value={formatStatusValue(latestSession?.candidate?.candidateStatus ?? 'not-created')}
              />
              <StatusCard
                label="чеклист"
                value={checklist ? `${checklist.completePercent}% заполнено` : 'проверка еще не начата'}
              />
              <StatusCard label="материалы проверки" value="готовы к скачиванию" />
            </dl>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Материалы проверки</CardTitle>
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
            <CardTitle>Области проверки</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-md">Проверено: {capabilities.verified.length}</Badge>
              <Badge variant="secondary" className="rounded-md">
                Частично проверено: {capabilities.partial.length}
              </Badge>
              <Badge variant="secondary" className="rounded-md">
                Не проверено: {capabilities.draft.length}
              </Badge>
            </div>
            <CapabilityList title="Проверено" items={capabilities.verified.map((item) => formatFeatureLabel(item.id))} />
            <CapabilityList
              title="Частично проверено"
              items={capabilities.partial.map((item) => formatFeatureLabel(item.id))}
            />
            <CapabilityList title="Требует проверки" items={capabilities.draft.map((item) => formatFeatureLabel(item.id))} />
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Разделы приложения</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {officeAppLinkActions.map((link) => (
              <Button key={link.href} asChild variant="outline" className="justify-start">
                <Link to={link.href}>
                  <ExternalLink className="size-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Текущий расчет</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-3">
            <StatusCard label="тип случая" value={formatCaseType(draft.caseType)} />
            <StatusCard label="результат расчета" value={formatCalculationStatus(result.status)} />
            <StatusCard label="предупреждения отчета" value={String(report.warnings.length)} />
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
      {copied ? 'Скопировано' : label}
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
  const uniqueItems = Array.from(new Set(items))

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <ul className="mt-2 grid gap-1 text-slate-700">
        {(uniqueItems.length > 0 ? uniqueItems : ['нет']).map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  )
}

function formatFeatureList(values: string[]) {
  const labels = Array.from(new Set(values.map(formatFeatureLabel)))

  return labels.length > 0 ? labels.join(', ') : 'нет'
}

function formatFeatureLabel(feature: string) {
  const labels: Record<string, string> = {
    'center-force-only': 'центральная колонна без моментов',
    'center-moment-transfer': 'центральная колонна с моментами',
    edge: 'крайние колонны',
    corner: 'угловые колонны',
    openings: 'отверстия',
    'wall-end': 'стены',
    'wall-corner': 'стены',
    'shear-reinforcement': 'поперечная арматура',
    'round-columns': 'круглые колонны',
  }

  return labels[feature] ?? feature
}

function formatVerificationLevel(value: string) {
  const labels: Record<string, string> = {
    verified: 'Проверено',
    partial: 'Частично проверено',
    draft: 'Не проверено',
  }

  return labels[value] ?? value
}

function formatCalculationStatus(value: string) {
  const labels: Record<string, string> = {
    draft_ok: 'проходит по расчету',
    draft_failed: 'не проходит по расчету',
    invalid_input: 'нужно исправить исходные данные',
    not_implemented: 'требует отдельной проверки',
    warning: 'есть предупреждения',
    draft: 'требует проверки',
  }

  return labels[value] ?? value
}

function formatCaseType(value: string) {
  const labels: Record<string, string> = {
    center: 'центральная колонна',
    edge: 'крайняя колонна',
    corner: 'угловая колонна',
    opening: 'колонна рядом с отверстием',
    'wall-end': 'конец стены',
    'wall-corner': 'угол стены',
    round: 'круглая колонна',
  }

  return labels[value] ?? value
}

function formatStatusValue(value: string) {
  const labels: Record<string, string> = {
    'not-created': 'еще не подготовлены',
    'ready-for-validation': 'готовы к подтверждению',
    incomplete: 'нужно заполнить данные',
    rejected: 'отклонен',
  }

  return labels[value] ?? value
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
