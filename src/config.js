// src/config.js
// ---------------------------------------------------------------
// Central environment configuration for Aqro .
// All env variables are read ONCE here and exported as constants.
// Components import from here — never from import.meta.env directly.
// ---------------------------------------------------------------

// ── API Configuration (MongoDB Backend) ─────────────────────────
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.trim() ?? 'http://localhost:5000/api'

export const API_CONFIGURED =
    !!API_BASE_URL &&
    (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://'))

// ── Maps API Key (Optional) ────────────────────────────────────
export const MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''

export const MAPS_CONFIGURED =
    !!MAPS_API_KEY &&
    MAPS_API_KEY.length > 10 &&
    !MAPS_API_KEY.startsWith('YOUR_')

// ── Console warnings at module load time ──────────────────────
if (!API_CONFIGURED) {
    console.warn(
        '[Aqro] ⚠️  API_BASE_URL not properly configured.\n' +
        '           Using default: http://localhost:5000/api\n' +
        '           Ensure Express backend is running on port 5000 or set VITE_API_BASE_URL in .env'
    )
}

if (!MAPS_CONFIGURED) {
    console.info(
        '[Aqro] ℹ️  VITE_GOOGLE_MAPS_API_KEY not configured.\n' +
        '           Mapping features will be disabled.'
    )
}

// ── Fixed constants ────────────────────────────────────────────
export const NUM_WORKERS = 25
export const NUM_TRUCKS = 8
export const FUNCTIONS_BASE = API_BASE_URL // For backward compatibility
export const FUNCTIONS_CONFIGURED = API_CONFIGURED
