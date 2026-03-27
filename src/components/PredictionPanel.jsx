// src/components/PredictionPanel.jsx
// Displays tomorrow's garbage risk forecast from predictGarbage Cloud Function.
// Props:
//   prediction — full predictGarbage response object
//   loading, error, onRetry

import { HiInboxArrowDown } from 'react-icons/hi2'

function riskBadge(level) {
    const map = {
        critical: 'bg-red-100 text-red-800 border border-red-200',
        high: 'bg-orange-100 text-orange-800 border border-orange-200',
        medium: 'bg-amber-100 text-amber-800 border border-amber-200',
        low: 'bg-green-100 text-green-800 border border-green-200',
    }
    return map[String(level ?? 'medium').toLowerCase()] ?? 'bg-gray-100 text-gray-700 border border-gray-200'
}

function RiskZoneCard({ z, rank }) {
    const name = z.zone_name ?? `Zone ${rank}`
    const risk = z.risk_level ?? 'medium'
    const waste = z.predicted_waste_type ?? '—'
    const factors = Array.isArray(z.contributing_factors) ? z.contributing_factors : []
    const dotColor = risk === 'critical' ? '#dc2626' : risk === 'high' ? '#ea580c' : 'var(--color-gov-600)'

    return (
        <div className="gov-card p-4 flex gap-3 items-start">
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                style={{ background: dotColor }}
            >
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Expected: {waste}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${riskBadge(risk)}`}>
                        {risk}
                    </span>
                    {factors.slice(0, 2).map((f, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{f}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function PredictionPanel({ prediction = null, loading = false, error = null, onRetry }) {
    const prob = prediction?.risk_probability ?? null

    const probColorClass =
        prob === null ? 'text-gray-500'
            : prob >= 0.7 ? 'text-red-600'
                : prob >= 0.4 ? 'text-amber-600'
                    : 'text-emerald-600'

    const probBgClass =
        prob === null ? 'bg-gray-50 border-gray-200'
            : prob >= 0.7 ? 'bg-red-50 border-red-200'
                : prob >= 0.4 ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'

    return (
        <div className="gov-card overflow-hidden">
            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <span>🔮 Tomorrow&#39;s Risk Forecast</span>
                <span className="text-xs font-normal opacity-80">AI Prediction</span>
            </div>

            <div className="p-4 space-y-3">
                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-3 animate-pulse">
                        <div className="rounded-lg p-4 bg-gray-50 border border-gray-100 text-center space-y-2">
                            <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto" />
                            <div className="h-10 bg-gray-200 rounded w-20 mx-auto" />
                        </div>
                        <div className="gov-card p-4 flex gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div></div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="gov-alert-error">
                        <strong>Error:</strong> {error}
                        {onRetry && (
                            <button onClick={onRetry} className="ml-3 underline text-xs font-semibold">Retry</button>
                        )}
                    </div>
                )}

                {/* Empty / no data */}
                {!loading && !error && !prediction && (
                    <div className="flex flex-col items-center py-8 gap-2 text-center">
                        <HiInboxArrowDown className="w-10 h-10 text-[var(--color-muted)]" aria-hidden="true" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>No prediction data</p>
                    </div>
                )}

                {/* Prediction content */}
                {!loading && prediction && (
                    <>
                        {/* Risk probability badge */}
                        <div className={`rounded-lg p-4 border text-center ${probBgClass}`}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-muted)' }}>
                                Citywide Risk Probability
                            </p>
                            <p className={`text-4xl font-black ${probColorClass}`}>
                                {Math.round(prob * 100)}%
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                                {prediction.context?.weather_condition ?? ''}
                                {prediction.context?.is_festival_day && ` · 🎉 ${prediction.context.festival_name}`}
                            </p>
                        </div>

                        {/* Risk zones */}
                        {(prediction.predicted_risk_zones ?? []).map((z, i) => (
                            <RiskZoneCard key={i} z={z} rank={i + 1} />
                        ))}

                        {/* Reasoning */}
                        {prediction.reasoning && (
                            <div
                                className="rounded-lg p-3 text-xs leading-relaxed"
                                style={{ background: 'var(--color-gov-50)', color: 'var(--color-text-soft)' }}
                            >
                                <strong className="block mb-1" style={{ color: 'var(--color-gov-800)' }}>Analysis</strong>
                                {prediction.reasoning}
                            </div>
                        )}

                        {/* Preventive action plan */}
                        {prediction.preventive_action_plan && (
                            <div
                                className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-line"
                                style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#92400e' }}
                            >
                                <strong className="block mb-1">Preventive Action Plan</strong>
                                {prediction.preventive_action_plan}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
