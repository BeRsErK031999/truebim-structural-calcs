import { motion } from 'framer-motion'

import { CalculationForm } from '@/features/calculation-form/CalculationForm'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { ResultPanel } from '@/widgets/results/ResultPanel'

const workflowCards = [
  { title: 'Геометрия', value: 'Плита, колонна, контур', tone: 'bg-sky-50 text-sky-700' },
  { title: 'Материалы', value: 'Бетон и армирование', tone: 'bg-amber-50 text-amber-700' },
  { title: 'Проверки', value: 'Нагрузки и коэффициенты', tone: 'bg-emerald-50 text-emerald-700' },
]

export function HomePage() {
  return (
    <motion.div
      className="grid gap-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-md bg-teal-50 text-teal-700 hover:bg-teal-50">
            UI shell
          </Badge>
          <Badge variant="outline" className="rounded-md border-slate-300 text-slate-600">
            Без расчетной логики
          </Badge>
        </div>
        <div className="max-w-4xl">
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            TrueBIM Structural Calculations
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Рабочая оболочка для инженерных проверок: навигация по разделам,
            подготовка исходных данных и закрепленная панель будущих результатов.
          </p>
        </div>
      </header>

      <Tabs defaultValue="punching" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-lg bg-white p-1 shadow-sm md:w-[520px] md:grid-cols-4">
          <TabsTrigger value="punching">Продавливание</TabsTrigger>
          <TabsTrigger value="shear">Срез</TabsTrigger>
          <TabsTrigger value="beams">Балки</TabsTrigger>
          <TabsTrigger value="columns">Колонны</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="grid gap-4 md:grid-cols-3">
        {workflowCards.map((card) => (
          <Card key={card.title} className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex rounded-md px-2.5 py-1 text-sm font-semibold ${card.tone}`}>
                {card.title}
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-950">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <CalculationForm />
        <ResultPanel />
      </section>
    </motion.div>
  )
}
