// src/pages/UserProfilePage.jsx
// ---------------------------------------------------------------
// User Profile & Civic Participation Dashboard
// Official government citizen profile view
// ---------------------------------------------------------------

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, db } from '../localDb'
// MIGRATED: Use MongoDB API
// import { db } from '../firebase'
import { getUserData, createUserIdentifier } from '../utils/userManager'
import { HiTrophy, HiStar, HiShieldCheck, HiSparkles } from 'react-icons/hi2'

function StatCard({ label, value, icon, loading }) {
    return (
        <div className="gov-card p-5 border-t-4 border-[var(--color-gov-700)]">
            <div className="flex items-center justify-between mb-3">
                <div className="text-[var(--color-gov-700)]">
                    {icon}
                </div>
            </div>
            {loading ? (
                <div className="h-10 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
            ) : (
                <p className="text-3xl font-bold text-[var(--color-gov-900)] mb-1">{value}</p>
            )}
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
                {label}
            </p>
        </div>
    )
}

function ProfileCard({ user, loading }) {
    if (loading) {
        return (
            <div className="gov-card p-6 animate-pulse">
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-6 w-48 bg-gray-200 rounded"></div>
                        <div className="h-4 w-64 bg-gray-200 rounded"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="gov-card p-6 text-center">
                <p className="text-[var(--color-muted)]">Unable to load profile</p>
            </div>
        )
    }

    const memberSince = user.created_at?.toDate ? 
        user.created_at.toDate().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) :
        'Recently'

    return (
        <div className="gov-card p-6">
            <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-[var(--color-gov-700)] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[var(--color-gov-900)] mb-2">
                        {user.name || 'Anonymous User'}
                    </h2>
                    <div className="space-y-1.5 text-sm">
                        {user.email && (
                            <div className="flex items-center gap-2 text-[var(--color-muted)]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{user.email}</span>
                            </div>
                        )}
                        {user.phone && (
                            <div className="flex items-center gap-2 text-[var(--color-muted)]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{user.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-[var(--color-muted)]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="capitalize">{user.role || 'Citizen'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--color-muted)]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Member since {memberSince}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-6">
                        <div>
                            <p className="text-2xl font-bold text-[var(--color-gov-700)]">{user.tokens || 0}</p>
                            <p className="text-xs text-[var(--color-muted)]">Participation Tokens</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[var(--color-gov-700)]">{user.total_complaints || 0}</p>
                            <p className="text-xs text-[var(--color-muted)]">Total Complaints</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function RecognitionBadge({ tokens }) {
    let badge = {
        level: 'New Contributor',
        color: '#64748b',
        bgColor: '#f1f5f9',
        icon: <HiSparkles className="w-10 h-10" />
    }

    if (tokens >= 16) {
        badge = {
            level: 'Gold Contributor',
            color: '#92400e',
            bgColor: '#fef3c7',
            icon: <HiTrophy className="w-10 h-10" />
        }
    } else if (tokens >= 6) {
        badge = {
            level: 'Silver Contributor',
            color: '#374151',
            bgColor: '#e5e7eb',
            icon: <HiStar className="w-10 h-10" />
        }
    } else if (tokens >= 1) {
        badge = {
            level: 'Bronze Contributor',
            color: '#9a3412',
            bgColor: '#fed7aa',
            icon: <HiShieldCheck className="w-10 h-10" />
        }
    }

    return (
        <div className="gov-card p-6 text-center">
            <div className="flex items-center justify-center mb-3" style={{ color: badge.color }}>
                {badge.icon}
            </div>
            <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-2"
                style={{ backgroundColor: badge.bgColor, color: badge.color }}
            >
                {badge.level}
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-3">
                Recognition based on civic participation
            </p>
        </div>
    )
}

function ComplaintHistoryTable({ complaints, loading }) {
    if (loading) {
        return (
            <div className="gov-card p-6">
                <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (complaints.length === 0) {
        return (
            <div className="gov-card p-12 text-center">
                <svg className="w-16 h-16 text-[var(--color-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[var(--color-muted)] mb-2">No complaints submitted yet</p>
                <p className="text-xs text-[var(--color-muted)]">
                    Start contributing by filing a sanitation complaint
                </p>
            </div>
        )
    }

    function getStatusBadge(status) {
        const styles = {
            pending: 'bg-blue-100 text-blue-800 border-blue-200',
            inprogress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            resolved: 'bg-green-100 text-green-800 border-green-200',
            cleared: 'bg-green-100 text-green-800 border-green-200'
        }
        
        const labels = {
            pending: 'Pending',
            inprogress: 'In Progress',
            resolved: 'Resolved',
            cleared: 'Cleared'
        }

        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold border ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        )
    }

    function formatLocation(lat, lng) {
        if (!lat || !lng) return 'Location unavailable'
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }

    return (
        <div className="gov-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-[var(--color-gov-700)] text-white">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Waste Type</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[var(--color-border)]">
                        {complaints.map((complaint) => (
                            <tr key={complaint.id} className="hover:bg-[var(--color-gov-50)] transition-colors">
                                <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
                                    {complaint.createdAt?.toDate ? 
                                        complaint.createdAt.toDate().toLocaleDateString('en-IN', { 
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        }) : 
                                        'N/A'
                                    }
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--color-text)] capitalize">
                                    {complaint.wasteType || 'Mixed'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {getStatusBadge(complaint.status)}
                                </td>
                                <td className="px-4 py-3 text-xs text-[var(--color-muted)] font-mono">
                                    {complaint.location ? 
                                        formatLocation(complaint.location.lat, complaint.location.lng) :
                                        'N/A'
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default function UserProfilePage() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [complaints, setComplaints] = useState([])
    const [stats, setStats] = useState({
        total: 0,
        cleared: 0,
        pending: 0,
        clearanceRate: 0
    })
    const [userRank, setUserRank] = useState(null)
    const [loading, setLoading] = useState(true)
    const [complaintsLoading, setComplaintsLoading] = useState(true)

    useEffect(() => {
        async function loadProfile() {
            const userPhone = sessionStorage.getItem('userPhone')
            const userEmail = sessionStorage.getItem('userEmail')

            if (!userPhone && !userEmail) {
                navigate('/complaint')
                return
            }

            try {
                const userId = createUserIdentifier({ phone: userPhone, email: userEmail })
                const userData = await getUserData(userId)
                
                if (userData) {
                    setUser(userData)
                    
                    const usersQuery = query(
                        collection(db, 'users'),
                        where('role', '==', 'citizen'),
                        orderBy('tokens', 'desc')
                    )
                    
                    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
                        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                        const rank = users.findIndex(u => u.id === userId)
                        if (rank !== -1) {
                            setUserRank(rank + 1)
                        }
                    })

                    const complaintsQuery = query(
                        collection(db, 'reports'),
                        where('userId', '==', userId),
                        orderBy('createdAt', 'desc')
                    )

                    const unsubscribeComplaints = onSnapshot(complaintsQuery, (snapshot) => {
                        const complaintsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }))
                        
                        setComplaints(complaintsData)
                        
                        const total = complaintsData.length
                        const cleared = complaintsData.filter(c => c.status === 'resolved' || c.status === 'cleared').length
                        const pending = complaintsData.filter(c => c.status === 'pending' || c.status === 'inprogress').length
                        const clearanceRate = total > 0 ? Math.round((cleared / total) * 100) : 0
                        
                        setStats({ total, cleared, pending, clearanceRate })
                        setComplaintsLoading(false)
                    })

                    setLoading(false)

                    return () => {
                        unsubscribeUsers()
                        unsubscribeComplaints()
                    }
                } else {
                    navigate('/complaint')
                }
            } catch (error) {
                console.error('Profile load error:', error)
                setLoading(false)
                setComplaintsLoading(false)
            }
        }

        loadProfile()
    }, [navigate])

    function handleLogout() {
        sessionStorage.clear()
        navigate('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-gov-700)] border-t-transparent mb-4"></div>
                    <p className="text-[var(--color-muted)]">Loading profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--color-surface)] py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-gov-900)] mb-2">
                        User Profile
                    </h1>
                    <p className="text-[var(--color-muted)]">
                        Civic Participation Overview
                    </p>
                </div>

                {/* Profile Card */}
                <div className="mb-6">
                    <ProfileCard user={user} loading={loading} />
                </div>

                {/* Stats Grid */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-[var(--color-gov-800)] mb-4">
                        Civic Activity Summary
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Complaints"
                            value={stats.total}
                            loading={complaintsLoading}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Cleared Complaints"
                            value={stats.cleared}
                            loading={complaintsLoading}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Pending Complaints"
                            value={stats.pending}
                            loading={complaintsLoading}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            label="Clearance Rate"
                            value={`${stats.clearanceRate}%`}
                            loading={complaintsLoading}
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }
                        />
                    </div>
                    {userRank && (
                        <div className="mt-4 gov-card p-4 bg-[var(--color-gov-50)] border-l-4 border-[var(--color-gov-700)]">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-[var(--color-gov-700)]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--color-gov-900)]">
                                        Your Participation Rank: #{userRank}
                                    </p>
                                    <p className="text-xs text-[var(--color-muted)]">
                                        Among all citizens on the leaderboard
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <h2 className="text-lg font-bold text-[var(--color-gov-800)] mb-4">
                            Complaint History
                        </h2>
                        <ComplaintHistoryTable complaints={complaints} loading={complaintsLoading} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--color-gov-800)] mb-4">
                            Recognition Status
                        </h2>
                        <RecognitionBadge tokens={user?.tokens || 0} />
                        
                        <div className="mt-6">
                            <h2 className="text-lg font-bold text-[var(--color-gov-800)] mb-4">
                                Account Settings
                            </h2>
                            <div className="gov-card p-6 space-y-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-sm transition-colors"
                                >
                                    Logout
                                </button>
                                <p className="text-xs text-[var(--color-muted)] text-center">
                                    Profile editing feature coming soon
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
