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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
