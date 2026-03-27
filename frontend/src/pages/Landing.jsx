// src/pages/Landing.jsx
// ---------------------------------------------------------------
// Aqro  Landing Page — Tamil Nadu Government Official Portal
// Madurai Municipal Corporation
// ---------------------------------------------------------------

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where, db } from '../localDb'

import Button from '../components/Button'
import { HiCpuChip, HiMap, HiChartBar, HiXCircle, HiCheckCircle, HiTrophy } from 'react-icons/hi'

function StatPanel({ label, value, loading }) {
    return (
        <div className="gov-card text-center p-6 border-t-4 border-[var(--color-gov-700)]">
            {loading ? (
                <div className="w-16 h-10 rounded animate-pulse bg-gray-200 mx-auto mb-2" />
            ) : (
                <p className="text-4xl font-bold text-[var(--color-gov-800)] mb-2">{value}</p>
            )}
            <p className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                {label}
            </p>
        </div>
    )
}

function ProcessStep({ number, title, description }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-gov-700)] text-white flex items-center justify-center font-bold text-lg">
                {number}
            </div>
            <div className="flex-1 pt-2">
                <h3 className="font-bold text-base text-[var(--color-text)] mb-1">{title}</h3>
                <p className="text-sm text-[var(--color-text-soft)] leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function TransparencyCard({ icon, title, description, linkTo }) {
    const content = (
        <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-gov-50)] flex items-center justify-center text-[var(--color-gov-700)]">
                {icon}
            </div>
            <h3 className="font-bold text-base text-[var(--color-text)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-soft)] leading-relaxed">{description}</p>
        </>
    )

    if (linkTo) {
        return (
            <Link to={linkTo} className="gov-card p-5 text-center hover:shadow-md transition-shadow block">
                {content}
                <span className="text-xs text-[var(--color-gov-700)] font-semibold mt-3 inline-block">
                    View →
                </span>
            </Link>
        )
    }

    return (
        <div className="gov-card p-5 text-center">
            {content}
        </div>
    )
}

function TNEmblemLarge() {
    return (
        <svg
            width="80" height="80" viewBox="0 0 80 80"
            fill="none" xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="mx-auto"
        >
            <rect x="12" y="12" width="56" height="56" rx="4" stroke="#104080" strokeWidth="3" fill="none" />
            <circle cx="40" cy="40" r="18" stroke="#104080" strokeWidth="3" fill="none" />
            <circle cx="40" cy="40" r="5" fill="#104080" />
            <text x="40" y="30" fontSize="14" fill="#104080" fontWeight="bold" textAnchor="middle">TN</text>
        </svg>
    )
}

