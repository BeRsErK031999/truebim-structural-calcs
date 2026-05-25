import { Building2, Columns3, DraftingCompass, Layers3 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import type { CalculationSection } from '@/types/navigation'

const sections: CalculationSection[] = [
  { title: 'Продавливание', path: '/', icon: DraftingCompass, status: 'active' },
  { title: 'Поперечная сила', path: '/shear', icon: Layers3, status: 'planned' },
  { title: 'Балки', path: '/beams', icon: Building2, status: 'planned' },
  { title: 'Колонны', path: '/columns', icon: Columns3, status: 'planned' },
]

export function Sidebar() {
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
          <p className="text-base font-semibold text-slate-950">Structural Calcs</p>
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
    </aside>
  )
}
