// src/components/Toast.jsx
// Lightweight, auto-dismissing toast notification.
// Tamil Nadu Government official style.
// Usage:
//   const { toast, showToast } = useToast()
//   showToast('Upload successful!', 'success')
//   <Toast {...toast} />

import { useState, useCallback, useEffect } from 'react'

const VARIANTS = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#166534', icon: '✓' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c1c', icon: '✕' },
    info: { bg: '#e8f0f8', border: '#93c5fd', text: '#1e3a8a', icon: 'i' },
    warning: { bg: '#fffbeb', border: '#fcd34d', text: '#78350f', icon: '⚠' },
}

export function useToast() {
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        setToast({ visible: true, message, type })
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
    }, [])

    const hideToast = useCallback(() => {
        setToast((t) => ({ ...t, visible: false }))
    }, [])

    return { toast, showToast, hideToast }
}

export default function Toast({ visible, message, type = 'info', onClose }) {
    const v = VARIANTS[type] ?? VARIANTS.info

    useEffect(() => {
        if (!visible) return
    }, [visible])

    if (!visible) return null

    return (
        <div
            role="alert"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                zIndex: 9999,
                maxWidth: '360px',
                background: v.bg,
                border: `1px solid ${v.border}`,
                borderLeft: `4px solid ${v.border}`,
                borderRadius: '8px',
                padding: '0.875rem 1rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                animation: 'slideInToast 0.25s ease-out',
            }}
        >
            <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>{v.icon}</span>

            <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: v.text, flex: 1, margin: 0, lineHeight: 1.5 }}>
                {message}
            </p>

            <button
                onClick={onClose}
                aria-label="Dismiss notification"
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: v.text,
                    opacity: 0.6,
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: 0,
                    flexShrink: 0,
                }}
            >
                ×
            </button>
        </div>
    )
}
