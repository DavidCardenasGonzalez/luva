import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/app/App'
import { AppProviders } from '@/app/providers/AppProviders'
import '@/app/styles/global.css'
import '@/app/styles/layout.css'
import '@/features/auth/ui/auth.css'
import '@/features/admin/ui/admin-portal.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
