// src/App.jsx
// ---------------------------------------------------------------
// Root application — Government portal layout.
// Structure follows Indian government portal conventions:
//   1. Skip link (accessibility)
//   2. Top utility bar (Ministry name)
//   3. Tricolor stripe
//   4. Main header (emblem + portal title + nav)
//   5. Breadcrumb / section bar
//   6. Page content
//   7. Official footer
// ---------------------------------------------------------------

import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import OfficerDashboard from './pages/OfficerDashboard'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CitizenDashboard from './pages/CitizenDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminLogin from './pages/AdminLogin'
import HeatmapPage from './pages/HeatmapPage'
import DailyReportPage from './pages/DailyReportPage'
import Leaderboard from './pages/Leaderboard'
import NotificationsPage from './pages/NotificationsPage'
import TeamLeaderboard from './pages/TeamLeaderboard'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedRouteAdmin from './components/ProtectedRouteAdmin'
import { AuthProvider } from './context/AuthContext'
import { FUNCTIONS_CONFIGURED, MAPS_CONFIGURED } from './config'

// ── Navigation items ──────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'File a Complaint', end: true },
  { to: '/map', label: 'Monitoring Map', end: true },
  { to: '/leaderboard', label: 'Leaderboard', end: true },
  { to: '/daily-report', label: 'Daily Report', end: true },
]

