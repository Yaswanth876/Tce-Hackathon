// src/components/landing/TimelineStep.jsx
// ─────────────────────────────────────────────────────────────
// A single step in the process timeline.
// `isLast` controls whether the connector line is rendered.
// ─────────────────────────────────────────────────────────────

export default function TimelineStep({ step, icon, title, description, isLast = false }) {
  return (
    <div className="flex flex-col items-center text-center flex-1 min-w-0 relative">
      {/* Connector line (hidden on last step) */}
      {!isLast && (
        <div
          className="hidden md:block absolute top-6 left-[calc(50%+2rem)] right-[calc(-50%+2rem)] h-px"
          style={{ background: 'linear-gradient(to right, var(--color-gov-400), var(--color-gov-100))' }}
          aria-hidden="true"
        />
      )}

      {/* Step circle */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-md flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--color-gov-600), var(--color-gov-800))' }}
          aria-hidden="true"
        >
          {icon}
        </div>

        {/* Step badge */}
        <span
          className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: 'var(--color-gov-50)', color: 'var(--color-gov-700)', border: '1px solid var(--color-gov-100)' }}
        >
          Step {step}
        </span>
      </div>

      {/* Text */}
      <div className="mt-3 px-2">
        <h4 className="text-sm font-bold text-[var(--color-gov-800)] mb-1">{title}</h4>
        <p className="text-xs text-[var(--color-text-soft)] leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
