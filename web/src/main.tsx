import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from '@/app/App'
import { AppProviders } from '@/app/providers/AppProviders'
import '@/app/styles/global.css'
import '@/app/styles/layout.css'
import '@/features/auth/ui/auth.css'
import '@/features/app-shell/ui/app-shell.css'
import '@/features/marketing/ui/marketing.css'
import '@/features/stories/ui/stories.css'
import '@/features/vocabulary/ui/vocabulary.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
