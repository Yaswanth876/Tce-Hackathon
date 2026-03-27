// src/components/Button.jsx
// --------------------------------------------------
// Reusable button with variant, size & loading state.
// Tamil Nadu Government official design style.
// Glassy finish with orange on active/click state.
// Variants: "primary" | "secondary" | "ghost" | "danger"
// Sizes: "sm" | "md" | "lg"
// --------------------------------------------------

const VARIANTS = {
    // White bg + blue border → blue bg on hover
    primary: [
        'bg-white text-[#104080] border border-[#104080]',
        'shadow-[0_2px_8px_rgba(16,64,128,0.12)]',
        'hover:bg-[#104080] hover:text-white hover:border-[#104080] hover:-translate-y-px',
        'hover:shadow-[0_6px_18px_rgba(16,64,128,0.30)]',
        'active:!bg-[#0a3468] active:!border-[#0a3468] active:translate-y-0 active:scale-[0.99]',
    ].join(' '),

    // White bg + blue border → blue bg on hover
    secondary: [
        'bg-white text-[#104080] border border-[#104080]',
        'shadow-[0_2px_8px_rgba(16,64,128,0.08)]',
        'hover:bg-[#104080] hover:text-white hover:-translate-y-px',
        'hover:shadow-[0_4px_14px_rgba(16,64,128,0.22)]',
        'active:!bg-[#0a3468] active:!border-[#0a3468] active:translate-y-0 active:scale-[0.99]',
    ].join(' '),

    ghost: [
        'bg-white text-[#104080] border border-[#104080]/50',
        'hover:bg-[#104080] hover:text-white hover:border-[#104080] hover:-translate-y-px',
        'active:!bg-[#0a3468] active:translate-y-0 active:scale-[0.99]',
    ].join(' '),

    danger: [
        'bg-white text-[#B22222] border border-[#B22222]',
        'shadow-[0_2px_8px_rgba(178,34,34,0.12)]',
        'hover:bg-[#B22222] hover:text-white hover:-translate-y-px',
        'hover:shadow-[0_4px_14px_rgba(178,34,34,0.28)]',
        'active:!bg-[#8b1a1a] active:!border-[#8b1a1a] active:translate-y-0 active:scale-[0.99]',
    ].join(' '),
}

const SIZES = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    ...props
}) {
    return (
        <button
            disabled={loading || props.disabled}
            className={[
                'inline-flex items-center justify-center gap-2 rounded-md font-semibold',
                'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
                'relative overflow-hidden',
                VARIANTS[variant] ?? VARIANTS.primary,
                SIZES[size] ?? SIZES.md,
                className,
            ].join(' ')}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                    />
                </svg>
            )}
            {children}
        </button>
    )
}
