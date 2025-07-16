import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.tsx'
import './types/ion-icon.d.ts'
import { Providers } from './providers'
import './utils/errorTracker' // Global error tracking
import './utils/suppressWarnings' // Suppress known deprecation warnings

// Import Bootstrap JavaScript and make it globally available
import * as bootstrap from 'bootstrap'
// Make Bootstrap available globally for tooltip initialization
;(window as any).bootstrap = bootstrap

// Import app initialization
import { initializeApp } from './utils/appInitialization'

// Import Splide for carousels
import { Splide } from '@splidejs/splide'
// Make Splide available globally
window.Splide = Splide

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
