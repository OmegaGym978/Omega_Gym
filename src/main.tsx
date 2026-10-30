import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import '@/store/pwa.store'
import '@/store/accent.store'
import { useThemeStore } from '@/store/theme.store'
import App from './App'
import './index.css'

const theme = localStorage.getItem('omega-gym-theme')
if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-center" />
    </BrowserRouter>
  </StrictMode>,
)
