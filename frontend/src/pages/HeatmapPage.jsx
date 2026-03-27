// src/pages/HeatmapPage.jsx
// ---------------------------------------------------------------
// Live Sanitation Monitoring Map — Madurai Municipal Corporation
// Real-time heatmap with filters and summary statistics
// ---------------------------------------------------------------

import { useEffect, useRef, useState, useCallback } from 'react'
import { HiMap, HiMapPin, HiChartBar, HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2'
import { collection, onSnapshot, query, db } from '../localDb'
import { MAPS_API_KEY, MAPS_CONFIGURED } from '../config'

const MADURAI_CENTER = { lat: 9.9252, lng: 78.1198 }
const DEFAULT_ZOOM = 13
const REPORTS_COLLECTION = 'reports'
const MAPS_SCRIPT_ID = 'google-maps-script'

// ── Simulated waste hotspot data for Madurai localities ───────
// weight scale: 1–3 = low, 4–6 = medium, 7–8 = high, 9–10 = critical
function scatterAround(lat, lng, count, radiusDeg, weight) {
  return Array.from({ length: count }, () => ({
    lat: lat + (Math.random() - 0.5) * 2 * radiusDeg,
    lng: lng + (Math.random() - 0.5) * 2 * radiusDeg,
    severity: weight + (Math.random() - 0.5) * 0.6,
    status: 'pending',
    ward: 'ward-1',
    waste_type: ['plastic', 'organic', 'mixed'][Math.floor(Math.random() * 3)],
    timestamp: null,
    id: `sim-${lat}-${lng}-${Math.random()}`,
    simulated: true,
  }))
}

const SIMULATED_HOTSPOTS = [
  // ── CRITICAL (weight 9–10) ────────────────────────────────
  ...scatterAround(9.9202, 78.1195, 40, 0.004, 9.5),  // Mattuthavani Bus Stand
  ...scatterAround(9.9081, 78.1134, 35, 0.004, 9.2),  // Arapalayam Junction
  ...scatterAround(9.9340, 78.1248, 30, 0.003, 9.7),  // Goripalayam Market
  ...scatterAround(9.9450, 78.1080, 28, 0.003, 9.0),  // Aruppukottai Road Dump
  ...scatterAround(9.9170, 78.1380, 32, 0.003, 9.4),  // Ellis Nagar Open Ground

  // ── HIGH (weight 7–8) ────────────────────────────────────
  ...scatterAround(9.9580, 78.1120, 25, 0.004, 7.8),  // Tallakulam
  ...scatterAround(9.8940, 78.1230, 22, 0.004, 7.5),  // Teppakulam Area
  ...scatterAround(9.9300, 78.1650, 20, 0.004, 8.1),  // Nagamalai Pudukottai
  ...scatterAround(9.9100, 78.1050, 24, 0.003, 7.9),  // Simmakkal
  ...scatterAround(9.9490, 78.1300, 18, 0.003, 7.4),  // Anna Nagar
  ...scatterAround(9.9230, 78.0820, 20, 0.003, 7.6),  // Thirunagar
  ...scatterAround(9.9620, 78.1400, 16, 0.004, 7.2),  // Kochadai Road

  // ── MEDIUM (weight 4–6) ──────────────────────────────────
  ...scatterAround(9.9380, 78.1100, 15, 0.004, 5.5),  // KK Nagar
  ...scatterAround(9.9050, 78.1400, 14, 0.004, 5.0),  // Villapuram
  ...scatterAround(9.9700, 78.1200, 12, 0.004, 5.8),  // Koodal Nagar
  ...scatterAround(9.9410, 78.0900, 13, 0.003, 4.8),  // Sellur
  ...scatterAround(9.9120, 78.1620, 12, 0.003, 5.2),  // Uthangudi
  ...scatterAround(9.8870, 78.1050, 11, 0.004, 4.5),  // Madurai South
  ...scatterAround(9.9660, 78.0980, 10, 0.003, 5.6),  // Palanganatham

  // ── LOW (weight 1–3) ────────────────────────────────────
  ...scatterAround(9.9800, 78.1350, 8,  0.004, 2.5),  // Iyer Bungalow
  ...scatterAround(9.9550, 78.0750, 7,  0.004, 2.0),  // Vandiyur
  ...scatterAround(9.9150, 78.1800, 8,  0.004, 2.8),  // Alagarkoil Road
  ...scatterAround(9.8800, 78.1300, 6,  0.003, 1.8),  // Madurai Airport Zone
  ...scatterAround(9.9750, 78.1600, 7,  0.003, 3.0),  // Alwarpet Area
  ...scatterAround(9.9010, 78.0900, 6,  0.003, 2.2),  // Tirunelveli Road
]

// Center coordinates and zoom for each ward
const WARD_VIEWS = {
    'all':    { center: MADURAI_CENTER,              zoom: DEFAULT_ZOOM },
    'ward-1': { center: { lat: 9.9252, lng: 78.1198 }, zoom: 15 },
    'ward-2': { center: { lat: 9.9580, lng: 78.1120 }, zoom: 15 },
    'ward-3': { center: { lat: 9.8940, lng: 78.1230 }, zoom: 15 },
    'ward-4': { center: { lat: 9.9300, lng: 78.1650 }, zoom: 15 },
    'ward-5': { center: { lat: 9.9200, lng: 78.0750 }, zoom: 15 },
}

const WARDS = [
    { value: 'all', label: 'All Wards' },
    { value: 'ward-1', label: 'Ward 1 - Central' },
    { value: 'ward-2', label: 'Ward 2 - North' },
    { value: 'ward-3', label: 'Ward 3 - South' },
    { value: 'ward-4', label: 'Ward 4 - East' },
    { value: 'ward-5', label: 'Ward 5 - West' },
]

const WASTE_TYPES = [
    { value: 'all', label: 'All Types' },
    { value: 'plastic', label: 'Plastic Waste' },
    { value: 'organic', label: 'Organic Waste' },
    { value: 'mixed', label: 'Mixed Waste' },
    { value: 'construction', label: 'Construction Debris' },
    { value: 'other', label: 'Other' },
]

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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`
        script.async = true
        script.defer = true
        script.onload = resolve
        script.onerror = () => reject(new Error('Failed to load Google Maps API'))
        document.head.appendChild(script)
    })
}

function FilterSelect({ label, value, onChange, options }) {
    return (
        <div className="flex-1 min-w-[200px]">
            <label className="field-label">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="field-input"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

function SummaryCard({ icon, label, value, color = 'var(--color-gov-700)' }) {
    return (
        <div className="gov-card p-4 flex items-center gap-3">
            <div
                className="w-12 h-12 rounded flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${color}15` }}
            >
                {icon}
            </div>
            <div>
                <p className="text-sm text-[var(--color-muted)] font-medium mb-1">{label}</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
            </div>
        </div>
    )
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: color }} />
            <span className="text-sm text-[var(--color-text-soft)]">{label}</span>
        </div>
    )
}

