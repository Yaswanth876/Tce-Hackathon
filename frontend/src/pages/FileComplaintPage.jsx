// src/pages/FileComplaintPage.jsx
// ---------------------------------------------------------------
// Citizen Complaint Filing Portal
// Allows citizens to report waste accumulation with photos and location
// ---------------------------------------------------------------

import { useState, useEffect } from 'react'
import Button from '../components/Button'
import Toast from '../components/Toast'

export default function FileComplaintPage() {
    const [formData, setFormData] = useState({
        title: '',
        category: 'garbage',
        severity: 'medium',
    })
    
    const [location, setLocation] = useState({ lat: null, lng: null })
    const [photo, setPhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
    const [locationLoading, setLocationLoading] = useState(false)

    // Get current location on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            setLocationLoading(true)
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                    setLocationLoading(false)
                },
                (error) => {
                    console.error('Geolocation error:', error)
                    setLocationLoading(false)
                    showToast('Unable to get location. Please enable location access and try again.', 'warning')
                }
            )
        }
    }, [])

    function showToast(message, type = 'info') {
        setToast({ show: true, message, type })
    }

    function handleChange(e) {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    function handlePhotoChange(e) {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('File size must be less than 5MB', 'error')
                return
            }
            setPhoto(file)
            setPhotoPreview(URL.createObjectURL(file))
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            if (!photo) {
                throw new Error('Photo is required. Please upload an image.')
            }

            if (!location.lat || !location.lng) {
                throw new Error('Location is required. Please enable location access.')
            }

            // Convert photo to base64 for localStorage storage
            const reader = new FileReader()
            reader.onloadend = async () => {
                try {
                    const base64Photo = reader.result
                    
                    const complaintData = {
                        title: formData.title || 'Sanitation Issue',
                        category: formData.category,
                        severity: formData.severity,
                        location: {
                            lat: location.lat,
                            lng: location.lng
                        },
                        photo: base64Photo,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                    }

                    // Store complaint in localStorage using localDb
                    const { addDoc, collection, db, serverTimestamp } = await import('../localDb')
                    await addDoc(collection(db, 'complaints'), {
                        ...complaintData,
                        createdAt: serverTimestamp()
                    })

                    showToast('Complaint submitted successfully! Our team will review it shortly.', 'success')
                    
                    // Reset form
                    setFormData({
                        title: '',
                        category: 'garbage',
                        severity: 'medium',
                    })
                    setPhoto(null)
                    setPhotoPreview(null)
                } catch (err) {
                    console.error('Storage error:', err)
                    throw err
                }
            }
            reader.readAsDataURL(photo)
        } catch (err) {
            console.error('Submission error:', err)
            showToast(err.message || 'Failed to submit complaint. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--color-surface)] py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-gov-900)] mb-2">
                        File a Complaint
                    </h1>
                    <p className="text-[var(--color-muted)]">
                        Upload an image and share your location to report the issue. Fields marked <span className="text-red-600">*</span> are mandatory.
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="gov-card p-6 sm:p-8 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Complaint Title Section */}
                        <div>
                            <label htmlFor="title" className="field-label">
                                Complaint Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="field-input"
                                placeholder="e.g., Garbage accumulation near market"
                                maxLength="100"
                            />
                            <p className="text-xs text-[var(--color-muted)] mt-1">
                                {formData.title.length}/100
                            </p>
                        </div>

                        {/* Category & Severity Section */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="field-label">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="field-input"
                                >
                                    <option value="garbage">Garbage</option>
                                    <option value="plastic">Plastic Waste</option>
                                    <option value="organic">Organic Waste</option>
                                    <option value="construction">Construction Debris</option>
                                    <option value="medical">Medical Waste</option>
                                    <option value="electronic">Electronic Waste</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="severity" className="field-label">
                                    Severity
                                </label>
                                <select
                                    id="severity"
                                    name="severity"
                                    value={formData.severity}
                                    onChange={handleChange}
                                    className="field-input"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Photo Upload Section */}
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-gov-800)] mb-4 pb-2 border-b border-[var(--color-border)]">
                                Upload Photo <span className="text-red-600">*</span>
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="photo" className="block text-sm font-semibold text-[var(--color-gov-700)] mb-2">
                                        Photo Evidence
                                    </label>
                                    <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-6 text-center cursor-pointer hover:bg-[var(--color-gov-50)] transition">
                                        <input
                                            type="file"
                                            id="photo"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                            required
                                        />
                                        <label htmlFor="photo" className="cursor-pointer">
                                            <svg className="mx-auto h-12 w-12 text-[var(--color-gov-400)] mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx={18} cy={24} r={4} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M40 12l-8 8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <p className="text-sm font-semibold text-[var(--color-gov-800)]">
                                                Click to upload or drag & drop
                                            </p>
                                            <p className="text-xs text-[var(--color-muted)] mt-1">
                                                JPEG, PNG or WebP · Max 5 MB
                                            </p>
                                            {photo && (
                                                <p className="text-xs text-green-600 font-semibold mt-2">
                                                    ✓ {photo.name}
                                                </p>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                {photoPreview && (
                                    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                                        <p className="text-sm font-semibold text-[var(--color-gov-800)] bg-[var(--color-gov-50)] px-4 py-2">
                                            Photo Preview
                                        </p>
                                        <img 
                                            src={photoPreview} 
                                            alt="Waste preview" 
                                            className="w-full h-64 object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Section */}
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-gov-800)] mb-4 pb-2 border-b border-[var(--color-border)]">
                                Location <span className="text-red-600">*</span>
                            </h2>
                            <div className="bg-[var(--color-gov-50)] rounded-lg p-4 flex items-start gap-3">
                                <svg className="w-6 h-6 text-[var(--color-gov-700)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-[var(--color-gov-800)] mb-3">
                                        Capture My Location
                                    </p>
                                    {locationLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin">
                                                <svg className="w-4 h-4 text-[var(--color-gov-700)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-[var(--color-muted)]">Getting your location...</p>
                                        </div>
                                    ) : location.lat ? (
                                        <div>
                                            <p className="text-sm font-mono text-green-700 font-semibold mb-2">
                                                ✓ Location captured
                                            </p>
                                            <p className="text-xs text-[var(--color-muted)] font-mono">
                                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm text-red-600 font-semibold mb-2">
                                                ✗ Location not captured
                                            </p>
                                            <p className="text-xs text-[var(--color-muted)] mb-3">
                                                Please enable location access in your browser settings and refresh the page.
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={() => window.location.reload()}
                                                className="text-xs px-3 py-1"
                                            >
                                                Retry Location
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-[var(--color-border)] flex gap-3">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={loading}
                                disabled={!photo || !location.lat || !location.lng}
                                className="flex-1 sm:flex-initial sm:px-8"
                            >
                                Submit Complaint
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    setFormData({ title: '', category: 'garbage', severity: 'medium' })
                                    setPhoto(null)
                                    setPhotoPreview(null)
                                }}
                                variant="secondary"
                                size="lg"
                                className="flex-1 sm:flex-initial sm:px-8"
                            >
                                Clear
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Information Card */}
                <div className="gov-card p-6 bg-[var(--color-gov-50)] border-l-4 border-[var(--color-gov-700)]">
                    <h3 className="text-sm font-bold text-[var(--color-gov-800)] mb-3">
                        📋 Important Information
                    </h3>
                    <ul className="text-xs text-[var(--color-muted)] space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold flex-shrink-0">•</span>
                            <span>All complaints are subject to verification by the designated sanitation officer</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold flex-shrink-0">•</span>
                            <span>Please ensure the photo clearly shows the waste accumulation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold flex-shrink-0">•</span>
                            <span>Misuse of this portal may attract penal action under applicable law</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold flex-shrink-0">•</span>
                            <span>Your complaint will be reviewed and acted upon as per municipal guidelines</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: 'info' })}
                />
            )}
        </div>
    )
                                    <select
                                        id="wasteType"
                                        name="wasteType"
                                        value={formData.wasteType}
                                        onChange={handleChange}
                                        className="field-input"
                                        required
                                    >
                                        <option value="mixed">Mixed Waste</option>
                                        <option value="plastic">Plastic Waste</option>
                                        <option value="organic">Organic Waste</option>
                                        <option value="construction">Construction Debris</option>
                                        <option value="medical">Medical Waste</option>
                                        <option value="electronic">Electronic Waste</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="description" className="field-label">
                                        Description <span className="req">*</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="field-input"
                                        rows={4}
                                        placeholder="Describe the waste accumulation issue in detail..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Photo Upload Section */}
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-gov-800)] mb-4 pb-2 border-b border-[var(--color-border)]">
                                Upload Photo
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="photo" className="field-label">
                                        Photo Evidence <span className="req">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        id="photo"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="field-input"
                                        required
                                    />
                                    <p className="text-xs text-[var(--color-muted)] mt-1">
                                        Upload a clear photo of the waste. Max size: 5MB
                                    </p>
                                </div>
                                {photoPreview && (
                                    <div className="border border-[var(--color-border)] rounded p-4">
                                        <p className="text-sm font-semibold text-[var(--color-gov-800)] mb-2">Photo Preview:</p>
                                        <img 
                                            src={photoPreview} 
                                            alt="Waste preview" 
                                            className="w-full max-w-md h-auto rounded border border-[var(--color-border)]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 border-t border-[var(--color-border)]">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={loading}
                                className="w-full sm:w-auto px-8"
                            >
                                Submit Complaint
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Information Card */}
                <div className="gov-card p-6 bg-[var(--color-gov-50)]">
                    <h3 className="text-sm font-bold text-[var(--color-gov-800)] mb-2">
                        What happens next?
                    </h3>
                    <ul className="text-xs text-[var(--color-muted)] space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold">1.</span>
                            <span>Your complaint will be registered and you'll receive a tracking ID via SMS</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold">2.</span>
                            <span>AI will analyze the waste type and severity automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold">3.</span>
                            <span>Municipal officers will assign a sanitation crew within 24 hours</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[var(--color-gov-700)] font-bold">4.</span>
                            <span>You'll receive SMS updates on the cleanup progress</span>
                        </li>
                    </ul>
                </div>

            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: 'info' })}
                />
            )}
        </div>
    )
}
