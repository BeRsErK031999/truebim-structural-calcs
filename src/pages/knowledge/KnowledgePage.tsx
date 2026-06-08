import { BookOpen, ClipboardList, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'

import {
  buildKnowledgeSummary,
  knowledgeCategories,
  knowledgeCategoryLabels,
  listKnowledgeEntries,
  searchKnowledgeEntries,
  type KnowledgeCategory,
} from '@/features/knowledge-base'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<KnowledgeCategory | 'all'>('all')
  const entries = listKnowledgeEntries()
  const filteredEntries = useMemo(
    () => searchKnowledgeEntries(entries, { query, category, includeWarnings: true }),
    [category, entries, query],
  )
  const summary = buildKnowledgeSummary(entries)

  return (
    <div className="grid gap-6">
      <header className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Инженерная база знаний</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Локальная база выводов по проверкам, заметок по СП 63, подтвержденных трактовок, открытых вопросов
              и неразрешенных расхождений. Записи помогают верификации без изменения формул и логики повышения статуса.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-md">
            {summary.totalEntries} записей
          </Badge>
        </div>
      </header>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Категории</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <button
            type="button"
            className={category === 'all' ? activeChipClass : chipClass}
            onClick={() => setCategory('all')}
          >
            Все
          </button>
          {knowledgeCategories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? activeChipClass : chipClass}
              onClick={() => setCategory(item)}
            >
              {knowledgeCategoryLabels[item]}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Поиск</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Поиск по названию, тегам, источнику, выводам и предупреждениям"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryTile label="Подтвержденные выводы" value={String(summary.verifiedFindings.length)} />
            <SummaryTile label="Открытые вопросы" value={String(summary.openQuestions.length)} />
            <SummaryTile label="Неразрешенные расхождения" value={String(summary.unresolvedMismatches.length)} />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <KnowledgeList
          title="Последние записи"
          icon={<BookOpen className="size-4" />}
          emptyText="Записей пока нет. Первая может появиться после принятой инженерной проверки."
          entries={summary.recentEntries}
        />
        <FindingList
          title="Подтвержденные выводы"
          emptyText="Подтвержденных выводов пока нет."
          findings={summary.verifiedFindings}
        />
        <FindingList
          title="Открытые вопросы"
          emptyText="Открытых вопросов пока нет."
          findings={summary.openQuestions}
        />
        <FindingList
          title="Неразрешенные расхождения"
          emptyText="Неразрешенных расхождений пока нет."
          findings={summary.unresolvedMismatches}
        />
      </section>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Результаты поиска</CardTitle>
        </CardHeader>
        <CardContent>
          <KnowledgeEntries entries={filteredEntries} emptyText="Под текущие фильтры записи не подходят." />
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Шаблон уроков проверки</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-5">
            {['проблема', 'причина', 'решение инженера', 'доказательства', 'рекомендация'].map((field) => (
              <div key={field} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{field}</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-900">Обязательно</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Заметки по СП 63</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm leading-6 text-slate-600">
          <p>Храните ссылки на пункты, внутренние пояснения и подтвержденные трактовки.</p>
          <p>Не копируйте текст норматива в приложение. Оставляйте только ссылку на пункт стандарта.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function KnowledgeList({
  title,
  icon,
  entries,
  emptyText,
}: {
  title: string
  icon: ReactNode
  entries: ReturnType<typeof listKnowledgeEntries>
  emptyText: string
}) {
  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <KnowledgeEntries entries={entries} emptyText={emptyText} />
      </CardContent>
    </Card>
  )
}

function KnowledgeEntries({
  entries,
  emptyText,
}: {
  entries: ReturnType<typeof listKnowledgeEntries>
  emptyText: string
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-600">{emptyText}</p>
  }

  return (
    <div className="grid gap-3">
      {entries.map((entry) => (
        <article key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-950">{entry.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{entry.summary}</p>
            </div>
            <Badge variant="secondary" className="rounded-md">{knowledgeCategoryLabels[entry.category]}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function FindingList({
  title,
  findings,
  emptyText,
}: {
  title: string
  findings: Array<{ entry: ReturnType<typeof listKnowledgeEntries>[number]; text: string }>
  emptyText: string
}) {
  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {findings.length === 0 ? (
          <p className="text-sm text-slate-600">{emptyText}</p>
        ) : (
          <ul className="grid gap-2 text-sm text-slate-700">
            {findings.slice(0, 6).map((finding) => (
              <li key={`${finding.entry.id}-${finding.text}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="font-semibold text-slate-950">{finding.entry.title}: </span>
                {finding.text}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

const chipClass = 'rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100'
const activeChipClass = 'rounded-md border border-slate-950 bg-slate-950 px-3 py-2 text-sm font-semibold text-white'
