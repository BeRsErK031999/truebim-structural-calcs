import { motion } from 'framer-motion'

import { CalculationForm } from '@/features/calculation-form/CalculationForm'
import { Badge } from '@/shared/ui/badge'

export function HomePage() {
  return (
    <motion.div
      className="grid gap-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:flex-none">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-md bg-teal-50 text-teal-700 hover:bg-teal-50">Рабочий экран</Badge>
          <Badge variant="outline" className="rounded-md border-slate-300 text-slate-600">
            Проверка продавливания
          </Badge>
        </div>
        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">TrueBIM: расчеты конструкций</h1>
          <p className="mt-1 max-w-4xl text-sm leading-5 text-slate-600">
            Расчет продавливания: исходные данные, проверка, результат и инженерный отчет.
          </p>
        </div>
      </header>

      <section className="grid items-start gap-6 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <CalculationForm />
      </section>
    </motion.div>
  )
}
