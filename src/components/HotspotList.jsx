import { HiMapPin, HiCheckBadge } from 'react-icons/hi2'
// Displays top detected waste hotspots + repeated dumping zones.
// Props:
//   hotspots        — array from detectHotspots.top_hotspots
//   dumpingZones    — array from detectHotspots.repeated_dumping_zones
//   patternExplanation — string from detectHotspots.pattern_explanation
//   peakWasteTime   — string from detectHotspots.peak_waste_time
//   loading, error, onRetry

function urgencyBadge(level) {
    const map = {
        critical: 'bg-red-100 text-red-800 border border-red-200',
        high: 'bg-orange-100 text-orange-800 border border-orange-200',
        medium: 'bg-amber-100 text-amber-800 border border-amber-200',
        low: 'bg-green-100 text-green-800 border border-green-200',
    }
    return map[String(level ?? 'medium').toLowerCase()] ?? 'bg-gray-100 text-gray-700 border border-gray-200'
}

function HotspotCard({ h, rank }) {
    const name = h.location_description ?? h.zone_name ?? h.name ?? `Zone ${rank}`
    const severity = h.avg_severity ?? h.severity_score ?? '—'
    const waste = h.dominant_waste_type ?? h.waste_type ?? 'Unknown'
    const urgency = h.risk_level ?? h.urgency_level ?? 'medium'
    const count = h.report_count ?? '—'

    return (
        <div className="gov-card p-4 flex gap-3 items-start">
            <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                style={{ background: 'var(--color-gov-700)' }}
            >
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{waste}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${urgencyBadge(urgency)}`}>
                        {urgency}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Severity {severity}/10 · {count} reports
                    </span>
                </div>
            </div>
        </div>
    )
}

function DumpingZoneRow({ z, idx }) {
    const name = z.location_description ?? z.zone_name ?? z.name ?? `Zone ${idx + 1}`
    const waste = z.waste_type ?? '—'
    const freq = z.frequency ?? '—'

    return (
        <div
            className="flex items-center gap-3 py-2 border-b last:border-0 text-xs"
            style={{ borderColor: 'var(--color-border)' }}
        >
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold flex-shrink-0">
                {idx + 1}
            </span>
            <span className="flex-1 font-medium truncate" style={{ color: 'var(--color-text)' }}>{name}</span>
            <span style={{ color: 'var(--color-muted)' }}>{waste}</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold">{freq}</span>
        </div>
    )
}

export default function HotspotList({
    hotspots = [],
    dumpingZones = [],
    patternExplanation = '',
    peakWasteTime = '',
    loading = false,
    error = null,
    onRetry,
}) {
    return (
        <div className="gov-card overflow-hidden">
            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <span className="flex items-center gap-2">
                <HiMapPin className="w-4 h-4" aria-hidden="true" /> Active Hotspot Zones
                </span>
                <span className="text-xs font-normal opacity-80">Last 7 days</span>
            </div>

            <div className="p-4 space-y-3">
                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="gov-card p-4 flex gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="gov-alert-error">
                        <strong>Error:</strong> {error}
                        {onRetry && (
                            <button onClick={onRetry} className="ml-3 underline text-xs font-semibold">
                                Retry
                            </button>
                        )}
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && hotspots.length === 0 && (
                    <div className="flex flex-col items-center py-8 gap-2 text-center">
                        <HiCheckBadge className="w-10 h-10 text-green-600" aria-hidden="true" />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>No active hotspots</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No significant waste clusters detected in the last 7 days.</p>
                    </div>
                )}

                {/* Hotspot cards */}
                {!loading && hotspots.map((h, i) => (
                    <HotspotCard key={h.id ?? i} h={h} rank={i + 1} />
                ))}
            </div>

            {/* Repeated dumping zones */}
            {!loading && dumpingZones.length > 0 && (
                <div className="border-t px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                        ♻️ Repeated Dumping Zones
                    </p>
                    {dumpingZones.map((z, i) => (
                        <DumpingZoneRow key={i} z={z} idx={i} />
                    ))}
                </div>
            )}

            {/* Pattern explanation */}
            {!loading && (patternExplanation || peakWasteTime) && (
                <div
                    className="border-t px-4 py-3 text-xs leading-relaxed space-y-1"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-gov-50)', color: 'var(--color-text-soft)' }}
                >
                    {peakWasteTime && (
                        <p><strong style={{ color: 'var(--color-gov-800)' }}>Peak waste time:</strong> {peakWasteTime}</p>
                    )}
                    {patternExplanation && (
                        <p><strong style={{ color: 'var(--color-gov-800)' }}>Pattern:</strong> {patternExplanation}</p>
                    )}
                </div>
            )}
        </div>
    )
}
