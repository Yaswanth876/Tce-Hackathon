// src/components/DashboardStats.jsx
// Display row: Ward Cleanliness Score + 3 mini-stat cards.

import { HiMapPin, HiExclamationTriangle, HiChartBar } from 'react-icons/hi2'

function scoreColor(score) {
    if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300' }
    if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300' }
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' }
}

function ScoreCard({ score, rating, loading }) {
    const c = scoreColor(score)
    return (
        <div className={`gov-card p-5 flex flex-col items-center justify-center gap-1 border-t-4 ${c.border}`}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                Ward Cleanliness Score
            </p>
            {loading
                ? <div className="w-20 h-12 rounded animate-pulse bg-gray-100 my-1" />
                : <p className={`text-6xl font-black leading-none ${c.text}`}>{score}</p>
            }
            <span className={`mt-1 text-xs font-bold px-3 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                {loading ? '…' : rating}
            </span>
        </div>
    )
}

function MiniStat({ label, value, icon, accent = 'var(--color-gov-700)', loading }) {
    return (
        <div className="stat-card flex items-center gap-3" style={{ borderTopColor: accent }}>
            <div className="text-2xl" style={{ color: accent }}>
                {icon}
            </div>
            <div>
                {loading
                    ? <div className="w-10 h-6 rounded animate-pulse bg-gray-100 mb-1" />
                    : <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
                }
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{label}</p>
            </div>
        </div>
    )
}

export default function DashboardStats({
    score = 0,
    rating = '—',
    hotspotCount = 0,
    criticalCount = 0,
    riskProbability = null,
    loadingScore = false,
    loadingHotspots = false,
    loadingPrediction = false,
}) {
    const riskDisplay = riskProbability != null
        ? `${Math.round(riskProbability * 100)}%`
        : '—'

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ScoreCard score={score} rating={rating} loading={loadingScore} />
            <MiniStat
                label="Active Hotspots"
                value={hotspotCount}
                icon={<HiMapPin className="w-6 h-6" />}
                accent="#D97706"
                loading={loadingHotspots}
            />
            <MiniStat
                label="Critical Zones"
                value={criticalCount}
                icon={<HiExclamationTriangle className="w-6 h-6" />}
                accent="#DC2626"
                loading={loadingHotspots}
            />
            <MiniStat
                label="Tomorrow's Risk"
                value={riskDisplay}
                icon={<HiChartBar className="w-6 h-6" />}
                accent="#104080"
                loading={loadingPrediction}
            />
        </div>
    )
}
