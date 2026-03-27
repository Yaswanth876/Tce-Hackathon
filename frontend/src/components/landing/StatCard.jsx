// src/components/landing/StatCard.jsx
// ─────────────────────────────────────────────────────────────
// Animated statistic card for the live stats section.
// Shows a large number, label, icon, and optional trend badge.
// Supports a loading skeleton state.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { HiArrowTrendingUp, HiArrowRight } from 'react-icons/hi2'

/**
 * Smoothly counts up from 0 to `target` over `duration` ms.
 * Returns the current display value.
 */
function useCountUp(target, duration = 1400, isLoading = false) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (isLoading || target === 0) {
      setValue(0)
      return
    }
    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, isLoading])

  return value
}

export default function StatCard({
  icon,
  label,
  value,
  suffix = '',
  accent = 'var(--color-gov-700)',
  trendLabel,
  trendPositive = true,
  isLoading = false,
}) {
  const displayed = useCountUp(value ?? 0, 1400, isLoading)

  if (isLoading) {
    return (
      <div className="gov-card rounded-xl p-6 flex flex-col gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-[#d1d9e6]" />
        <div className="h-9 w-24 rounded bg-[#d1d9e6]" />
        <div className="h-4 w-32 rounded bg-[#e8edf4]" />
      </div>
    )
  }

  return (
    <div
      className="gov-card rounded-xl p-6 flex flex-col gap-3 transition-shadow duration-300 hover:shadow-lg"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      {/* Icon bubble */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 12%, white)` }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Number */}
      <div className="flex items-end gap-1">
        <span
          className="text-4xl font-extrabold leading-none tabular-nums tracking-tight"
          style={{ color: accent }}
        >
          {suffix === '%'
            ? displayed.toFixed(0)
            : displayed.toLocaleString('en-IN')}
        </span>
        {suffix && (
          <span className="text-xl font-bold mb-0.5" style={{ color: accent }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-sm font-semibold text-[var(--color-text-soft)] leading-tight">
        {label}
      </p>

      {/* Trend badge */}
      {trendLabel && (
        <span
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit"
          style={{
            background: trendPositive ? '#dcfce7' : '#fef3c7',
            color: trendPositive ? '#166534' : '#92400e',
          }}
        >
          {trendPositive
            ? <HiArrowTrendingUp className="w-3 h-3" aria-hidden="true" />
            : <HiArrowRight className="w-3 h-3" aria-hidden="true" />}
          {trendLabel}
        </span>
      )}
    </div>
  )
}
