// src/components/Navbar.jsx
// ---------------------------------------------------------
// Top navigation bar for AQRO portal.
// Auth-aware: shows login button when logged out, profile
// avatar + role badge + sign-out when logged in.
// Uses AuthContext so no extra listener is needed here.
// ---------------------------------------------------------

import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut, auth } from '../localDb'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
    { to: '/', label: 'Report' },
    { to: '/dashboard', label: 'Dashboard' },
]

// Map Firestore role values to display labels
const ROLE_LABELS = {
    citizen:      'Citizen',
    municipality: 'Municipality Officer',
    admin:        'Admin',
}

// Colour pairs [background, text] for role pill
const ROLE_COLORS = {
    citizen:      ['#E8F0FE', '#1A56C4'],
    municipality: ['#E6F4EA', '#1A7340'],
    admin:        ['#FEF3C7', '#92400E'],
}

function AvatarCircle({ displayName }) {
    const initials = (displayName ?? '?')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    return (
        <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#104080] text-white text-xs font-bold select-none shrink-0"
        >
            {initials}
        </span>
    )
}

function RolePill({ role }) {
    const label = ROLE_LABELS[role] ?? role ?? 'User'
    const [bg, fg] = ROLE_COLORS[role] ?? ['#F0F0F0', '#333']
    return (
        <span
            className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide"
            style={{ backgroundColor: bg, color: fg }}
        >
            {label}
        </span>
    )
}

export default function Navbar() {
    const { user, userDoc, loading } = useAuth()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const isHome = pathname === '/'

    async function handleSignOut() {
        try {
            await signOut(auth)
            navigate('/', { replace: true })
        } catch (err) {
            console.error('Sign-out error:', err)
        }
    }

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-[#D1D9E6]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

                {/* Brand */}
                <span className="flex items-center gap-2 select-none">
                    <span className="font-bold text-lg text-[#104080] tracking-tight">
                        Aqro
                    </span>
                </span>

                {/* Nav links */}
                <nav className="flex gap-1">
                    {NAV_ITEMS.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold transition-colors duration-200',
                                    isActive
                                        ? 'bg-[#104080] text-white'
                                        : 'text-[#5A6E8A] hover:text-[#104080] hover:bg-[#f4f6f9]',
                                ].join(' ')
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Auth section — hidden while resolving to prevent flicker */}
                <div
                    className="flex items-center gap-3 transition-opacity duration-200"
                    style={{ opacity: loading ? 0 : 1, pointerEvents: loading ? 'none' : 'auto' }}
                >
                    {user ? (
                        <>
                            <AvatarCircle displayName={user.displayName ?? userDoc?.name} />
                            <span className="hidden sm:block text-sm font-medium text-[#1E3A5F] max-w-[140px] truncate">
                                {user.displayName ?? userDoc?.name ?? user.email}
                            </span>
                            <RolePill role={userDoc?.role} />
                            <button
                                onClick={handleSignOut}
                                className="ml-1 px-3 py-1.5 rounded text-xs font-semibold border border-[#104080] text-[#104080] hover:bg-[#104080] hover:text-white transition-colors duration-200"
                            >
                                Sign Out
                            </button>
                        </>
                    ) : isHome ? (
                        <NavLink
                            to="/login"
                            className="px-4 py-1.5 rounded text-sm font-semibold bg-[#104080] text-white hover:bg-[#0d3366] transition-colors duration-200"
                        >
                            Login
                        </NavLink>
                    ) : null}
                </div>

            </div>
        </header>
    )
}
