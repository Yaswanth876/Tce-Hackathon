// src/pages/OfficerDashboard.jsx
// ---------------------------------------------------------------
// Officer Command Dashboard — Aqro  | Madurai Municipal Corporation
//
// All heavy UI is delegated to standalone components:
//   DashboardStats, HotspotList, PredictionPanel,
//   WorkforcePanel, ReportPanel, Heatmap
// ---------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react'

import Heatmap from '../components/Heatmap'
import DashboardStats from '../components/DashboardStats'
import HotspotList from '../components/HotspotList'
import PredictionPanel from '../components/PredictionPanel'
import WorkforcePanel from '../components/WorkforcePanel'
import ReportPanel from '../components/ReportPanel'
import Toast, { useToast } from '../components/Toast'
import {
    FUNCTIONS_BASE,
    FUNCTIONS_CONFIGURED,
    NUM_WORKERS,
    NUM_TRUCKS,
} from '../config'


// ── Shared fetch helper ─────────────────────────────────────────
async function callFn(name, body = {}) {
    if (!FUNCTIONS_CONFIGURED) {
        throw new Error('VITE_FUNCTIONS_BASE_URL not configured — set it in .env to load live data.')
    }
    const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || `${name} failed (HTTP ${res.status})`)
    return json
}

// ── Environment check ───────────────────────────────────────────
function EnvWarning() {
    const missing = !FUNCTIONS_BASE || FUNCTIONS_BASE.includes('YOUR_PROJECT_ID')
    if (!missing) return null
    return (
        <div
            className="rounded-lg px-4 py-3 text-xs flex items-start gap-2 mb-4"
            style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderLeft: '4px solid #f59e0b',
                color: '#92400e',
            }}
            role="alert"
        >
            <span className="text-base flex-shrink-0">⚠️</span>
            <span>
                <strong>VITE_FUNCTIONS_BASE_URL</strong> is not configured.
                Set it in <code className="bg-amber-100 px-1 rounded">.env</code> to enable the dashboard data.
                Format: <code className="bg-amber-100 px-1 rounded">https://asia-south1-PROJECT_ID.cloudfunctions.net</code>
            </span>
        </div>
    )
}