// ── Emblem SVG (Ashoka-style simplified wheel) ────────────────
function AshokaPillar() {
  return (
    <svg
      width="48" height="48" viewBox="0 0 48 48"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Stylised Ashoka Chakra — 24 spokes */}
      <circle cx="24" cy="24" r="20" stroke="#104080" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="3" fill="#104080" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180
        const x1 = 24 + 4 * Math.cos(angle)
        const y1 = 24 + 4 * Math.sin(angle)
        const x2 = 24 + 18 * Math.cos(angle)
        const y2 = 24 + 18 * Math.sin(angle)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#104080" strokeWidth="1.2"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

// ── Env validation banner (shown when keys are missing) ──────────
function EnvBanner() {
  const missing = []
  if (!FUNCTIONS_CONFIGURED) missing.push('VITE_FUNCTIONS_BASE_URL')
  if (!MAPS_CONFIGURED) missing.push('VITE_GOOGLE_MAPS_API_KEY')
  if (missing.length === 0) return null

  return (
    <div
      role="alert"
      style={{
        background: '#fef3c7',
        borderBottom: '1px solid #fcd34d',
        color: '#78350f',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-bold flex-shrink-0">Configuration</span>
        <span>
          Missing env var{missing.length > 1 ? 's' : ''}:{' '}
          {missing.map((k) => (
            <code key={k} className="bg-amber-100 border border-amber-300 px-1 rounded mx-0.5">{k}</code>
          ))}
          — add to <code className="bg-amber-100 border border-amber-300 px-1 rounded">Aqro /.env</code>
        </span>
      </div>
    </div>
  )
}

// ── Full layout shell ─────────────────────────────────────────
function GovLayout({ children }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="flex flex-col min-h-dvh">

      {/* Skip to content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50
                   focus:bg-[var(--color-gov-700)] focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>

      {/* ── Sticky nav wrapper ── */}
      <div className="sticky top-0 z-50 shadow-md">

      {/* ── 1. Top utility bar ── */}
      <div className="bg-[var(--color-gov-900)] text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span className="tracking-wide opacity-80 font-medium">
            Government of Tamil Nadu &nbsp;|  Urban Local Bodies Department
          </span>
          <div className="flex items-center gap-4 opacity-80">
            <a href="tel:+917871661787" className="hover:text-white transition">
              Helpline: +91 78716 61787
            </a>
            <span aria-hidden="true">|</span>
            <a href="https://maduraicorporation.co.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">maduraicorporation.co.in</a>
          </div>
        </div>
      </div>

      {/* ── 2. Tricolor stripe ── */}
      <div className="tricolor-stripe" aria-hidden="true" />

      {/* ── 3. Portal header ── */}
      <header className="bg-white border-b border-[#d1d9e6] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Emblem */}
          <div className="flex-shrink-0">
            <AshokaPillar />
          </div>

          {/* Portal title */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[var(--color-gov-900)] leading-tight tracking-tight truncate">
              Aqro  &mdash; Madurai City Municipal Corporation
            </h1>
            <p className="text-xs text-[var(--color-muted)] leading-tight mt-0.5 truncate">
              Government of Tamil Nadu &mdash; AI-Enabled Civic Sanitation
            </p>
          </div>

          {/* ── 4. Navigation — left-aligned in header row ── */}
          <nav
            className="hidden md:flex items-center gap-0.5 ml-4"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'px-3 py-1.5 text-xs font-semibold tracking-wide rounded transition-colors duration-150',
                    'border-b-2 focus:outline-none whitespace-nowrap',
                    isActive
                      ? 'border-[var(--color-gov-700)] text-[var(--color-gov-900)] bg-[var(--color-gov-50)]'
                      : 'border-transparent text-[var(--color-gov-600)] hover:text-[var(--color-gov-900)] hover:bg-[var(--color-gov-50)]',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
            {isHome && (
              <NavLink
                to="/login"
                end
                className={({ isActive }) =>
                  [
                    'px-3 py-1.5 text-xs font-semibold tracking-wide rounded transition-colors duration-150',
                    'border-b-2 focus:outline-none whitespace-nowrap',
                    isActive
                      ? 'border-[var(--color-gov-700)] text-[var(--color-gov-900)] bg-[var(--color-gov-50)]'
                      : 'border-transparent text-[var(--color-gov-600)] hover:text-[var(--color-gov-900)] hover:bg-[var(--color-gov-50)]',
                  ].join(' ')
                }
              >
                Login
              </NavLink>
            )}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Official badge */}
          <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#FF9933' }}>
              தமிழ்நாடு
            </span>
            <span className="text-[10px] font-semibold text-[var(--color-muted)] tracking-wide">
              Est. 1866 &middot; 100 Wards
            </span>
          </div>
        </div>
      </header>

      </div>{/* /sticky nav wrapper */}

      {/* ── 5. Env warning (only when keys are missing) ── */}
      <EnvBanner />

      {/* ── 7. Page content ── */}
      <main id="main-content" className="flex-1 flex flex-col bg-white">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[var(--color-gov-900)] text-white mt-auto">

        {/* Tricolor stripe */}
        <div className="flex h-1" aria-hidden="true">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

            {/* Col 1 — Brand */}
            <div className="space-y-3">
              <p className="text-[#FF9933] text-xs font-bold uppercase tracking-widest">Aqro  Portal</p>
              <p className="text-sm font-semibold text-white leading-snug">
                Corporation of Madurai
              </p>
              <p className="text-blue-200 text-xs leading-relaxed">
                AI-powered citizen sanitation reporting platform under the Swachh Bharat Mission,
                Government of Tamil Nadu.
              </p>
              {/* Gov external links */}
              <div className="pt-1 space-y-1 text-xs">
                {[
                  { href: 'https://maduraicorporation.co.in', label: 'maduraicorporation.co.in' },
                  { href: 'https://www.tn.gov.in',             label: 'tn.gov.in' },
                  { href: 'https://www.tnurbantree.tn.gov.in', label: 'TN Urban Development (CMA)' },
                ].map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-300 hover:text-white transition-colors"
                  >
                    <span className="text-[10px]">↗</span> {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2 — Portal Links */}
            <div className="space-y-3">
              <p className="text-[#FF9933] text-xs font-bold uppercase tracking-widest">Portal</p>
              <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `text-xs transition-colors ${isActive ? 'text-[#FF9933] font-semibold' : 'text-blue-200 hover:text-white'}`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
                {isHome && (
                  <NavLink
                    to="/login"
                    end
                    className={({ isActive }) =>
                      `text-xs transition-colors ${isActive ? 'text-[#FF9933] font-semibold' : 'text-blue-200 hover:text-white'}`
                    }
                  >
                    Login
                  </NavLink>
                )}
              </nav>
            </div>

            {/* Col 3 — Contact */}
            <div className="space-y-3">
              <p className="text-[#FF9933] text-xs font-bold uppercase tracking-widest">Contact</p>
              <address className="not-italic text-xs text-blue-200 space-y-2 leading-relaxed">
                <p>Arignar Anna Maligai, Thallakulam<br />Madurai – 625 002, Tamil Nadu, India</p>
                <p>
                  <a href="tel:914522540333" className="hover:text-white transition-colors">
                    +91 452 2540333
                  </a>
                </p>
                <p>
                  Helpline:{' '}
                  <a href="tel:917871661787" className="hover:text-white transition-colors">
                    +91 78716 61787
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:commissioner@maduraicorporation.in"
                    className="hover:text-white transition-colors break-all"
                  >
                    commissioner@maduraicorporation.in
                  </a>
                </p>
              </address>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-blue-300">
            <span>
              © {new Date().getFullYear()} Urban Local Bodies Department, Government of Tamil Nadu. All rights reserved.
            </span>
            <span className="flex gap-4">
              <a href="https://maduraicorporation.co.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Official Site</a>
              <a href="https://maduraipublic.grievancecell.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Grievance Cell</a>
            </span>
          </div>

        </div>
      </footer>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public portal routes (GovLayout) ── */}
          <Route path="/"         element={<GovLayout><LandingPage /></GovLayout>} />
          <Route path="/report"   element={<GovLayout><Home /></GovLayout>} />
          <Route path="/map"          element={<GovLayout><HeatmapPage /></GovLayout>} />
          <Route path="/daily-report"  element={<GovLayout><DailyReportPage /></GovLayout>} />
          <Route path="/leaderboard"   element={<GovLayout><Leaderboard /></GovLayout>} />
          <Route path="/dashboard"     element={<GovLayout><OfficerDashboard /></GovLayout>} />

          {/* ── Auth routes ── */}
          <Route path="/login"     element={<GovLayout><LoginPage /></GovLayout>} />
          <Route path="/register"  element={<GovLayout><RegisterPage /></GovLayout>} />

          {/* ── Admin / Municipality login ── */}
          <Route path="/admin"    element={<GovLayout><AdminLogin /></GovLayout>} />
          {/* Legacy admin login alias */}
          <Route path="/admin-mc" element={<GovLayout><AdminLoginPage /></GovLayout>} />

          {/* ── Protected citizen dashboard ── */}
          <Route path="/citizen" element={
            <ProtectedRoute role="citizen">
              <GovLayout><CitizenDashboard /></GovLayout>
            </ProtectedRoute>
          } />

          {/* ── Protected team leaderboard (admin/municipality) ── */}
          <Route path="/admin/teams-leaderboard" element={
            <ProtectedRouteAdmin>
              <GovLayout><TeamLeaderboard /></GovLayout>
            </ProtectedRouteAdmin>
          } />

          {/* ── Protected citizen notifications ── */}
          <Route path="/notifications" element={
            <ProtectedRoute role="citizen">
              <GovLayout><NotificationsPage /></GovLayout>
            </ProtectedRoute>
          } />

          {/* ── Protected admin/municipality dashboard ── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRouteAdmin>
              <GovLayout><AdminDashboard /></GovLayout>
            </ProtectedRouteAdmin>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
