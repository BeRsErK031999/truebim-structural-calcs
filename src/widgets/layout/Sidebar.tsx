import {
  Activity,
  Building2,
  ClipboardCheck,
  Columns3,
  DraftingCompass,
  FileArchive,
  Layers3,
  ListChecks,
  PackageCheck,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { getAppMetadata } from '@/shared/config/appMetadata'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import type { CalculationSection } from '@/types/navigation'

const sections: CalculationSection[] = [
  { title: 'Продавливание', path: '/', icon: DraftingCompass, status: 'active' },
  { title: 'Поперечная сила', path: '/shear', icon: Layers3, status: 'planned' },
  { title: 'Балки', path: '/beams', icon: Building2, status: 'planned' },
  { title: 'Колонны', path: '/columns', icon: Columns3, status: 'planned' },
  { title: 'Портал инженера', path: '/engineer', icon: ClipboardCheck, status: 'active' },
  { title: 'Пилот', path: '/pilot', icon: ListChecks, status: 'active' },
  { title: 'Инженерная проверка', path: '/review', icon: ClipboardCheck, status: 'active' },
  { title: 'Сессия валидации', path: '/validation-session', icon: PackageCheck, status: 'active' },
  { title: 'Диагностика', path: '/diagnostics', icon: Activity, status: 'active' },
  { title: 'Релизные материалы', path: '/release-evidence', icon: FileArchive, status: 'active' },
]

export function Sidebar() {
  const metadata = getAppMetadata()

  return (
    <aside className="border-slate-200 bg-white/90 px-4 py-4 shadow-sm lg:sticky lg:top-0 lg:h-screen lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-slate-950 text-white">
          TB
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            TrueBIM
          </p>
          <p className="text-base font-semibold text-slate-950">Расчеты конструкций</p>
        </div>
      </div>

      <Separator className="my-5" />

      <nav className="grid gap-2">
        {sections.map((section) => (
          <NavLink
            key={section.title}
            to={section.path}
            className={({ isActive }) =>
              [
                'flex min-h-12 items-center justify-between rounded-lg px-3 text-sm font-medium transition',
                isActive
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              ].join(' ')
            }
          >
            <span className="flex items-center gap-3">
              <section.icon className="size-4" />
              {section.title}
            </span>
            {section.status === 'planned' ? (
              <Badge variant="secondary" className="rounded-md text-[11px]">
                скоро
              </Badge>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <Separator className="my-5" />

      <div className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-900">Сборка</p>
        <p>Версия: {metadata.version}</p>
        <p>Коммит: {metadata.commit}</p>
        <p>Время: {metadata.buildTime}</p>
        <p>Среда: {metadata.environment}</p>
      </div>
    </aside>
  )
}
