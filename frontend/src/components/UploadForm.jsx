// src/components/UploadForm.jsx
// ---------------------------------------------------------------
// Citizen upload component — Single source of truth for:
//   • Complaint form with title and description
//   • Image preview (local file or external URL)
//   • Browser Geolocation API capture
//   • MongoDB complaint submission via API
//   • Full loading, error, and success states
//
// NOTE: Image uploads currently use external URLs or preview only.
//       For file uploads: integrate S3/Cloudinary later.
// ---------------------------------------------------------------

import { useState, useRef, useCallback } from 'react'
import { createComplaint } from '../api/complaintService'
import { API_BASE_URL } from '../config'
import { HiExclamationTriangle } from 'react-icons/hi2'

// ── Constants ──────────────────────────────────────────────────
const ACCEPTED_MIME = 'image/jpeg,image/png,image/webp'
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

// ── Helpers ────────────────────────────────────────────────────
function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Sub-components ─────────────────────────────────────────────
function Spinner({ size = 'h-4 w-4' }) {
    return (
        <svg className={`animate-spin ${size}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    )
}

function ProgressBar({ value }) {
    return (
        <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--color-gov-100)' }}>
            <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${value}%`, background: 'var(--color-gov-700)' }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
            />
        </div>
    )
}

// ── Main component ─────────────────────────────────────────────
export default function UploadForm({ onSuccess, createdBy = null }) {
    // ── State ──────────────────────────────────────────────────────
    const [imageFile, setImageFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)

    const [geoStatus, setGeoStatus] = useState('idle') 
    const [coords, setCoords] = useState(null)

    const [uploadStatus, setUploadStatus] = useState('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [createdId, setCreatedId] = useState(null)
    const [analysisResult, setAnalysisResult] = useState(null)

    const [fileError, setFileError] = useState('')
    const [geoError, setGeoError] = useState('')
    const [submitError, setSubmitError] = useState('')

    const fileInputRef = useRef(null)

    // ── Image selection ────────────────────────────────────────────
    const applyFile = useCallback((file) => {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setFileError('Only JPEG, PNG, or WebP images are accepted.')
            return
        }
        if (file.size > MAX_FILE_BYTES) {
            setFileError(`File too large (${formatBytes(file.size)}). Max 5 MB allowed.`)
            return
        }
        setFileError('')
        setImageFile(file)
        setPreview(URL.createObjectURL(file))
    }, [])

    const handleFileChange = (e) => applyFile(e.target.files?.[0])
    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        applyFile(e.dataTransfer.files?.[0])
    }
    const clearImage = () => {
        setImageFile(null)
        if (preview) URL.revokeObjectURL(preview)
        setPreview(null)
        setFileError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ── Geolocation ────────────────────────────────────────────────
    const fetchLocation = () => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by this browser.')
            setGeoStatus('error')
            return
        }
        setGeoStatus('fetching')
        setGeoError('')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
                setGeoStatus('done')
            },
            (err) => {
                const messages = {
                    1: 'Location permission denied. Please allow access and retry.',
                    2: 'Location information unavailable.',
                    3: 'Location request timed out. Please retry.',
                }
                setGeoError(messages[err.code] ?? 'Unknown geolocation error.')
                setGeoStatus(err.code === 1 ? 'denied' : 'error')
            },
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
        )
    }

    // ── Form submit ────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitError('')
        setAnalysisResult(null)

        if (!imageFile) { setSubmitError('Please upload an image.'); return }
        if (!coords) { setSubmitError('Please capture your location before submitting.'); return }

        try {
            setUploadStatus('uploading')
            setUploadProgress(25)

            setUploadProgress(50)
            setUploadStatus('saving')

            const response = await createComplaint({
                title: 'Image Report',
                description: 'Image-based complaint report',
                imageFile: imageFile, // Send the actual file for backend processing
                location: {
                    lat: coords.latitude,
                    lng: coords.longitude,
                    address: `Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)}`,
                },
                severity: 5,
                category: 'mixed',
                createdBy: createdBy || 'citizen',
            })

            const complaint = response?.data?.complaint
                ?? response?.data?.data
                ?? response?.data
                ?? {}
            const ai = complaint?.ai_analysis ?? response?.data?.ai_analysis ?? null

            setUploadProgress(100)
            setCreatedId(complaint?._id ?? complaint?.id ?? response?.data?._id ?? null)
            setAnalysisResult(ai)
            setUploadStatus('done')
            onSuccess?.({ complaintId: complaint?._id ?? complaint?.id ?? response?.data?._id, coords, aiAnalysis: ai })

        } catch (err) {
            console.error('[UploadForm] submission error:', err)
            const friendlyMessage =
                err?.response?.status === 400 ? 'Invalid form data. Please check and retry.'
                    : err?.response?.status === 500 ? 'Server error. Please try again later.'
                        : err?.message?.includes('Network') ? 'Network error. Please check your connection.'
                            : 'An unexpected error occurred. Please try again.'
            setSubmitError(friendlyMessage)
            setUploadStatus('error')
        }
    }

    // ── Reset ──────────────────────────────────────────────────────
    const handleReset = () => {
        clearImage()
        setCoords(null); setGeoStatus('idle'); setGeoError('')
        setUploadStatus('idle'); setUploadProgress(0)
        setCreatedId(null); setSubmitError('')
        setAnalysisResult(null)
    }

    const isUploading = uploadStatus !== 'idle' && uploadStatus !== 'done' && uploadStatus !== 'error'

    // ── Upload form ────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            <div className="gov-card overflow-hidden">
                <div className="section-header">File Complaint</div>

                <form onSubmit={handleSubmit} noValidate className="p-6 flex flex-col gap-6">

                    {/* Image Upload */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold" style={{ color: 'var(--color-gov-700)' }}>
                            Photograph <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        
                        {preview ? (
                            <div className="relative border rounded overflow-hidden" style={{ borderColor: 'var(--color-border-strong)' }}>
                                <img src={preview} alt="Preview" className="w-full max-h-60 object-cover" />
                                {!isUploading && (
                                    <button type="button" onClick={clearImage} aria-label="Remove photo"
                                        className="absolute top-2 right-2 bg-white/90 hover:bg-white border rounded-full px-2 py-1 text-xs font-semibold transition"
                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-gov-900)' }}>
                                        ✕ Remove
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div
                                role="button" tabIndex={0}
                                onDrop={handleDrop}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                onDragLeave={() => setIsDragging(false)}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                className={[
                                    'border-2 border-dashed rounded p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors duration-200 text-center',
                                    isDragging
                                        ? 'border-[var(--color-gov-600)] bg-[var(--color-gov-50)]'
                                        : 'border-[var(--color-border-strong)] hover:border-[var(--color-gov-500)] hover:bg-[var(--color-gov-50)]',
                                ].join(' ')}
                            >
                                <svg className="w-10 h-10" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-gov-700)' }}>Click to upload or drag & drop</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>JPEG, PNG or WebP · Max 5 MB</p>
                                </div>
                            </div>
                        )}

                        <input ref={fileInputRef} id="upload-photo" type="file" accept={ACCEPTED_MIME}
                            onChange={handleFileChange} className="sr-only" aria-label="Choose photo" />

                        {fileError && (
                            <p role="alert" className="text-xs text-red-700 mt-1.5 flex items-center gap-1">
                                <HiExclamationTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {fileError}
                            </p>
                        )}
                    </div>

                    {/* Location */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold" style={{ color: 'var(--color-gov-700)' }}>
                            Location <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        
                        <button type="button" onClick={fetchLocation}
                            disabled={geoStatus === 'fetching' || isUploading}
                            className={[
                                'btn-gov-outline flex items-center gap-2 justify-center text-sm',
                                geoStatus === 'done' ? 'border-[var(--color-tri-green)] text-[var(--color-tri-green)]' : '',
                            ].join(' ')}>
                            {geoStatus === 'fetching' ? (
                                <><Spinner /> Locating…</>
                            ) : geoStatus === 'done' ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Location Captured
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Capture My Location
                                </>
                            )}
                        </button>

                        {coords && (
                            <div className="text-xs font-mono rounded px-3 py-2 leading-relaxed"
                                style={{ background: 'var(--color-gov-50)', border: '1px solid var(--color-gov-100)', color: 'var(--color-gov-700)' }}>
                                <span className="text-gray-600">Lat: </span>{coords.latitude.toFixed(6)}
                                <span className="mx-1 text-gray-600">·</span>
                                <span className="text-gray-600">Lng: </span>{coords.longitude.toFixed(6)}
                            </div>
                        )}

                        {geoError && (
                            <p role="alert" className="text-xs text-red-700 mt-1 flex items-start gap-1">
                                <HiExclamationTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {geoError}
                            </p>
                        )}
                    </div>

                    {/* Upload progress */}
                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
                                <span>
                                    {uploadStatus === 'uploading' ? 'Processing…'
                                        : uploadStatus === 'saving' ? 'Saving to MongoDB…'
                                            : 'Complete'}
                                </span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <ProgressBar value={uploadProgress} />
                        </div>
                    )}

                    {/* Submit error */}
                    {submitError && <div role="alert" className="gov-alert-error">⚠️ {submitError}</div>}

                    {/* Action row */}
                    <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <button type="submit" disabled={isUploading} className="btn-gov flex items-center gap-2">
                            {isUploading && <Spinner />}
                            {isUploading ? 'Submitting…' : 'Submit Complaint'}
                        </button>
                        {!isUploading && (
                            <button type="button" onClick={handleReset} className="btn-gov-outline">Clear</button>
                        )}
                    </div>

                    {/* Inline post-submit result (shown right after submit button) */}
                    {uploadStatus === 'done' && (
                        <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-gov-200)', background: 'var(--color-gov-50)' }}>
                            <div className="gov-alert-success text-sm">
                                ✅ Complaint submitted successfully. Reference: {createdId}
                            </div>

                            {analysisResult ? (
                                <div className="rounded-md border p-3 bg-white space-y-2" style={{ borderColor: 'var(--color-border)' }}>
                                    <p className="text-sm font-bold" style={{ color: 'var(--color-gov-800)' }}>Gemini Image Analysis</p>
                                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span style={{ color: 'var(--color-muted)' }} className="font-medium">Waste Type: </span>
                                            <span className="capitalize" style={{ color: 'var(--color-gov-800)' }}>{analysisResult.waste_type ?? 'mixed'}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--color-muted)' }} className="font-medium">Severity: </span>
                                            <span style={{ color: 'var(--color-gov-800)' }}>{analysisResult.severity_score ?? 5}/10</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--color-muted)' }} className="font-medium">Urgency: </span>
                                            <span className="capitalize" style={{ color: 'var(--color-gov-800)' }}>{analysisResult.urgency_level ?? 'medium'}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--color-muted)' }} className="font-medium">Cleanup Priority: </span>
                                            <span className="capitalize" style={{ color: 'var(--color-gov-800)' }}>{analysisResult.cleanup_priority ?? 'medium'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                    Gemini analysis is being processed. It will appear in your complaint card once available.
                                </p>
                            )}

                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                API endpoint: {API_BASE_URL}/complaints/{createdId}
                            </p>
                        </div>
                    )}

                </form>
            </div>
        </div>
    )
}
