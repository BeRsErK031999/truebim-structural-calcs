import { Link } from 'react-router-dom'

import { getSavedCalculationCount } from '@/entities/calculation/model/calculationStorage'
import { useCalculationStore } from '@/entities/calculation/model/store'
import { getAppMetadata } from '@/shared/config/appMetadata'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

import { buildDiagnosticsModel, isLocalStorageAvailable } from './diagnostics'

export function DiagnosticsPage() {
  const currentStatus = useCalculationStore((state) => state.punchingShearResult?.status)
  const diagnostics = buildDiagnosticsModel({
    metadata: getAppMetadata(),
    localStorageAvailable: isLocalStorageAvailable(),
    savedCalculationsCount: getSavedCalculationCount(),
    currentCalculationStatus: currentStatus,
  })

  return (
    <div className="grid gap-6">
      <header className="grid gap-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Диагностика</h1>
        <p className="text-sm font-medium text-amber-700">{formatDiagnosticValue(diagnostics.warning)}</p>
      </header>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Среда выполнения</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <VerificationBadge label="Только черновики" active={diagnostics.verification.draftCases > 0} />
            <VerificationBadge
              label="Проверка ожидается"
              active={diagnostics.verification.verifiedCases === 0}
            />
            <VerificationBadge label="Проверено" active={diagnostics.verification.verifiedCases > 0} />
            <VerificationBadge label="Есть ошибки" active={diagnostics.verification.failedCases > 0} />
          </div>
          <dl className="grid gap-3 md:grid-cols-2">
            <DiagnosticItem label="Приложение загружено" value={formatDiagnosticValue(diagnostics.appLoaded)} />
            <DiagnosticItem label="Версия" value={diagnostics.version} />
            <DiagnosticItem label="Коммит" value={diagnostics.commit} />
            <DiagnosticItem label="Время сборки" value={diagnostics.buildTime} />
            <DiagnosticItem label="Среда" value={diagnostics.environment} />
            <DiagnosticItem
              label="localStorage доступен"
              value={diagnostics.localStorageAvailable ? 'да' : 'нет'}
            />
            <DiagnosticItem
              label="Сохраненные расчеты"
              value={diagnostics.savedCalculationsCount.toString()}
            />
            <DiagnosticItem
              label="Статус текущего расчета"
              value={formatDiagnosticValue(diagnostics.currentCalculationStatus)}
            />
            <DiagnosticItem
              label="Распределение напряжений"
              value={formatDiagnosticValue(diagnostics.stressDistributionSupport)}
            />
            <DiagnosticItem
              label="Регрессия напряжений"
              value={formatDiagnosticValue(diagnostics.stressRegressionSupport)}
            />
            <DiagnosticItem
              label="Checksum напряжений"
              value={formatDiagnosticValue(diagnostics.stressChecksumSupport)}
            />
            <DiagnosticItem
              label="Проверка осей"
              value={formatDiagnosticValue(diagnostics.axisConventionValidationSupport)}
            />
            <DiagnosticItem
              label="Поиск drift"
              value={formatDiagnosticValue(diagnostics.driftDetectionSupport)}
            />
            <DiagnosticItem
              label="trace support"
              value={formatDiagnosticValue(diagnostics.traceSupport)}
            />
            <DiagnosticItem
              label="Передача моментов"
              value={formatDiagnosticValue(diagnostics.momentTransferStatus)}
            />
            <DiagnosticItem
              label="Проверка моментов"
              value={formatDiagnosticValue(diagnostics.momentVerificationSupport)}
            />
            <DiagnosticItem
              label="Сравнение напряжений"
              value={formatDiagnosticValue(diagnostics.stressComparisonSupport)}
            />
            <DiagnosticItem
              label="Сравнение эксцентриситета"
              value={formatDiagnosticValue(diagnostics.eccentricityComparisonSupport)}
            />
            <DiagnosticItem label="Крайние колонны" value={formatDiagnosticValue(diagnostics.edgeSupport)} />
            <DiagnosticItem label="Угловые колонны" value={formatDiagnosticValue(diagnostics.cornerSupport)} />
            <DiagnosticItem label="Отверстия" value={formatDiagnosticValue(diagnostics.openingsSupport)} />
            <DiagnosticItem
              label="wall punching support"
              value={formatDiagnosticValue(diagnostics.wallPunchingSupport)}
            />
            <DiagnosticItem
              label="wall corner support"
              value={formatDiagnosticValue(diagnostics.wallCornerSupport)}
            />
            <DiagnosticItem
              label="multiple contour support"
              value={formatDiagnosticValue(diagnostics.multipleContourSupport)}
            />
            <DiagnosticItem
              label="shear reinforcement input support"
              value={formatDiagnosticValue(diagnostics.shearReinforcementInputSupport)}
            />
            <DiagnosticItem
              label="shear reinforcement capacity support"
              value={formatDiagnosticValue(diagnostics.shearReinforcementCapacitySupport)}
            />
            <DiagnosticItem
              label="contour selection support"
              value={formatDiagnosticValue(diagnostics.contourSelectionSupport)}
            />
            <DiagnosticItem
              label="Contour clipping"
              value={formatDiagnosticValue(diagnostics.clippedPerimeterSupport)}
            />
            <DiagnosticItem
              label="Проверка геометрии"
              value={formatDiagnosticValue(diagnostics.geometryVerificationSupport)}
            />
            <DiagnosticItem
              label="Проверка обрезки"
              value={formatDiagnosticValue(diagnostics.clippingVerificationSupport)}
            />
            <DiagnosticItem
              label="Проверка отверстий"
              value={formatDiagnosticValue(diagnostics.openingVerificationSupport)}
            />
            <DiagnosticItem
              label="Проверенная арифметика"
              value={formatDiagnosticValue(diagnostics.verifiedArithmeticSupport)}
            />
            <DiagnosticItem
              label="Частичная проверка"
              value={formatDiagnosticValue(diagnostics.partialVerificationSupport)}
            />
            <DiagnosticItem
              label="Проверенные случаи доказательств"
              value={diagnostics.verifiedEvidenceCount.toString()}
            />
            <DiagnosticItem
              label="Проверенные шаблоны доказательств для моментов"
              value={diagnostics.verifiedMomentEvidenceCount.toString()}
            />
            <DiagnosticItem label="Режим проверки" value={formatDiagnosticValue(diagnostics.reviewModeSupport)} />
            <DiagnosticItem
              label="Кандидат проверки"
              value={formatDiagnosticValue(diagnostics.verificationCandidateSupport)}
            />
            <DiagnosticItem
              label="Автоповышение кандидата"
              value={formatDiagnosticValue(diagnostics.candidateAutoPromotion)}
            />
            <DiagnosticItem
              label="Нужен ручной импорт набора данных"
              value={formatDiagnosticValue(diagnostics.manualDatasetImportRequired)}
            />
            <DiagnosticItem
              label="Сессия валидации"
              value={formatDiagnosticValue(diagnostics.validationSessionSupport)}
            />
            <DiagnosticItem
              label="Экспорт пакета валидации"
              value={formatDiagnosticValue(diagnostics.validationPackageExportSupport)}
            />
            <DiagnosticItem
              label="Прогресс чеклиста"
              value={formatDiagnosticValue(diagnostics.checklistProgressSupport)}
            />
            <DiagnosticItem
              label="Релизные материалы"
              value={formatDiagnosticValue(diagnostics.releaseEvidenceSupport)}
            />
            <DiagnosticItem
              label="Форматы релизных материалов"
              value={diagnostics.releaseEvidenceExportFormats}
            />
            <DiagnosticItem
              label="Анализ разрывов CalcEngine"
              value={formatDiagnosticValue(diagnostics.calcengineGapAnalysis)}
            />
            <DiagnosticItem
              label="Матрица готовности пилота"
              value={formatDiagnosticValue(diagnostics.pilotReadinessMatrix)}
            />
            <DiagnosticItem
              label="Готовность к проектному применению"
              value={formatDiagnosticValue(diagnostics.productionDesignReadiness)}
            />
            <DiagnosticItem
              label="Текущий продуктовый блокер"
              value={formatDiagnosticValue(diagnostics.currentProductionBlocker)}
            />
            <DiagnosticItem
              label="Пакет инженера готов"
              value={formatDiagnosticValue(diagnostics.engineerPackageReady)}
            />
            <DiagnosticItem
              label="Сессии валидации"
              value={diagnostics.validationSessionsCount.toString()}
            />
            <DiagnosticItem
              label="Замороженные снимки проверки"
              value={diagnostics.frozenReviewSnapshotsCount.toString()}
            />
            <DiagnosticItem
              label="Ожидают проверки"
              value={diagnostics.pendingReviewsCount.toString()}
            />
            <DiagnosticItem
              label="Принятые проверки"
              value={diagnostics.acceptedReviewsCount.toString()}
            />
            <DiagnosticItem
              label="Отклоненные проверки"
              value={diagnostics.rejectedReviewsCount.toString()}
            />
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Матрица проверенных возможностей</CardTitle>
            <Button asChild variant="outline">
              <Link to="/release-evidence">Релизные материалы</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            {diagnostics.verifiedCapabilityMatrix.map((capability) => (
              <DiagnosticItem
                key={capability.id}
                label={capability.label}
                value={`${formatDiagnosticValue(capability.status)} | арифметика: ${formatDiagnosticValue(capability.arithmeticSupport)}`}
              />
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Верификация</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            <DiagnosticItem
              label="Всего случаев"
              value={diagnostics.verification.totalCases.toString()}
            />
            <DiagnosticItem
              label="Черновые случаи"
              value={diagnostics.verification.draftCases.toString()}
            />
            <DiagnosticItem
              label="Проверенные случаи"
              value={diagnostics.verification.verifiedCases.toString()}
            />
            <DiagnosticItem
              label="Проваленные случаи"
              value={diagnostics.verification.failedCases.toString()}
            />
            <DiagnosticItem
              label="Проверенные случаи с моментами"
              value={diagnostics.verifiedMomentCasesCount.toString()}
            />
            <DiagnosticItem
              label="Черновые случаи с моментами"
              value={diagnostics.draftMomentCasesCount.toString()}
            />
            <DiagnosticItem
              label="Черновые случаи с отверстиями"
              value={diagnostics.openingDraftCasesCount.toString()}
            />
            <DiagnosticItem
              label="Проверенные крайние случаи"
              value={diagnostics.verifiedEdgeCount.toString()}
            />
            <DiagnosticItem
              label="Проверенные случаи с отверстиями"
              value={diagnostics.verifiedOpeningCount.toString()}
            />
            <DiagnosticItem
              label="verified shear reinforcement cases"
              value={diagnostics.reinforcementVerifiedCasesCount.toString()}
            />
          </dl>
          {diagnostics.verification.warning ? (
            <p className="mt-4 text-sm font-medium text-amber-700">
              {diagnostics.verification.warning}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function VerificationBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <Badge variant={active ? 'default' : 'secondary'} className="rounded-md">
      {label}
    </Badge>
  )
}

function DiagnosticItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-2 break-words text-base font-semibold text-slate-950">{value}</dd>
    </div>
  )
}

function formatDiagnosticValue(value: string) {
  const labels: Record<string, string> = {
    yes: 'да',
    no: 'нет',
    draft: 'черновик',
    'draft-geometry': 'черновая геометрия',
    verified: 'проверено',
    partial: 'частично',
    'local-only': 'локально',
    manifest: 'манифест',
    available: 'доступно',
    'not yet': 'пока нет',
    'trusted SP63 verification': 'доверенная проверка по СП 63',
    none: 'нет',
    draft_ok: 'черновик прошел',
    draft_failed: 'черновик не прошел',
    not_implemented: 'не реализовано',
    invalid_input: 'ошибка ввода',
    'Client-side diagnostics only': 'Только клиентская диагностика',
  }

  return labels[value] ?? value
}
