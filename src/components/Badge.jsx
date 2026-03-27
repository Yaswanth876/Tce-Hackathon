// src/components/Badge.jsx
// -------------------------------------------------------
// Status badge — Tamil Nadu Government official style.
// Flat design with subtle border and formal color coding.
// -------------------------------------------------------

const STATUS_MAP = {
    pending: {
        label: 'Pending',
        style: { background: '#FEF3C7', color: '#78350F', border: '1px solid #FCD34D' },
    },
    inprogress: {
        label: 'In Progress',
        style: { background: '#DBEAFE', color: '#1E3A8A', border: '1px solid #93C5FD' },
    },
    resolved: {
        label: 'Resolved',
        style: { background: '#DCFCE7', color: '#14532D', border: '1px solid #86EFAC' },
    },
    rejected: {
        label: 'Rejected',
        style: { background: '#FEE2E2', color: '#7F1D1D', border: '1px solid #FCA5A5' },
    },
}

export default function Badge({ status = 'pending' }) {
    const { label, style } = STATUS_MAP[status] ?? STATUS_MAP.pending
    return (
        <span
            style={style}
            className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
        >
            {label}
        </span>
    )
}
