import type { LucideIcon } from 'lucide-react'

export type CalculationSection = {
  title: string
  path: string
  icon: LucideIcon
  status: 'active' | 'planned'
}
