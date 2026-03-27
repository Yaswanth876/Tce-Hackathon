// src/components/landing/FeatureCard.jsx
// ─────────────────────────────────────────────────────────────
// Impact feature card: icon bubble + title + description.
// Used in the AI Capabilities section.
// ─────────────────────────────────────────────────────────────

export default function FeatureCard({ icon, title, description, accent = 'var(--color-gov-700)' }) {
  return (
    <div className="gov-card rounded-xl p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group" style={{ border: '2px solid var(--color-gov-800, #1e3a5f)' }}>
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `color-mix(in srgb, ${accent} 10%, white)`, border: `1.5px solid color-mix(in srgb, ${accent} 20%, white)` }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="text-base font-bold leading-snug"
        style={{ color: 'var(--color-gov-800)' }}
      >
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--color-text-soft)] leading-relaxed">
        {description}
      </p>

      {/* Accent bar */}
      <div
        className="h-0.5 w-10 rounded-full mt-auto transition-all duration-300 group-hover:w-16"
        style={{ background: accent }}
      />
    </div>
  )
}
