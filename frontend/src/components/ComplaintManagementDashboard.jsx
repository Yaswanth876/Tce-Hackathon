import { useState, useEffect } from 'react'
import { getComplaints, updateComplaint } from '../api/complaintService'
import { HiMapPin, HiExclamationTriangle, HiCheckCircle, HiClock } from 'react-icons/hi2'

const statusColors = {
  pending: 'bg-yellow-50 border-yellow-200 border-l-4',
  assigned: 'bg-blue-50 border-blue-200 border-l-4',
  'in-progress': 'bg-orange-50 border-orange-200 border-l-4',
  completed: 'bg-green-50 border-green-200 border-l-4',
  rejected: 'bg-red-50 border-red-200 border-l-4',
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export default function ComplaintManagementDashboard() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('severity')
  const [expandedId, setExpandedId] = useState(null)
  const [assignmentData, setAssignmentData] = useState({})

  useEffect(() => {
    loadComplaints()
  }, [filter])

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const data = await getComplaints()
      let filtered = filter === 'all' ? data : data.filter((c) => c.status === filter)
      
      filtered.sort((a, b) => {
        if (sortBy === 'severity') {
          const aScore = a.ai_analysis?.severity_score || 5
          const bScore = b.ai_analysis?.severity_score || 5
          return bScore - aScore
        } else if (sortBy === 'workers') {
          const aWorkers = a.ai_analysis?.sanitary_workers_needed?.recommended || 0
          const bWorkers = b.ai_analysis?.sanitary_workers_needed?.recommended || 0
          return bWorkers - aWorkers
        } else if (sortBy === 'date') {
          return new Date(b.createdAt) - new Date(a.createdAt)
        }
        return 0
      })

      setComplaints(filtered)
    } catch (error) {
      console.error('Failed to load complaints:', error)
    }
    setLoading(false)
  }

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await updateComplaint(complaintId, { status: newStatus })
      await loadComplaints()
    } catch (error) {
      console.error('Failed to update complaint:', error)
    }
  }

  const handleAssign = async (complaintId) => {
    const teamName = assignmentData[complaintId]
    if (!teamName?.trim()) return

    try {
      await updateComplaint(complaintId, { assignedTo: teamName })
      setAssignmentData({ ...assignmentData, [complaintId]: '' })
      await loadComplaints()
    } catch (error) {
      console.error('Failed to assign complaint:', error)
    }
  }

  const getUrgencyColor = (level) => priorityColors[level] || 'bg-gray-100 text-gray-800'

  // Stats
  const totalComplaints = complaints.length
  const pendingCount = complaints.filter((c) => c.status === 'pending').length
  const highPriorityCount = complaints.filter(
    (c) =>
      c.ai_analysis?.cleanup_priority === 'high' ||
      c.ai_analysis?.cleanup_priority === 'critical'
  ).length
  const completedCount = complaints.filter((c) => c.status === 'completed').length
  const totalWorkersNeeded = complaints.reduce(
    (sum, c) => sum + (c.ai_analysis?.sanitary_workers_needed?.recommended || 0),
    0
  )
  const totalWasteVolume = complaints.reduce((sum, c) => {
    const vol = c.ai_analysis?.estimated_volume?.amount || 0
    return sum + vol
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading complaints...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Complaint Management Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered waste complaint analysis and management for municipality officers
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalComplaints}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-xs font-medium text-gray-500 uppercase">High Priority</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{highPriorityCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Workers Needed</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{totalWorkersNeeded}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Waste</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{totalWasteVolume}</p>
            <p className="text-xs text-gray-500">kg</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="severity">Severity</option>
                <option value="workers">Workers Needed</option>
                <option value="date">Date</option>
              </select>
            </div>

            <div className="col-span-2 flex items-end">
              <button
                onClick={loadComplaints}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No complaints found</p>
            </div>
          ) : (
            complaints.map((complaint) => (
              <div
                key={complaint._id}
                className={`bg-white rounded-lg shadow overflow-hidden transition hover:shadow-lg ${statusColors[complaint.status]}`}
              >
                {/* Summary Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === complaint._id ? null : complaint._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {complaint.title || 'Waste Complaint'}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getUrgencyColor(
                          complaint.ai_analysis?.cleanup_priority || 'medium'
                        )}`}>
                          {(complaint.ai_analysis?.cleanup_priority || 'medium').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <HiMapPin className="h-4 w-4" />
                          {complaint.location?.address || 'Address unknown'}
                        </div>
                        {complaint.ai_analysis?.waste_type && (
                          <div className="capitalize">
                            {complaint.ai_analysis.waste_type}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {complaint.ai_analysis?.severity_score || 5}
                        </span>
                        <span className="text-xs text-gray-500">/10</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === complaint._id && (
                  <div className="border-t bg-gray-50 p-6 space-y-6">
                    {/* AI Analysis Grid */}
                    {complaint.ai_analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Waste Type & Composition */}
                        <div className="bg-white p-4 rounded border">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Waste Type</p>
                          <p className="text-lg font-bold text-gray-900 capitalize mb-2">
                            {complaint.ai_analysis.waste_type}
                          </p>
                          {complaint.ai_analysis.waste_composition?.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <p className="font-semibold mb-1">Composition:</p>
                              <ul className="space-y-0.5">
                                {complaint.ai_analysis.waste_composition.slice(0, 3).map((item, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-1">•</span> {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Volume */}
                        <div className="bg-white p-4 rounded border">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Estimated Volume</p>
                          <p className="text-2xl font-bold text-blue-600 mb-1">
                            {complaint.ai_analysis.estimated_volume?.amount}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            {complaint.ai_analysis.estimated_volume?.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            {complaint.ai_analysis.estimated_volume?.description}
                          </p>
                        </div>

                        {/* Workers */}
                        <div className="bg-white p-4 rounded border">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Workers Needed</p>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold text-orange-600">
                              {complaint.ai_analysis.sanitary_workers_needed?.recommended || 0}
                            </span>
                            <span className="text-sm text-gray-500">
                              (min: {complaint.ai_analysis.sanitary_workers_needed?.minimum || 0})
                            </span>
                          </div>
                          {complaint.ai_analysis.sanitary_workers_needed?.equipment?.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <p className="font-semibold mb-1">Equipment:</p>
                              <ul className="space-y-0.5">
                                {complaint.ai_analysis.sanitary_workers_needed.equipment.slice(0, 3).map((eq, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-1">✓</span> {eq}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Hazards */}
                        <div className="bg-white p-4 rounded border">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Risk Level</p>
                          <p className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${getUrgencyColor(
                            complaint.ai_analysis.hazards?.contamination_risk || 'medium'
                          )}`}>
                            {(complaint.ai_analysis.hazards?.contamination_risk || 'medium').toUpperCase()}
                          </p>
                          {complaint.ai_analysis.hazards?.immediate_hazards?.length > 0 && (
                            <div className="text-xs text-red-600 mt-2">
                              <p className="font-semibold mb-1">⚠️ Immediate Risks:</p>
                              <ul className="space-y-0.5">
                                {complaint.ai_analysis.hazards.immediate_hazards.slice(0, 3).map((h, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-1">!</span> {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hazards & Health Risks */}
                    {complaint.ai_analysis?.hazards && (
                      <div className="bg-red-50 border border-red-200 rounded p-4">
                        <h4 className="font-semibold text-red-900 mb-3">🚨 Health & Environmental Alert</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {complaint.ai_analysis.hazards.health_risks?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-red-900 mb-2">Health Risks to Workers:</p>
                              <ul className="text-sm text-red-800 space-y-1">
                                {complaint.ai_analysis.hazards.health_risks.slice(0, 4).map((risk, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span>•</span> {risk}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {complaint.ai_analysis.hazards.environmental_impact && (
                            <div>
                              <p className="text-sm font-medium text-red-900 mb-2">Environmental Impact:</p>
                              <p className="text-sm text-red-800">
                                {complaint.ai_analysis.hazards.environmental_impact}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Location Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                      {complaint.location?.lat && (
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Location</p>
                            <p className="text-sm text-blue-800 mt-1">{complaint.location.address}</p>
                            <p className="text-xs text-blue-600 mt-1">
                              📍 {complaint.location.lat.toFixed(6)}, {complaint.location.lng.toFixed(6)}
                            </p>
                          </div>
                          {complaint.ai_analysis?.location_characteristics && (
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900">Area Characteristics</p>
                              <p className="text-sm text-blue-800 mt-1">
                                {complaint.ai_analysis.location_characteristics}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Image */}
                    {(complaint.imagePath || complaint.imageUrl) && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Complaint Image</p>
                        <img
                          src={
                            complaint.imageUrl ||
                            `http://localhost:5000/${complaint.imagePath}`
                          }
                          alt="Complaint"
                          className="max-h-64 w-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available'
                          }}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending Review</option>
                          <option value="assigned">Assigned to Team</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Team
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Team name"
                            value={assignmentData[complaint._id] || ''}
                            onChange={(e) =>
                              setAssignmentData({
                                ...assignmentData,
                                [complaint._id]: e.target.value,
                              })
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleAssign(complaint._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition"
                          >
                            Assign
                          </button>
                        </div>
                        {complaint.assignedTo && (
                          <p className="text-xs text-gray-600 mt-1">
                            👤 {complaint.assignedTo}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reporter Info
                        </label>
                        <div className="px-3 py-2 bg-gray-100 rounded-md text-sm">
                          <p className="text-gray-700">
                            By: <span className="font-medium">{complaint.createdBy || 'Anonymous'}</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(complaint.createdAt).toLocaleDateString()} {new Date(complaint.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
