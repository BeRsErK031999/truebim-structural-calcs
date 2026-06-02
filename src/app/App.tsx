import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { DiagnosticsPage } from '@/pages/diagnostics/DiagnosticsPage'
import { EngineerPortalPage } from '@/pages/engineer/EngineerPortalPage'
import { HomePage } from '@/pages/home/HomePage'
import { PilotPage } from '@/pages/pilot/PilotPage'
import { pilotRoute } from '@/pages/pilot/pilotContent'
import { ReleaseEvidencePage } from '@/pages/release-evidence/ReleaseEvidencePage'
import { EngineeringReviewPage } from '@/pages/review/EngineeringReviewPage'
import { ValidationSessionPage } from '@/pages/validation-session/ValidationSessionPage'
import { AppLayout } from '@/widgets/layout/AppLayout'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="engineer" element={<EngineerPortalPage />} />
          <Route path={pilotRoute.slice(1)} element={<PilotPage />} />
          <Route path="review" element={<EngineeringReviewPage />} />
          <Route path="validation-session" element={<ValidationSessionPage />} />
          <Route path="diagnostics" element={<DiagnosticsPage />} />
          <Route path="release-evidence" element={<ReleaseEvidencePage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
