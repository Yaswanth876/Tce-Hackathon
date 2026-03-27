// src/components/StatusBadge.jsx
// ---------------------------------------------------------------
// Pill badge for complaint status with colour semantics:
//   pending     → amber
//   analyzing   → blue
//   dispatched  → indigo
//   cleared     → green
// ---------------------------------------------------------------

const CONFIG = {
  pending:    { bg: 'bg-amber-100',  text: 'text-amber-800',  ring: 'ring-amber-300',  dot: 'bg-amber-500',  label: 'Pending'    },
  analyzing:  { bg: 'bg-blue-100',   text: 'text-blue-800',   ring: 'ring-blue-300',   dot: 'bg-blue-500',   label: 'Analyzing'  },
  dispatched: { bg: 'bg-indigo-100', text: 'text-indigo-800', ring: 'ring-indigo-300', dot: 'bg-indigo-500', label: 'Dispatched' },
  cleared:    { bg: 'bg-green-100',  text: 'text-green-800',  ring: 'ring-green-300',  dot: 'bg-green-500',  label: 'Cleared'    },
}

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? {
    bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-300',
    dot: 'bg-slate-500', label: status ?? 'Unknown',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                      ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