export default function HeatmapPage() {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const heatmapRef = useRef(null)

    const [mapsReady, setMapsReady] = useState(false)
    const [mapsError, setMapsError] = useState(null)
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [firestoreError, setFirestoreError] = useState(null)

    const [selectedWard, setSelectedWard] = useState('all')
    const [selectedWasteType, setSelectedWasteType] = useState('all')
    const [dateRange, setDateRange] = useState('7')

    useEffect(() => {
        if (!MAPS_CONFIGURED) {
            setMapsError('Google Maps API key not configured. Set VITE_GOOGLE_MAPS_API_KEY in .env')
            setLoading(false)
            return
        }

        loadMapsScript(MAPS_API_KEY)
            .then(() => setMapsReady(true))
            .catch((err) => {
                console.error('[HeatmapPage] Maps script error:', err)
                setMapsError(err.message)
            })
    }, [])

    useEffect(() => {
        if (!mapsReady || !mapContainerRef.current) return

        mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: MADURAI_CENTER,
            zoom: DEFAULT_ZOOM,
            mapTypeId: 'roadmap',
            styles: [
                { elementType: 'geometry', stylers: [{ saturation: -20 }] },
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            ],
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        })

        heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
            data: [],
            map: mapRef.current,
            radius: 40,
            opacity: 0.82,
            maxIntensity: 10,
            gradient: [
                'rgba(0,0,0,0)',           // transparent at zero
                'rgba(34,197,94,0)',       // transparent — no bleed
                'rgba(34,197,94,1)',       // green  — Low
                'rgba(234,179,8,1)',       // yellow — Medium
                'rgba(249,115,22,1)',      // orange — High
                'rgba(220,38,38,1)',       // red    — Critical
                'rgba(139,0,0,1)',         // dark-red — extreme critical core
            ],
        })

        // Seed heatmap immediately with simulated data so it's visible on load
        const seedPoints = SIMULATED_HOTSPOTS.map(p => ({
            location: new window.google.maps.LatLng(p.lat, p.lng),
            weight: p.severity,
        }))
        heatmapRef.current.setData(seedPoints)
    }, [mapsReady])

    const refreshHeatmap = useCallback((docs) => {
        if (!heatmapRef.current || !window.google?.maps) return

        // Real Firestore complaint points
        const realPoints = docs
            .filter((r) => r.lat != null && r.lng != null)
            .map((r) => ({
                location: new window.google.maps.LatLng(r.lat, r.lng),
                weight: Math.min(10, Math.max(1, r.severity ?? 1)),
            }))

        // Simulated hotspot points always shown
        const simPoints = SIMULATED_HOTSPOTS.map(p => ({
            location: new window.google.maps.LatLng(p.lat, p.lng),
            weight: p.severity,
        }))

        heatmapRef.current.setData([...simPoints, ...realPoints])
    }, [])

    useEffect(() => {
        refreshHeatmap(reports)
    }, [reports, refreshHeatmap])

    // Pan/zoom map when ward filter changes
    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) return
        const view = WARD_VIEWS[selectedWard] ?? WARD_VIEWS['all']
        mapRef.current.panTo(view.center)
        mapRef.current.setZoom(view.zoom)
    }, [selectedWard, mapsReady])

    useEffect(() => {
        setLoading(true)

        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange))

        let q = query(
            collection(db, REPORTS_COLLECTION)
        )

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const docs = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    const lat = data.latitude ?? data.metadata?.latitude ?? data.location?.latitude ?? null
                    const lng = data.longitude ?? data.metadata?.longitude ?? data.location?.longitude ?? null

                    return {
                        id: doc.id,
                        lat: lat != null ? parseFloat(lat) : null,
                        lng: lng != null ? parseFloat(lng) : null,
                        severity: data.ai_analysis?.severity_score ?? 1,
                        waste_type: (data.ai_analysis?.waste_type ?? 'other').toLowerCase(),
                        status: data.status ?? 'pending',
                        ward: data.ward ?? 'ward-1',
                        timestamp: data.metadata?.processed_at ?? data.created_at ?? null,
                    }
                })

                let filtered = docs

                if (selectedWard !== 'all') {
                    filtered = filtered.filter(r => r.ward === selectedWard)
                }

                if (selectedWasteType !== 'all') {
                    filtered = filtered.filter(r => r.waste_type.includes(selectedWasteType))
                }

                filtered = filtered.filter(r => {
                    if (!r.timestamp) return false
                    const date = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp)
                    return date >= cutoffDate
                })

                setReports(filtered)
                setLoading(false)
            },
            (err) => {
                console.error('[HeatmapPage] Firestore error:', err)
                setFirestoreError(err.message)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [selectedWard, selectedWasteType, dateRange])

    // Merge simulated + real data for stats
    const allPoints = [...SIMULATED_HOTSPOTS, ...reports]
    const activeComplaints = reports.filter(r => r.status === 'pending' || r.status === 'analyzing' || r.status === 'dispatched').length
    const clearedComplaints = reports.filter(r => r.status === 'cleared' || r.status === 'resolved').length
    const hotspotClusters = allPoints.filter(r => (r.severity ?? 0) >= 7).length
    const criticalZones  = allPoints.filter(r => (r.severity ?? 0) >= 9).length

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            
            {/* 1️⃣ Page Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-[var(--color-gov-800)] mb-2">
                    Live Sanitation Monitoring Map
                </h1>
                <p className="text-base text-[var(--color-gov-700)] font-semibold">
                    Madurai Municipal Corporation
                </p>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                    Real-time waste complaint tracking and hotspot visualization
                </p>
            </div>

            {/* 2️⃣ Filters Section */}
            <div className="gov-card p-4">
                <h2 className="text-sm font-bold text-[var(--color-gov-800)] uppercase tracking-wide mb-3">
                    Filters
                </h2>
                <div className="flex flex-wrap gap-4">
                    <FilterSelect
                        label="Ward"
                        value={selectedWard}
                        onChange={setSelectedWard}
                        options={WARDS}
                    />
                    <FilterSelect
                        label="Waste Type"
                        value={selectedWasteType}
                        onChange={setSelectedWasteType}
                        options={WASTE_TYPES}
                    />
                    <div className="flex-1 min-w-[200px]">
                        <label className="field-label">Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="field-input"
                        >
                            <option value="1">Last 24 Hours</option>
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Layout Grid for Map and Panels */}
            <div className="grid lg:grid-cols-4 gap-6">
                
                {/* 3️⃣ Main Map Section */}
                <div className="lg:col-span-3">
                    {mapsError && (
                        <div className="gov-alert-error mb-4" role="alert">
                            <strong>Maps Error:</strong> {mapsError}
                        </div>
                    )}
                    {firestoreError && (
                        <div className="gov-alert-error mb-4" role="alert">
                            <strong>Data Error:</strong> {firestoreError}
                        </div>
                    )}

                    <div className="gov-card overflow-hidden relative" style={{ height: '600px' }}>
                        {MAPS_CONFIGURED && (
                            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                        )}

                        {(loading || !mapsReady) && !mapsError && (
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                                style={{ background: 'rgba(255,255,255,0.95)' }}
                            >
                                <div
                                    className="w-10 h-10 rounded-full border-4 animate-spin"
                                    style={{ borderColor: 'var(--color-gov-100)', borderTopColor: 'var(--color-gov-700)' }}
                                />
                                <p className="text-sm font-medium text-[var(--color-muted)]">
                                    {!mapsReady ? 'Loading map...' : 'Loading reports...'}
                                </p>
                            </div>
                        )}

                        {!MAPS_CONFIGURED && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-[var(--color-gov-50)] flex items-center justify-center">
                                    <HiMap className="w-12 h-12 text-[var(--color-gov-700)]" />
                                </div>
                                <p className="text-base font-bold text-[var(--color-gov-800)]">
                                    Google Maps Not Configured
                                </p>
                                <p className="text-sm text-[var(--color-muted)]">
                                    Add <code className="bg-gray-100 px-1.5 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file
                                </p>
                            </div>
                        )}


                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* 4️⃣ Map Legend Panel */}
                    <div className="gov-card p-4">
                        <h2 className="text-sm font-bold text-[var(--color-gov-800)] uppercase tracking-wide mb-3">
                            Severity Legend
                        </h2>

                        {/* Gradient bar */}
                        <div
                            className="h-3 rounded-full mb-3 w-full"
                            style={{ background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #dc2626, #7f0000)' }}
                            aria-hidden="true"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mb-4 px-0.5">
                            <span>Low</span><span>Critical</span>
                        </div>

                        <div className="space-y-2.5">
                            <LegendItem color="#22c55e" label="Low Severity" />
                            <LegendItem color="#eab308" label="Medium Severity" />
                            <LegendItem color="#f97316" label="High Severity" />
                            <LegendItem color="#dc2626" label="Critical" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                                Heat intensity indicates concentration and severity of waste complaints
                            </p>
                        </div>

                        {/* Known hotspot callouts */}
                        <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
                            <p className="text-xs font-bold text-[var(--color-gov-800)] uppercase tracking-wide mb-2">Critical Zones</p>
                            {[
                                'Mattuthavani Bus Stand',
                                'Arapalayam Junction',
                                'Goripalayam Market',
                                'Ellis Nagar Ground',
                                'Aruppukottai Rd Dump',
                            ].map(zone => (
                                <div key={zone} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                                    <span className="text-xs text-slate-600">{zone}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5️⃣ Summary Panel */}
                    <div className="gov-card p-4">
                        <h2 className="text-sm font-bold text-[var(--color-gov-800)] uppercase tracking-wide mb-3">
                            Summary
                        </h2>
                        <div className="space-y-3">
                            <div className="border-b border-[var(--color-border)] pb-3">
                                <p className="text-xs text-[var(--color-muted)] mb-1">Active Complaints</p>
                                <p className="text-3xl font-bold text-[var(--color-gov-700)]">{activeComplaints}</p>
                            </div>
                            <div className="border-b border-[var(--color-border)] pb-3">
                                <p className="text-xs text-[var(--color-muted)] mb-1">Cleared Complaints</p>
                                <p className="text-3xl font-bold text-green-600">{clearedComplaints}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--color-muted)] mb-1">Hotspot Clusters</p>
                                <p className="text-3xl font-bold text-[var(--color-alert-red)]">{hotspotClusters}</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Indicator */}
                    <div className="gov-card p-3 flex items-center gap-2 justify-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                            Live Updates Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    icon={<HiChartBar className="w-6 h-6" />}
                    label="Total Reports"
                    value={reports.length}
                    color="var(--color-gov-700)"
                />
                <SummaryCard
                    icon={<HiCheckCircle className="w-6 h-6" />}
                    label="Clearance Rate"
                    value={reports.length > 0 ? `${Math.round((clearedComplaints / reports.length) * 100)}%` : '0%'}
                    color="#16a34a"
                />
                <SummaryCard
                    icon={<HiExclamationTriangle className="w-6 h-6" />}
                    label="Critical Zones"
                    value={criticalZones}
                    color="#dc2626"
                />
            </div>
        </div>
    )
}
