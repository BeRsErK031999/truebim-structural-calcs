import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

type FormSectionProps = {
  title: string
  helperText?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function FormSection({ title, helperText, children, className = '', contentClassName = '' }: FormSectionProps) {
  return (
    <Card className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <CardHeader className="space-y-1 p-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {helperText ? <p className="text-sm leading-5 text-slate-600">{helperText}</p> : null}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className={`grid gap-4 md:grid-cols-2 ${contentClassName}`}>{children}</div>
      </CardContent>
    </Card>
  )
}
