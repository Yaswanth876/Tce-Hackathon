// src/main.jsx
// -------------------------------------------------------
// Application entry point.
// Mounts <App /> on the #root DOM node and imports global
// CSS (including Tailwind v4).
// -------------------------------------------------------

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   // Tailwind + global styles
import App from './App.jsx'

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Prevent stale PWA service workers from hijacking local dev routing.
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
      })
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
