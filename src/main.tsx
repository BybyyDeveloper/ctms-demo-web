import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import './hooks/usePrefs'
import { AppProvider } from './contexts/AppContext'
import { ToastProvider } from './components/Toast'
import { UpsellProvider } from './components/Upsell'
import { loadDb } from './services/db'
import App from './App'

// Anti-clickjacking: GitHub Pages tidak bisa mengirim header frame-ancestors, jadi tolak jika di-embed.
if (window.top !== window.self) {
  document.body.textContent = 'Blocked: this app cannot be embedded in another page.'
} else {
  // HashRouter: kompatibel dengan GitHub Pages (refresh di halaman internal tidak 404)
  loadDb().then((initial) => createRoot(document.getElementById('root')!).render(
    <StrictMode><HashRouter><ToastProvider><UpsellProvider><AppProvider initial={initial}><App /></AppProvider></UpsellProvider></ToastProvider></HashRouter></StrictMode>,
  ))
}
