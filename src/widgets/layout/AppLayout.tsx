import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from './Sidebar'

type ScrollMode = 'page' | 'workspace'

function getScrollMode(pathname: string): ScrollMode {
  return pathname === '/' ? 'workspace' : 'page'
}

export function AppLayout() {
  const { pathname } = useLocation()
  const scrollMode = getScrollMode(pathname)
  const isWorkspace = scrollMode === 'workspace'

  return (
    <div
      className={[
        'min-h-screen bg-[#f5f7fb] text-slate-950',
        isWorkspace ? 'lg:h-screen lg:overflow-hidden' : '',
      ].join(' ')}
      data-scroll-mode={scrollMode}
    >
      <div
        className={[
          'mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]',
          isWorkspace ? 'lg:h-screen lg:min-h-0 lg:overflow-hidden' : '',
        ].join(' ')}
      >
        <Sidebar />
        <main
          className={[
            'min-w-0 px-4 py-4 sm:px-6 lg:px-6 lg:py-4',
            isWorkspace ? 'lg:min-h-0 lg:overflow-hidden' : '',
          ].join(' ')}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
