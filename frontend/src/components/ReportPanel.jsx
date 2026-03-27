// src/components/ReportPanel.jsx
// "Generate Daily Report" button + letterhead display + download.
// Self-contained: manages its own loading/error/report state.
// Props:
//   hotspots         — array (from detectHotspots)
//   cleanlinessScore — number
//   ratingCategory   — string
//   prediction       — object (from predictGarbage), optional
//   functionsBase    — Cloud Functions base URL
//   onReportGenerated(report) — optional callback

import { useState, useCallback } from 'react'

export default function ReportPanel({
    hotspots = [],
    cleanlinessScore = 50,
    ratingCategory = 'Moderate',
    prediction = null,
    functionsBase = '',
    onReportGenerated = null,
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [report, setReport] = useState(null)

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

    const handleGenerate = useCallback(async () => {
        setLoading(true); setError(null); setReport(null)
        try {
            const res = await fetch(`${functionsBase}/generateDailyReport`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hotspots,
                    cleanliness_score: cleanlinessScore,
                    rating_category: ratingCategory,
                    predictions: prediction,
                    report_date: today,
                }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Report generation failed')
            setReport(json)
            onReportGenerated?.(json)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [hotspots, cleanlinessScore, ratingCategory, prediction, functionsBase, today, onReportGenerated])

    const handleDownload = () => {
        if (!report) return
        const blob = new Blob([report.summary_report], { type: 'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `MCL-Report-${report.report_date}.txt`
        a.click()
        URL.revokeObjectURL(a.href)
    }

    return (
        <div className="gov-card overflow-hidden">
            {/* Header */}
            <div className="section-header flex items-center justify-between">
                <span>📄 Daily Sanitation Report</span>
                {report && (
                    <span className="text-xs font-normal opacity-80">{report.report_date}</span>
                )}
            </div>

            <div className="p-5">
                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap mb-4">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !functionsBase || functionsBase.includes('YOUR_PROJECT_ID')}
                        className="btn-gov flex items-center gap-2 text-sm"
                        id="generate-report-btn"
                    >
                        {loading
                            ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generating…</>
                            : <>📄 {report ? 'Regenerate Report' : 'Generate Daily Report'}</>
                        }
                    </button>

                    {report && (
                        <button onClick={handleDownload} className="btn-gov-outline text-sm" id="download-report-btn">
                            ⬇ Download .txt
                        </button>
                    )}
                </div>

                {/* Env warning */}
                {(!functionsBase || functionsBase.includes('YOUR_PROJECT_ID')) && (
                    <div className="gov-alert-error text-xs mb-4">
                        ⚠️ <strong>VITE_FUNCTIONS_BASE_URL</strong> is not configured. Set it in <code>.env</code> to enable report generation.
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="gov-alert-error">{error}</div>
                )}

                {/* Loading placeholder */}
                {loading && !report && (
                    <div className="rounded-lg p-5 space-y-3 animate-pulse" style={{ background: '#f8fafc', border: '1px solid var(--color-border)' }}>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
                        <div className="h-2 bg-gray-100 rounded w-1/3 mx-auto" />
                        <div className="mt-4 space-y-2">
                            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-2 bg-gray-100 rounded" style={{ width: `${85 + (i % 3) * 5}%` }} />)}
                        </div>
                    </div>
                )}

                {/* Report */}
                {report && (
                    <div
                        className="rounded-lg p-5 text-sm leading-relaxed"
                        style={{
                            background: '#f8fafc',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            fontFamily: "'Noto Sans', serif",
                            lineHeight: '1.9',
                        }}
                    >
                        {/* Letterhead */}
                        <div
                            className="text-center mb-5 pb-4"
                            style={{ borderBottom: '2px solid var(--color-gov-700)' }}
                        >
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-gov-700)' }}>
                                Government of Tamil Nadu
                            </p>
                            <p className="font-bold text-base mt-1" style={{ color: 'var(--color-gov-900)' }}>
                                Madurai Municipal Corporation
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                Daily Sanitation Status Report — {report.report_date}
                            </p>
                        </div>

                        <p className="text-justify">{report.summary_report}</p>

                        <div
                            className="mt-5 pt-4 flex justify-between items-center text-xs"
                            style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
                        >
                            <span>Generated by Aqro  AI · {report.word_count} words</span>
                            <span>Ref: MCL-RPT-{report.report_date?.replace(/-/g, '')}</span>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                {!report && !loading && !error && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--color-muted)' }}>
                        Click <strong>Generate Daily Report</strong> to produce an AI-drafted official sanitation status report.
                    </p>
                )}
            </div>
        </div>
    )
}
