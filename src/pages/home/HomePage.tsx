import { motion } from 'framer-motion'

import { CalculationForm } from '@/features/calculation-form/CalculationForm'
import { Badge } from '@/shared/ui/badge'
import { CalculationHistoryPanel } from '@/widgets/calculation-history/CalculationHistoryPanel'

export function HomePage() {
  return (
    <motion.div
      className="grid gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-md bg-teal-50 text-teal-700 hover:bg-teal-50">
            Рабочий экран
          </Badge>
          <Badge variant="outline" className="rounded-md border-slate-300 text-slate-600">
            Пилотная проверка продавливания
          </Badge>
        </div>
        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
            TrueBIM: расчеты конструкций
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Рабочий экран расчета продавливания: исходные данные, проверка, результат и отчет.
          </p>
        </div>
      </header>

      <section className="grid items-start gap-6">
        <CalculationForm />
        <CalculationHistoryPanel />
      </section>
    </motion.div>
  )
}