// ── Main page ───────────────────────────────────────────────────
export default function OfficerDashboard() {

    // ── Data ────────────────────────────────────────────────────────
    const [score, setScore] = useState(null)       // { ward_cleanliness_score, rating_category }
    const [hotspots, setHotspots] = useState(null)       // full detectHotspots response
    const [prediction, setPrediction] = useState(null)       // full predictGarbage response
    const [workforce, setWorkforce] = useState(null)       // full allocateWorkforce response

    // ── Loading ──────────────────────────────────────────────────────
    const [loadScore, setLoadScore] = useState(false)
    const [loadHotspots, setLoadHotspots] = useState(false)
    const [loadPrediction, setLoadPrediction] = useState(false)
    const [loadWorkforce, setLoadWorkforce] = useState(false)

    // ── Errors ───────────────────────────────────────────────────────
    const [errScore, setErrScore] = useState(null)
    const [errHotspots, setErrHotspots] = useState(null)
    const [errPrediction, setErrPrediction] = useState(null)
    const [errWorkforce, setErrWorkforce] = useState(null)

    const { toast, showToast, hideToast } = useToast()

    const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata',
    })

    // ── Fetch helpers ────────────────────────────────────────────────

    const fetchHotspots = useCallback(async () => {
        // detectHotspots endpoint not yet deployed — return empty gracefully
        setHotspots({ top_hotspots: [], repeated_dumping_zones: [], pattern_explanation: '', peak_waste_time: '' })
        return null
    }, [])

    const fetchScore = useCallback(async () => {
        // calculateWardScore endpoint not yet deployed — skip silently
        setScore(null)
    }, [])

    const fetchPrediction = useCallback(async (ward = 12) => {
        setLoadPrediction(true); setErrPrediction(null)
        try {
            if (!FUNCTIONS_CONFIGURED) throw new Error('VITE_FUNCTIONS_BASE_URL not configured.')
            const res = await fetch(`${FUNCTIONS_BASE}/predict-risk?ward=${ward}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error || 'predict-risk failed')

            // Map backend response shape to what PredictionPanel expects
            const riskScore = data.risk_score ?? 0
            const riskLevel = data.risk_level ??
                (riskScore >= 0.7 ? 'critical' : riskScore >= 0.4 ? 'high' : riskScore >= 0.2 ? 'medium' : 'low')
            setPrediction({
                risk_probability: riskScore,
                risk_level: riskLevel,
                trend: data.trend ?? '',
                reasoning: data.reason ?? data.reasoning ?? '',
                festival_alert: data.festival_alert ?? null,
                risk_zones: [{
                    zone_name: `Ward ${data.ward ?? ward}`,
                    risk_level: riskLevel,
                    predicted_waste_type: data.dominant_waste_type ?? 'Mixed Waste',
                    contributing_factors: data.key_factors ?? [
                        data.reason ?? 'Based on complaint history',
                    ],
                }],
            })
        } catch (e) {
            setErrPrediction(e.message)
        } finally {
            setLoadPrediction(false)
        }
    }, [])

    const fetchWorkforce = useCallback(async () => {
        // allocateWorkforce endpoint not yet deployed — skip silently
        setWorkforce(null)
    }, [])

    // ── Full refresh (all sections) ──────────────────────────────────
    const refreshAll = useCallback(async () => {
        await Promise.all([
            fetchHotspots(),
            fetchPrediction(),
            fetchScore(),
            fetchWorkforce(),
        ])
    }, [fetchHotspots, fetchPrediction, fetchScore, fetchWorkforce])

    // ── Mount ────────────────────────────────────────────────────────
    useEffect(() => { refreshAll() }, [refreshAll])

    // ── Derived values ───────────────────────────────────────────────
    const cleanScore = score?.ward_cleanliness_score ?? 0
    const ratingCat = score?.rating_category ?? '—'
    const spots = hotspots?.top_hotspots ?? []
    const dumpZones = hotspots?.repeated_dumping_zones ?? []
    const patternExpl = hotspots?.pattern_explanation ?? ''
    const peakTime = hotspots?.peak_waste_time ?? ''

    const criticalCount = spots.filter(
        (h) => String(h.risk_level ?? h.urgency_level ?? '').toLowerCase() === 'critical'
    ).length

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-gov-900)' }}>
                        Officer Command Dashboard
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        Sanitation Intelligence Overview · {today}
                    </p>
                </div>

                <button
                    onClick={async () => {
                        await refreshAll()
                        showToast('Dashboard data refreshed.', 'success')
                    }}
                    disabled={loadHotspots || loadPrediction || loadScore || loadWorkforce}
                    className="btn-gov-outline self-start sm:self-auto flex items-center gap-2 text-sm"
                    id="refresh-dashboard-btn"
                >
                    {(loadHotspots || loadPrediction) ? (
                        <span className="w-4 h-4 rounded-full border-2 animate-spin"
                            style={{ borderColor: 'var(--color-gov-100)', borderTopColor: 'var(--color-gov-700)' }} />
                    ) : '🔄'}
                    Refresh Data
                </button>
            </div>

            {/* ── Env warning ── */}
            <EnvWarning />

            {/* ── SECTION 1: Stats bar ── */}
            <DashboardStats
                score={cleanScore}
                rating={ratingCat}
                hotspotCount={spots.length}
                criticalCount={criticalCount}
                riskProbability={prediction?.risk_probability ?? null}
                loadingScore={loadScore}
                loadingHotspots={loadHotspots}
                loadingPrediction={loadPrediction}
            />

            {/* ── SECTION 2: Heatmap ── */}
            <div className="gov-card overflow-hidden">
                <Heatmap />
            </div>

            {/* ── SECTION 3 + 4: Hotspots & Predictions (2-col) ── */}
            <div className="grid lg:grid-cols-2 gap-6">
                <HotspotList
                    hotspots={spots}
                    dumpingZones={dumpZones}
                    patternExplanation={patternExpl}
                    peakWasteTime={peakTime}
                    loading={loadHotspots}
                    error={errHotspots}
                    onRetry={fetchHotspots}
                />
                <PredictionPanel
                    prediction={prediction}
                    loading={loadPrediction}
                    error={errPrediction}
                    onRetry={fetchPrediction}
                />
            </div>

            {/* ── SECTION 5: Workforce ── */}
            <WorkforcePanel
                workforce={workforce}
                numWorkers={NUM_WORKERS}
                numTrucks={NUM_TRUCKS}
                loading={loadWorkforce}
                error={errWorkforce}
            />

            {/* ── SECTION 6: Score error (if any) ── */}
            {!loadScore && errScore && (
                <div className="gov-alert-error text-sm">
                    <strong>Score Calculation Error:</strong> {errScore}
                </div>
            )}

            {/* ── SECTION 7: Daily Report ── */}
            <ReportPanel
                hotspots={spots}
                cleanlinessScore={cleanScore}
                ratingCategory={ratingCat}
                prediction={prediction}
                functionsBase={FUNCTIONS_BASE}
                onReportGenerated={() => showToast('Daily report generated successfully!', 'success')}
            />

            {/* ── Disclaimer ── */}
            <p className="text-xs text-center pb-2" style={{ color: 'var(--color-muted)' }}>
                This dashboard is for authorised officers only. AI predictions are advisory.
                All decisions must be verified by a field supervisor before action.
            </p>

            {/* ── Toast ── */}
            <Toast {...toast} onClose={hideToast} />

        </div>
    )
}