export default function Landing() {
    const [stats, setStats] = useState({
        total: 0,
        cleared: 0,
        pending: 0,
        percentage: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const reportsRef = collection(db, 'reports')
                const snapshot = await getDocs(reportsRef)
                
                const total = snapshot.size
                const cleared = snapshot.docs.filter(doc => doc.data().status === 'resolved').length
                const pending = total - cleared
                const percentage = total > 0 ? Math.round((cleared / total) * 100) : 0

                setStats({ total, cleared, pending, percentage })
            } catch (error) {
                console.error('Error fetching stats:', error)
                setStats({ total: 0, cleared: 0, pending: 0, percentage: 0 })
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <div className="bg-white">
            {/* 1 — Government Header Section */}
            <section className="bg-white border-b-4 border-[var(--color-gov-700)] py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <TNEmblemLarge />
                    <p className="text-xs font-semibold text-[var(--color-gov-600)] uppercase tracking-widest mt-6 mb-1">
                        Government of Tamil Nadu
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-gov-900)] mb-1">
                        Madurai City Municipal Corporation
                    </h1>
                    <p className="text-xs text-[var(--color-muted)] mb-4">
                        Arignar Anna Maligai, Thallakulam, Madurai &mdash; 625 002. &nbsp;·&nbsp;
                        <a href="tel:+914522540333" className="hover:underline text-[var(--color-gov-700)]">+91 452 2540333</a>
                    </p>
                    <p className="text-lg sm:text-xl font-semibold text-[var(--color-gov-700)] mb-2">
                        Aqro : AI-Enabled Civic Sanitation Management System
                    </p>
                    <p className="text-sm text-[var(--color-muted)] max-w-2xl mx-auto leading-relaxed mb-6">
                        Madurai &mdash; the &ldquo;Athens of the East&rdquo; &mdash; is the second-largest Municipal
                        Corporation in Tamil Nadu. Aqro  leverages artificial intelligence to deliver
                        transparent, citizen-driven sanitation management across all 100 wards.
                    </p>
                    {/* Corporation Quick Facts */}
                    <div className="inline-flex flex-wrap justify-center gap-x-8 gap-y-2 border border-[var(--color-border)] rounded px-6 py-3 bg-[var(--color-surface)]">
                        {[
                            { label: 'Wards', value: '100' },
                            { label: 'Area', value: '147.99 Sq.Km' },
                            { label: 'Zones', value: '5 Zones' },
                            { label: 'Established', value: '1ˢᵗ Nov 1866' },
                            { label: 'Population', value: '14.7 Lakh+' },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                                <p className="text-base font-bold text-[var(--color-gov-800)]">{value}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2 — Current City Status Overview */}
            <section className="bg-[var(--color-surface)] py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-[var(--color-gov-800)] mb-2">
                            Current City Status
                        </h2>
                        <p className="text-sm text-[var(--color-muted)]">Real-time sanitation statistics</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatPanel label="Total Complaints" value={stats.total} loading={loading} />
                        <StatPanel label="Complaints Cleared" value={stats.cleared} loading={loading} />
                        <StatPanel label="Pending Complaints" value={stats.pending} loading={loading} />
                        <StatPanel label="Clearance Rate" value={`${stats.percentage}%`} loading={loading} />
                    </div>
                </div>
            </section>

            {/* 3 — Before vs After Impact Section */}
            <section className="bg-white py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-[var(--color-gov-800)] mb-2">
                            Impact of Aqro  Initiative
                        </h2>
                        <p className="text-sm text-[var(--color-muted)]">Visible improvements in civic cleanliness</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="gov-card overflow-hidden">
                            <div className="bg-red-50 border-b-2 border-red-200 px-4 py-3">
                                <h3 className="font-bold text-center text-red-800 uppercase tracking-wide text-sm">
                                    Before Sanitation
                                </h3>
                            </div>
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                <div className="text-center p-6">
                                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                                        <HiXCircle className="w-12 h-12 text-red-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600">Waste accumulation zones</p>
                                    <p className="text-xs text-gray-500 mt-1">Before AI-driven cleanup</p>
                                </div>
                            </div>
                        </div>

                        <div className="gov-card overflow-hidden">
                            <div className="bg-green-50 border-b-2 border-green-200 px-4 py-3">
                                <h3 className="font-bold text-center text-green-800 uppercase tracking-wide text-sm">
                                    After Cleanup
                                </h3>
                            </div>
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                <div className="text-center p-6">
                                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                                        <HiCheckCircle className="w-12 h-12 text-green-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600">Clean public spaces</p>
                                    <p className="text-xs text-gray-500 mt-1">After Aqro  intervention</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4 — How the System Works */}
            <section className="bg-[var(--color-surface)] py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-[var(--color-gov-800)] mb-2">
                            How Aqro  Works
                        </h2>
                        <p className="text-sm text-[var(--color-muted)]">
                            AI-powered 4-step sanitation management process
                        </p>
                    </div>

                    <div className="bg-white rounded border border-[var(--color-border)] p-6 sm:p-8 space-y-6">
                        <ProcessStep
                            number="1"
                            title="Municipal Monitoring & Detection"
                            description="Municipal officers and sanitation teams identify waste accumulation zones during routine patrols. Geo-tagged data is recorded in the Aqro  system for comprehensive tracking."
                        />
                        <div className="border-l-2 border-dashed border-[var(--color-border)] h-8 ml-6" />
                        
                        <ProcessStep
                            number="2"
                            title="AI Analyzes Waste"
                            description="Google Gemini AI automatically classifies waste type, estimates severity, and identifies patterns. Real-time analysis ensures rapid response."
                        />
                        <div className="border-l-2 border-dashed border-[var(--color-border)] h-8 ml-6" />
                        
                        <ProcessStep
                            number="3"
                            title="Corporation Assigns Crew"
                            description="Municipal officers receive alerts and allocate sanitation workers based on AI recommendations. Optimized workforce deployment for maximum efficiency."
                        />
                        <div className="border-l-2 border-dashed border-[var(--color-border)] h-8 ml-6" />
                        
                        <ProcessStep
                            number="4"
                            title="Cleanup Verified"
                            description="Completion is verified and logged into the system. Citizens receive status updates, ensuring complete transparency and accountability."
                        />
                    </div>
                </div>
            </section>

            {/* 5 — Public Transparency Section */}
            <section className="bg-white py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-[var(--color-gov-800)] mb-2">
                            Public Transparency & Accountability
                        </h2>
                        <p className="text-sm text-[var(--color-muted)]">
                            Technology-driven governance for better civic services
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        <TransparencyCard
                            icon={<HiCpuChip className="w-8 h-8" />}
                            title="AI-Based Decision Support"
                            description="Machine learning algorithms analyze waste patterns and provide data-driven recommendations for resource allocation and preventive action."
                            linkTo="/dashboard"
                        />
                        <TransparencyCard
                            icon={<HiMap className="w-8 h-8" />}
                            title="Real-Time Heatmap Monitoring"
                            description="Interactive geographic visualization shows waste hotspots across Madurai. Officers can track trends and prioritize critical zones instantly."
                            linkTo="/heatmap"
                        />
                        <TransparencyCard
                            icon={<HiChartBar className="w-8 h-8" />}
                            title="Daily Sanitation Reports"
                            description="Comprehensive daily reports with cleanliness scores, active complaints, and crew performance. Full transparency for citizens and stakeholders."
                            linkTo="/reports"
                        />
                        <TransparencyCard
                            icon={<HiTrophy className="w-8 h-8" />}
                            title="Civic Participation Leaderboard"
                            description="Recognizing active citizens who contribute to a cleaner Madurai. Earn tokens for each complaint and see your civic impact."
                            linkTo="/leaderboard"
                        />
                    </div>
                </div>
            </section>

            {/* 6 — Call to Action */}
            <section className="bg-[var(--color-gov-700)] text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                        Join the Clean Madurai Movement
                    </h2>
                    <p className="text-blue-100 mb-2 max-w-2xl mx-auto">
                        Be a part of the solution. Report issues, track progress, and contribute to
                        making Madurai a cleaner, healthier city for all 14.7 lakh citizens.
                    </p>
                    <p className="text-xs text-blue-300 mb-8">
                        Official public grievance portal of the Madurai City Municipal Corporation &mdash;
                        <a href="https://maduraipublic.grievancecell.org/" target="_blank" rel="noopener noreferrer"
                            className="underline hover:text-white ml-1">maduraipublic.grievancecell.org</a>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
                        <Link to="/complaint">
                            <Button variant="primary" size="lg" className="w-full sm:w-auto min-w-[200px] bg-white text-[var(--color-gov-700)] hover:bg-blue-50">
                                File Complaint
                            </Button>
                        </Link>
                        <Link to="/leaderboard">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
                                View Leaderboard
                            </Button>
                        </Link>
                        <Link to="/heatmap">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
                                View Live Heatmap
                            </Button>
                        </Link>
                        <Link to="/reports">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
                                View Reports
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[200px]">
                                Officer Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
