import { getSavedCalculationCount } from '@/entities/calculation/model/calculationStorage'
import { useCalculationStore } from '@/entities/calculation/model/store'
import { getAppMetadata } from '@/shared/config/appMetadata'
import { Badge } from '@/shared/ui/badge'
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
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Diagnostics</h1>
        <p className="text-sm font-medium text-amber-700">{diagnostics.warning}</p>
      </header>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Runtime</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <VerificationBadge label="Draft only" active={diagnostics.verification.draftCases > 0} />
            <VerificationBadge
              label="Verification pending"
              active={diagnostics.verification.verifiedCases === 0}
            />
            <VerificationBadge label="Verified" active={diagnostics.verification.verifiedCases > 0} />
            <VerificationBadge label="Failed" active={diagnostics.verification.failedCases > 0} />
          </div>
          <dl className="grid gap-3 md:grid-cols-2">
            <DiagnosticItem label="App loaded" value={diagnostics.appLoaded} />
            <DiagnosticItem label="Version" value={diagnostics.version} />
            <DiagnosticItem label="Commit" value={diagnostics.commit} />
            <DiagnosticItem label="Build time" value={diagnostics.buildTime} />
            <DiagnosticItem label="Environment" value={diagnostics.environment} />
            <DiagnosticItem
              label="localStorage available"
              value={diagnostics.localStorageAvailable ? 'yes' : 'no'}
            />
            <DiagnosticItem
              label="Saved calculations"
              value={diagnostics.savedCalculationsCount.toString()}
            />
            <DiagnosticItem
              label="Current calculation status"
              value={diagnostics.currentCalculationStatus}
            />
            <DiagnosticItem
              label="Stress distribution support"
              value={diagnostics.stressDistributionSupport}
            />
            <DiagnosticItem
              label="Moment transfer status"
              value={diagnostics.momentTransferStatus}
            />
            <DiagnosticItem label="Edge support" value={diagnostics.edgeSupport} />
            <DiagnosticItem label="Corner support" value={diagnostics.cornerSupport} />
            <DiagnosticItem label="Openings support" value={diagnostics.openingsSupport} />
            <DiagnosticItem
              label="Clipped perimeter support"
              value={diagnostics.clippedPerimeterSupport}
            />
            <DiagnosticItem
              label="Geometry verification support"
              value={diagnostics.geometryVerificationSupport}
            />
            <DiagnosticItem
              label="Clipping verification support"
              value={diagnostics.clippingVerificationSupport}
            />
            <DiagnosticItem
              label="Opening verification support"
              value={diagnostics.openingVerificationSupport}
            />
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
              label="Verified moment cases"
              value={diagnostics.verifiedMomentCasesCount.toString()}
            />
            <DiagnosticItem
              label="Draft moment cases"
              value={diagnostics.draftMomentCasesCount.toString()}
            />
            <DiagnosticItem
              label="Opening draft cases"
              value={diagnostics.openingDraftCasesCount.toString()}
            />
            <DiagnosticItem
              label="Verified edge cases"
              value={diagnostics.verifiedEdgeCount.toString()}
            />
            <DiagnosticItem
              label="Verified opening cases"
              value={diagnostics.verifiedOpeningCount.toString()}
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
