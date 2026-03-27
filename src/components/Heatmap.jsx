// src/components/Heatmap.jsx
// ---------------------------------------------------------------
// Waste-report heatmap for the Officer Dashboard.
//
// Flow:
//   1. Load Google Maps JS API (+ visualization library) dynamically.
//   2. Open a Firestore real-time listener on the "reports" collection.
//   3. Extract lat/lng from each document and build a HeatmapLayer.
//   4. Re-render the layer whenever Firestore reports a change.
//   5. Show stat cards: Reports Today, Total Reports, Critical Zones.
// ---------------------------------------------------------------

import { useEffect, useRef, useState, useCallback } from 'react'
// MIGRATED: Use complaintService instead
// import { db } from '../firebase'
// import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { getComplaints } from '../api/complaintService'
import { MAPS_API_KEY, MAPS_CONFIGURED } from '../config'
import { HiClipboardDocument, HiSquares2X2, HiExclamationTriangle, HiMapPin } from 'react-icons/hi2'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MADURAI_CENTER = { lat: 9.9252, lng: 78.1198 }
const DEFAULT_ZOOM = 13
const REPORTS_COLLECTION = 'reports'
const MAPS_SCRIPT_ID = 'google-maps-script'

// ---------------------------------------------------------------------------
// Utility: Dynamically load the Maps JS API (idempotent)
// ---------------------------------------------------------------------------
function loadMapsScript(apiKey) {
    return new Promise((resolve, reject) => {
        if (window.google?.maps) { resolve(); return }

        if (document.getElementById(MAPS_SCRIPT_ID)) {
            const existing = document.getElementById(MAPS_SCRIPT_ID)
            existing.addEventListener('load', resolve)
            existing.addEventListener('error', () => reject(new Error('Google Maps script failed to load')))
            return
        }

        const script = document.createElement('script')
        script.id = MAPS_SCRIPT_ID
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
        script.async = true
        script.defer = true
        script.onload = resolve
        script.onerror = () => reject(new Error('Failed to load Google Maps API. Check your API key and billing.'))
        document.head.appendChild(script)
    })
}

