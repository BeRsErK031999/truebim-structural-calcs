import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { DiagnosticsPage } from '@/pages/diagnostics/DiagnosticsPage'
import { HomePage } from '@/pages/home/HomePage'
import { AppLayout } from '@/widgets/layout/AppLayout'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="diagnostics" element={<DiagnosticsPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
