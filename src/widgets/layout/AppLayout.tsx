import { Outlet } from 'react-router-dom'

import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:h-screen lg:min-h-0 lg:grid-cols-[280px_1fr] lg:overflow-hidden">
        <Sidebar />
        <main className="min-w-0 px-4 py-4 sm:px-6 lg:min-h-0 lg:overflow-hidden lg:px-6 lg:py-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
