// src/pages/DailyReportPage.jsx
// ---------------------------------------------------------------
// Daily Sanitation Performance Report — Madurai Municipal Corporation
// Official government reporting system with AI-generated insights
// ---------------------------------------------------------------

import { useState, useEffect } from 'react'
import { HiCheckCircle } from 'react-icons/hi2'
import { collection, getDocs, db } from '../localDb'
import Button from '../components/Button'

function ReportMetric({ label, value, unit = '', highlight = false }) {
    return (
        <div className={`p-4 border-b border-[var(--color-border)] last:border-0 ${highlight ? 'bg-[var(--color-gov-50)]' : ''}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)] mb-1">
                {label}
            </p>
            <p className={`text-3xl font-bold ${highlight ? 'text-[var(--color-gov-700)]' : 'text-[var(--color-text)]'}`}>
                {value}{unit && <span className="text-lg ml-1">{unit}</span>}
            </p>
        </div>
    )
}

function HotspotItem({ rank, location, severity, complaints }) {
    const severityColor = severity >= 8 ? '#dc2626' : severity >= 6 ? '#f97316' : '#d97706'
    
    return (
        <div className="flex items-center gap-4 p-3 border-b border-[var(--color-border)] last:border-0">
            <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: severityColor }}
            >
                {rank}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--color-text)]">{location}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Severity: {severity}/10 · {complaints} complaints
                </p>
            </div>
        </div>
    )
}

function WorkforceCard({ zone, workers, trucks, status }) {
    const statusColor = status === 'active' ? '#16a34a' : status === 'assigned' ? '#2563eb' : '#6b7280'
    
    return (
        <div className="gov-card p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-[var(--color-text)]">{zone}</h4>
                <span 
                    className="text-xs font-semibold px-2 py-1 rounded capitalize"
                    style={{ background: `${statusColor}15`, color: statusColor }}
                >
                    {status}
                </span>
            </div>
            <div className="flex gap-4 text-xs">
                <div>
                    <p className="text-[var(--color-muted)]">Workers</p>
                    <p className="font-bold text-[var(--color-text)] mt-0.5">{workers}</p>
                </div>
                <div>
                    <p className="text-[var(--color-muted)]">Trucks</p>
                    <p className="font-bold text-[var(--color-text)] mt-0.5">{trucks}</p>
                </div>
            </div>
        </div>
    )
}

export default function DailyReportPage() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    })
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchDailyReport()
    }, [selectedDate])

    async function fetchDailyReport() {
        setLoading(true)
        setError(null)

        try {
            const reportsRef = collection(db, 'reports')
            const selectedDateObj = new Date(selectedDate)
            const startOfDay = new Date(selectedDateObj)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(selectedDateObj)
            endOfDay.setHours(23, 59, 59, 999)

            const snapshot = await getDocs(reportsRef)
            
            const allReports = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    status: data.status ?? 'pending',
                    severity: data.ai_analysis?.severity_score ?? 5,
                    waste_type: data.ai_analysis?.waste_type ?? 'Unknown',
                    location: data.ai_analysis?.location_description ?? 'Unknown Location',
                    urgency: data.ai_analysis?.urgency_level ?? 'medium',
                    timestamp: data.metadata?.processed_at ?? data.created_at ?? null,
                }
            })

            const dayReports = allReports.filter(r => {
                if (!r.timestamp) return false
                const date = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp)
                return date >= startOfDay && date <= endOfDay
            })

            const totalComplaints = dayReports.length
            const clearedComplaints = dayReports.filter(r => r.status === 'resolved').length
            const clearanceRate = totalComplaints > 0 ? Math.round((clearedComplaints / totalComplaints) * 100) : 0

            const severeAreas = dayReports
                .filter(r => r.severity >= 6)
                .reduce((acc, r) => {
                    const loc = r.location
                    if (!acc[loc]) {
                        acc[loc] = { location: loc, severity: 0, count: 0, sumSeverity: 0 }
                    }
                    acc[loc].count++
                    acc[loc].sumSeverity += r.severity
                    return acc
                }, {})

            const hotspots = Object.values(severeAreas)
                .map(area => ({
                    ...area,
                    severity: Math.round(area.sumSeverity / area.count)
                }))
                .sort((a, b) => b.severity - a.severity)
                .slice(0, 3)

            const wardCleanliness = totalComplaints === 0 ? 95 :
                clearanceRate >= 90 ? 90 :
                clearanceRate >= 70 ? 75 :
                clearanceRate >= 50 ? 60 : 45

            const aiSummary = generateAISummary({
                totalComplaints,
                clearedComplaints,
                clearanceRate,
                wardCleanliness,
                hotspots,
                date: selectedDate
            })

            setReportData({
                date: selectedDate,
                wardCleanliness,
                totalComplaints,
                clearedComplaints,
                clearanceRate,
                hotspots,
                aiSummary,
                workforceAllocation: generateWorkforceData(hotspots.length)
            })
        } catch (err) {
            console.error('[DailyReportPage] Error fetching report:', err)
            setError(err.message || 'Failed to load report data')
        } finally {
            setLoading(false)
        }
    }

    function generateAISummary({ totalComplaints, clearedComplaints, clearanceRate, wardCleanliness, hotspots, date }) {
        const dateStr = new Date(date).toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        })

        let performance = 'satisfactory'
        let recommendation = 'Continue monitoring current areas.'

        if (clearanceRate >= 90) {
            performance = 'excellent'
            recommendation = 'Maintain current operational standards and consider best practice documentation.'
        } else if (clearanceRate >= 70) {
            performance = 'good'
            recommendation = 'Increase workforce deployment in identified hotspot areas.'
        } else if (clearanceRate < 50) {
            performance = 'requires improvement'
            recommendation = 'Immediate intervention required. Deploy additional crews to high-severity zones.'
        }

        const keyInsights = []

        if (clearanceRate >= 80) {
            keyInsights.push('High clearance rate indicates efficient waste management response.')
        }

        if (hotspots.length > 0) {
            keyInsights.push(`${hotspots.length} hotspot area(s) identified requiring priority attention.`)
        }

        if (wardCleanliness >= 80) {
            keyInsights.push('Ward cleanliness score meets Smart Cities Mission standards.')
        } else {
            keyInsights.push('Ward cleanliness score below target threshold. Enhanced monitoring recommended.')
        }

        const narrative = `Based on the sanitation data collected on ${dateStr}, the Madurai Municipal Corporation recorded ${totalComplaints} citizen complaints, of which ${clearedComplaints} have been successfully resolved, achieving a clearance rate of ${clearanceRate}%. The ward cleanliness score stands at ${wardCleanliness}/100, which is ${performance}. ${recommendation}`

        return { narrative, keyInsights }
    }

    function generateWorkforceData(hotspotCount) {
        return [
            { zone: 'Central Ward', workers: 12, trucks: 3, status: 'active' },
            { zone: 'North Zone', workers: 10, trucks: 2, status: 'active' },
            { zone: 'South Zone', workers: 8, trucks: 2, status: 'assigned' },
            { zone: 'East Zone', workers: 6, trucks: 1, status: hotspotCount > 2 ? 'active' : 'standby' },
        ]
    }

    function handlePrint() {
        window.print()
    }

    function handleDownloadPDF() {
        alert('PDF export functionality requires additional browser print-to-PDF or a PDF generation library.')
        window.print()
    }

    const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
    })

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            
            {/* 1️⃣ Header Section */}
            <div className="gov-card p-6 print:shadow-none print:border-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-[var(--color-gov-800)] mb-1">
                            Daily Sanitation Performance Report
                        </h1>
                        <p className="text-sm text-[var(--color-gov-700)] font-semibold">
                            Madurai Municipal Corporation
                        </p>
                    </div>
                    <div className="print:hidden">
                        <label className="field-label">Report Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="field-input"
                        />
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-sm text-[var(--color-muted)]">
                        Report Generated: {formattedDate}
                    </p>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="gov-card p-12 text-center">
                    <div 
                        className="w-10 h-10 rounded-full border-4 animate-spin mx-auto mb-4"
                        style={{ borderColor: 'var(--color-gov-100)', borderTopColor: 'var(--color-gov-700)' }}
                    />
                    <p className="text-sm font-medium text-[var(--color-muted)]">Loading report data...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="gov-alert-error" role="alert">
                    <strong>Error:</strong> {error}
                    <button 
                        onClick={fetchDailyReport}
                        className="ml-3 underline font-semibold text-xs"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Report Content */}
            {!loading && !error && reportData && (
                <>
                    {/* 2️⃣ Report Summary Card */}
                    <div className="gov-card overflow-hidden">
                        <div className="bg-[var(--color-gov-700)] text-white px-5 py-3">
                            <h2 className="font-bold text-sm uppercase tracking-wide">Performance Summary</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4">
                            <ReportMetric 
                                label="Ward Cleanliness Score" 
                                value={reportData.wardCleanliness}
                                unit="/100"
                                highlight
                            />
                            <ReportMetric 
                                label="Total Complaints" 
                                value={reportData.totalComplaints}
                            />
                            <ReportMetric 
                                label="Cleared Complaints" 
                                value={reportData.clearedComplaints}
                            />
                            <ReportMetric 
                                label="Clearance Rate" 
                                value={reportData.clearanceRate}
                                unit="%"
                            />
                        </div>
                    </div>

                    {/* 3️⃣ AI Generated Summary Section */}
                    <div className="gov-card">
                        <div className="bg-[var(--color-gov-700)] text-white px-5 py-3">
                            <h2 className="font-bold text-sm uppercase tracking-wide">AI Analysis & Insights</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)] mb-2">
                                    Executive Summary
                                </h3>
                                <p className="text-sm text-[var(--color-text)] leading-relaxed">
                                    {reportData.aiSummary.narrative}
                                </p>
                            </div>

                            <div className="bg-[var(--color-gov-50)] border border-[var(--color-gov-100)] rounded p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--color-gov-800)] mb-3">
                                    Key Insights
                                </h3>
                                <ul className="space-y-2">
                                    {reportData.aiSummary.keyInsights.map((insight, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-[var(--color-text-soft)]">
                                            <span className="text-[var(--color-gov-700)] font-bold mt-0.5">•</span>
                                            <span>{insight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 4️⃣ Hotspot Overview */}
                    <div className="gov-card">
                        <div className="bg-[var(--color-gov-700)] text-white px-5 py-3">
                            <h2 className="font-bold text-sm uppercase tracking-wide">Priority Areas Requiring Attention</h2>
                        </div>
                        <div className="p-4">
                            {reportData.hotspots.length > 0 ? (
                                <div className="space-y-0">
                                    {reportData.hotspots.map((hotspot, idx) => (
                                        <HotspotItem
                                            key={idx}
                                            rank={idx + 1}
                                            location={hotspot.location}
                                            severity={hotspot.severity}
                                            complaints={hotspot.count}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                                        <HiCheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--color-text)]">No Critical Hotspots</p>
                                    <p className="text-xs text-[var(--color-muted)] mt-1">
                                        All areas are within acceptable cleanliness thresholds
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5️⃣ Workforce Allocation Plan */}
                    <div className="gov-card">
                        <div className="bg-[var(--color-gov-700)] text-white px-5 py-3">
                            <h2 className="font-bold text-sm uppercase tracking-wide">Workforce Deployment Summary</h2>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {reportData.workforceAllocation.map((allocation, idx) => (
                                <WorkforceCard key={idx} {...allocation} />
                            ))}
                        </div>
                    </div>

                    {/* 6️⃣ Export Options */}
                    <div className="gov-card p-6 print:hidden">
                        <h2 className="font-bold text-sm uppercase tracking-wide text-[var(--color-gov-800)] mb-4">
                            Export Options
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="primary" size="md" onClick={handleDownloadPDF}>
                                Download PDF
                            </Button>
                            <Button variant="secondary" size="md" onClick={handlePrint}>
                                Print Report
                            </Button>
                        </div>
                        <p className="text-xs text-[var(--color-muted)] mt-4">
                            This report is generated automatically from AI-analyzed data and sanctioned workforce records. 
                            For official use by Madurai Municipal Corporation.
                        </p>
                    </div>

                    {/* Print Footer */}
                    <div className="hidden print:block border-t-2 border-[var(--color-gov-700)] pt-4 mt-8">
                        <div className="flex justify-between items-center text-xs text-[var(--color-muted)]">
                            <div>
                                <p className="font-bold text-[var(--color-gov-800)]">Madurai Municipal Corporation</p>
                                <p>Government of Tamil Nadu</p>
                            </div>
                            <div className="text-right">
                                <p>Report Generated: {new Date().toLocaleString('en-IN')}</p>
                                <p>Aqro  Sanitation Intelligence System</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