// ---------------------------------------------------------------------------
// Utility: Is a Firestore timestamp from today?
// ---------------------------------------------------------------------------
function isToday(ts) {
    if (!ts) return false
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    const now = new Date()
    return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatCard({ label, value, accent = 'var(--color-gov-700)', icon }) {
    return (
        <div className="stat-card flex items-center gap-4" style={{ borderTopColor: accent }}>
            {icon && (
                <span
                    className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full"
                    style={{ background: `${accent}18` }}
                    aria-hidden="true"
                >
                    {icon}
                </span>
            )}
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                    {label}
                </p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
                    {value}
                </p>
            </div>
        </div>
    )
}

function LiveBadge() {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#dcfce7', color: '#166534' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
        </span>
    )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function Heatmap() {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const heatmapRef = useRef(null)

    const [mapsReady, setMapsReady] = useState(false)
    const [mapsError, setMapsError] = useState(null)
    const [reports, setReports] = useState([])
    const [firestoreError, setFirestoreError] = useState(null)
    const [loading, setLoading] = useState(true)

    // ------------------------------------------------------------------
    // Step 1 — Validate API key then load Maps script
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!MAPS_CONFIGURED) {
            setMapsError('Google Maps API key is not configured. Set VITE_GOOGLE_MAPS_API_KEY in .env')
            setLoading(false)
            return
        }

        loadMapsScript(MAPS_API_KEY)
            .then(() => setMapsReady(true))
            .catch((err) => {
                console.error('[Heatmap] Maps script load error:', err)
                setMapsError(err.message)
            })
    }, [])

    // ------------------------------------------------------------------
    // Step 2 — Initialise Map once API is ready
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!mapsReady || !mapContainerRef.current) return

        mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: MADURAI_CENTER,
            zoom: DEFAULT_ZOOM,
            mapTypeId: 'roadmap',
            styles: [
                { elementType: 'geometry', stylers: [{ saturation: -30 }] },
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            ],
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        })

        // heatmapRef stores active Circle overlays (HeatmapLayer is deprecated since May 2025)
        heatmapRef.current = []
    }, [mapsReady])

    // ------------------------------------------------------------------
    // Step 3 — Render circles whenever reports change
    // ------------------------------------------------------------------
    const refreshHeatmap = useCallback((docs) => {
        if (!mapRef.current || !window.google?.maps) return

        // Clear previous circles
        if (Array.isArray(heatmapRef.current)) {
            heatmapRef.current.forEach((c) => c.setMap(null))
        }
        heatmapRef.current = []

        const validDocs = docs.filter((r) => r.lat != null && r.lng != null)

        // Color based on severity score (0–10)
        function severityColor(sev) {
            const s = parseFloat(sev ?? 0)
            if (s >= 8) return { fill: '#7f0000', stroke: '#dc2626' }
            if (s >= 6) return { fill: '#dc2626', stroke: '#ef4444' }
            if (s >= 4) return { fill: '#f97316', stroke: '#fb923c' }
            if (s >= 2) return { fill: '#eab308', stroke: '#facc15' }
            return     { fill: '#22c55e', stroke: '#4ade80' }
        }

        validDocs.forEach((r) => {
            const { fill, stroke } = severityColor(r.severity)
            const circle = new window.google.maps.Circle({
                center: { lat: r.lat, lng: r.lng },
                radius: 180 + (parseFloat(r.severity ?? 0) * 30), // 180–480m
                fillColor: fill,
                fillOpacity: 0.45,
                strokeColor: stroke,
                strokeOpacity: 0.9,
                strokeWeight: 1.5,
                map: mapRef.current,
            })
            heatmapRef.current.push(circle)
        })
    }, [])

    useEffect(() => {
        refreshHeatmap(reports)
    }, [reports, refreshHeatmap, mapsReady])

    // ------------------------------------------------------------------
    // Step 4 — Firestore real-time listener (auto-updates)
    // ------------------------------------------------------------------
    useEffect(() => {
        setLoading(true)

        let unsubscribe = () => { }

        try {
            const q = query(
                collection(db, REPORTS_COLLECTION),
                orderBy('metadata.processed_at', 'desc'),
            )

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const docs = snapshot.docs.map((doc) => {
                        const data = doc.data()
                        const lat =
                            data.latitude ??
                            data.metadata?.latitude ??
                            data.location?.latitude ?? null
                        const lng =
                            data.longitude ??
                            data.metadata?.longitude ??
                            data.location?.longitude ?? null

                        return {
                            id: doc.id,
                            lat: lat != null ? parseFloat(lat) : null,
                            lng: lng != null ? parseFloat(lng) : null,
                            severity: data.ai_analysis?.severity_score ?? null,
                            urgency: data.ai_analysis?.urgency_level ?? 'Unknown',
                            waste_type: data.ai_analysis?.waste_type ?? 'Unknown',
                            status: data.status ?? 'pending',
                            timestamp: data.metadata?.processed_at ?? data.created_at ?? data.timestamp ?? null,
                        }
                    })
                    setReports(docs)
                    setLoading(false)
                },
                (err) => {
                    console.error('[Heatmap] Firestore error:', err)
                    // Friendly message for the common "index missing" case
                    const isIndexError = err.code === 'failed-precondition' || err.message?.includes('index')
                    setFirestoreError(
                        isIndexError
                            ? 'A Firestore composite index is required. Open the browser console for a direct link to create it.'
                            : err.message,
                    )
                    setLoading(false)
                },
            )
        } catch (err) {
            console.error('[Heatmap] Query error:', err)
            setFirestoreError(err.message)
            setLoading(false)
        }

        return () => unsubscribe()
    }, [])

    // ------------------------------------------------------------------
    // Derived stats
    // ------------------------------------------------------------------
    const todayReports = reports.filter((r) => isToday(r.timestamp))
    const totalReports = reports.length
    const validPoints = reports.filter((r) => r.lat != null && r.lng != null).length
    const criticalCount = reports.filter(
        (r) => String(r.urgency ?? '').toLowerCase() === 'critical'
    ).length

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <div style={{ fontFamily: 'var(--font-sans)' }}>

            {/* Section header */}
            <div className="section-header flex items-center justify-between">
                <span className="flex items-center gap-2"><HiMapPin className="w-4 h-4" aria-hidden="true" /> Waste Hotspot Heatmap — Madurai</span>
                <LiveBadge />
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[var(--color-surface)]">
                <StatCard label="Reports Today" value={loading ? '—' : todayReports.length} icon={<HiClipboardDocument className="w-5 h-5" />} accent="var(--color-gov-700)" />
                <StatCard label="Total Reports" value={loading ? '—' : totalReports} icon={<HiSquares2X2 className="w-5 h-5" />} accent="#104080" />
                <StatCard label="Critical Zones" value={loading ? '—' : criticalCount} icon={<HiExclamationTriangle className="w-5 h-5" />} accent="#DC2626" />
            </div>

            {/* Map container */}
            <div className="px-4 pb-4">
                <div className="gov-card overflow-hidden relative" style={{ height: '480px', minHeight: '320px' }}>

                    {/* Map canvas — only rendered if Maps API key is available */}
                    {MAPS_CONFIGURED && (
                        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                    )}

                    {/* Loading overlay */}
                    {(loading || !mapsReady) && !mapsError && (
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                            style={{ background: 'rgba(245,247,250,0.92)' }}
                        >
                            <div
                                className="w-8 h-8 rounded-full border-4 animate-spin"
                                style={{ borderColor: 'var(--color-gov-100)', borderTopColor: 'var(--color-gov-700)' }}
                            />
                            <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                                {!mapsReady ? 'Loading maps…' : 'Fetching report data…'}
                            </p>
                        </div>
                    )}



                    {/* Maps key missing notice */}
                    {!MAPS_CONFIGURED && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6"
                            style={{ background: '#f8fafc' }}>
                            <span className="text-4xl">🗺️</span>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-gov-800)' }}>
                                Google Maps not configured
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                Add <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file.
                            </p>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"
                    style={{ color: 'var(--color-muted)' }}>
                    <span className="font-semibold uppercase tracking-wide">Severity:</span>
                    {[
                        { label: 'Low (0–2)', color: '#22c55e' },
                        { label: 'Moderate (2–4)', color: '#eab308' },
                        { label: 'High (4–6)', color: '#f97316' },
                        { label: 'Severe (6–8)', color: '#dc2626' },
                        { label: 'Critical (8–10)', color: '#7f0000' },
                    ].map(({ label, color }) => (
                        <span key={label} className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                            {label}
                        </span>
                    ))}
                    <span className="ml-auto">
                        {validPoints} geo-tagged report{validPoints !== 1 ? 's' : ''} plotted
                    </span>
                </div>
            </div>
        </div>
    )
}
