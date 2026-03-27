// src/pages/Home.jsx
// ---------------------------------------------------------------
// Citizen Complaint Registration — File a Report
// Renders UploadForm as the single source of truth for submissions.
// ---------------------------------------------------------------

import { useState } from 'react'
import UploadForm from '../components/UploadForm'
import Toast, { useToast } from '../components/Toast'
import { HiInformationCircle } from 'react-icons/hi2'
import { useAuth } from '../context/AuthContext'

export default function Home() {
    const { user } = useAuth()
    const { toast, showToast, hideToast } = useToast()
    const [lastDocId, setLastDocId] = useState(null)

    const handleSuccess = ({ complaintId }) => {
        setLastDocId(complaintId)
        showToast(
            `Complaint registered! Reference: ${complaintId.slice(0, 8)}… AI analysis triggered.`,
            'success',
            6000,
        )
    }

    return (
        <div>
            {/* Page intro banner */}
            <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6">
                <div
                    className="mb-2 rounded px-4 py-3 text-xs flex items-start gap-2"
                    style={{
                        background: '#FFF8E7',
                        border: '1px solid #FCEAAA',
                        borderLeft: '4px solid #D97706',
                        color: '#6B4E00',
                    }}
                >
                    <HiInformationCircle className="w-4 h-4 leading-none mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>
                        Fields marked <strong className="text-red-700">*</strong> are mandatory.
                        All complaints are subject to verification by the designated sanitation officer.
                        Misuse of this portal may attract penal action under applicable law.
                    </span>
                </div>
            </div>

            {/* Upload form — single source of truth */}
            <UploadForm onSuccess={handleSuccess} createdBy={user?.uid} />

            {/* Toast notification */}
            <Toast {...toast} onClose={hideToast} />
        </div>
    )
}
