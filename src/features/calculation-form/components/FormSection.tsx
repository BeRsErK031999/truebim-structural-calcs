import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

type FormSectionProps = {
  title: string
  helperText: string
  children: ReactNode
}

export function FormSection({ title, helperText, children }: FormSectionProps) {
  return (
    <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-6 text-slate-600">{helperText}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">{children}</div>
      </CardContent>
    </Card>
  )
}
