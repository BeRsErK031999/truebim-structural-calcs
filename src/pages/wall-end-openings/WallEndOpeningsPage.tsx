import { motion } from 'framer-motion'

import { WallEndOpeningsCalculator } from '@/features/wall-end-openings/WallEndOpeningsCalculator'
import { Badge } from '@/shared/ui/badge'

export const wallEndOpeningsRoute = '/wall-end-openings'

export function WallEndOpeningsPage() {
  return (
    <motion.div
      className="grid gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-md bg-teal-50 text-teal-700 hover:bg-teal-50">Новая вкладка</Badge>
          <Badge variant="outline" className="rounded-md border-slate-300 text-slate-600">
            Excel reference draft
          </Badge>
        </div>
        <div className="max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            Расчет торца стены с отверстиями
          </h1>
          <p className="mt-1 max-w-5xl text-sm leading-5 text-slate-600">
            Отдельный расчет продавливания по произвольному контуру: вырезы, центр тяжести, усилия и
            несущая способность пересчитываются вместе с рисунком.
          </p>
        </div>
      </header>

      <WallEndOpeningsCalculator />
    </motion.div>
  )
}
