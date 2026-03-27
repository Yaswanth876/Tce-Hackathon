// src/components/WorkforcePanel.jsx
// Displays workforce allocation plan from allocateWorkforce Cloud Function.
// Props:
//   workforce  — full allocateWorkforce response object
//   numWorkers — number shown in the header badge
//   numTrucks  — number shown in the header badge
//   loading, error

function urgencyBadge(level) {
    const map = {
        critical: 'bg-red-100 text-red-800 border border-red-200',
        high: 'bg-orange-100 text-orange-800 border border-orange-200',
        medium: 'bg-amber-100 text-amber-800 border border-amber-200',
        low: 'bg-green-100 text-green-800 border border-green-200',
    }
    return map[String(level ?? 'medium').toLowerCase()] ?? 'bg-gray-100 text-gray-700 border border-gray-200'
}

function WorkforceRow({ z }) {
    return (
        <div
            className="flex items-center gap-3 py-3 border-b last:border-0"
            style={{ borderColor: 'var(--color-border)' }}
        >
            <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--color-gov-700)' }}
            >
                {z.rank}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{z.zone_name}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{z.waste_type}</p>
            </div>
            <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize hidden sm:inline ${urgencyBadge(z.urgency_level)}`}
            >
                {z.urgency_level}
            </span>
            <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    👷 {z.workers_assigned} · 🚛 {z.trucks_assigned}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{z.estimated_zone_hours}h</p>
            </div>
        </div>
    )
}

export default function WorkforcePanel({
    workforce = null,
    numWorkers = 0,
    numTrucks = 0,
    loading = false,
    error = null,
}) {
    return (
        <div className="gov-card overflow-hidden">
            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <span>👷 Workforce Allocation Plan</span>
                <span className="text-xs font-normal opacity-80">{numWorkers} workers · {numTrucks} trucks</span>
            </div>

            <div className="p-4">
                {/* Loading */}
                {loading && (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-16 bg-gray-50 border border-gray-100 rounded-lg" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 py-3">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
                                <div className="flex-1 space-y-1.5"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
                                <div className="w-16 h-6 bg-gray-100 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="gov-alert-error">{error}</div>
                )}

                {/* Empty */}
                {!loading && !error && !workforce && (
                    <p className="text-sm text-center py-6" style={{ color: 'var(--color-muted)' }}>
                        No hotspot data available to generate a workforce plan.
                    </p>
                )}

                {/* Content */}
                {!loading && workforce && (
                    <>
                        {/* Route strategy */}
                        <div
                            className="rounded-lg p-3 mb-4 text-xs leading-relaxed"
                            style={{
                                background: 'var(--color-gov-50)',
                                color: 'var(--color-text-soft)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            <strong className="block mb-1" style={{ color: 'var(--color-gov-800)' }}>
                                🗺️ Route Strategy
                            </strong>
                            {workforce.route_strategy}
                        </div>

                        {/* Zone rows */}
                        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                            {(workforce.priority_order ?? []).map((z) => (
                                <WorkforceRow key={z.rank} z={z} />
                            ))}
                        </div>

                        {/* Completion estimate */}
                        <div
                            className="mt-4 pt-3 border-t flex items-center justify-between text-sm"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <span style={{ color: 'var(--color-muted)' }}>Estimated completion (parallel deployment)</span>
                            <span className="font-bold" style={{ color: 'var(--color-gov-700)' }}>
                                ⏱ {workforce.estimated_completion_hours} hr(s)
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
