// src/components/landing/BeforeAfterCard.jsx
// ─────────────────────────────────────────────────────────────
// Comparison card: "Before Cleanup" vs "After Cleanup".
// Uses real web images to represent sanitation transformation.
// ─────────────────────────────────────────────────────────────
import { HiExclamationTriangle, HiCheckBadge } from 'react-icons/hi2'

// Local images — place your files at Aqro /public/images/before.png and after.png
const BEFORE_IMG = '/images/before.png'
const AFTER_IMG  = '/images/after.png'

function BeforeIllustration() {
  return (
    <img
      src={BEFORE_IMG}
      alt="Before cleanup: littered Madurai street with accumulated waste"
      className="w-full h-full object-cover"
      loading="lazy"
    />
  )
}

// Dead code — replaced by <img>
function _BeforeIllustrationSVG_UNUSED() {
  return (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-label="Before cleanup: littered street scene">
      {/* Sky */}
      <rect width="280" height="180" fill="#c8d8e8" />
      {/* Ground */}
      <rect y="120" width="280" height="60" fill="#8b7355" />
      {/* Road */}
      <rect y="130" width="280" height="30" fill="#6b6b6b" />
      {/* Road markings — dashed */}
      <rect x="20" y="143" width="30" height="4" fill="#e0e0e0" opacity="0.6" rx="2" />
      <rect x="70" y="143" width="30" height="4" fill="#e0e0e0" opacity="0.6" rx="2" />
      <rect x="130" y="143" width="30" height="4" fill="#e0e0e0" opacity="0.6" rx="2" />
      <rect x="190" y="143" width="30" height="4" fill="#e0e0e0" opacity="0.6" rx="2" />
      <rect x="240" y="143" width="30" height="4" fill="#e0e0e0" opacity="0.6" rx="2" />
      {/* Footpath */}
      <rect y="120" width="280" height="10" fill="#a09070" />
      {/* Building */}
      <rect x="10" y="40" width="70" height="80" fill="#b0a090" />
      <rect x="15" y="50" width="15" height="15" fill="#7090a0" />
      <rect x="38" y="50" width="15" height="15" fill="#7090a0" />
      <rect x="61" y="50" width="15" height="15" fill="#7090a0" />
      <rect x="15" y="75" width="15" height="15" fill="#7090a0" />
      <rect x="38" y="75" width="15" height="15" fill="#7090a0" />
      <rect x="61" y="75" width="15" height="15" fill="#7090a0" />
      {/* Rubbish pile 1 */}
      <ellipse cx="110" cy="124" rx="18" ry="8" fill="#6b5e3a" />
      <ellipse cx="108" cy="121" rx="12" ry="6" fill="#8b7e4a" />
      {/* Scattered waste items */}
      <rect x="140" y="122" width="8" height="5" fill="#e74c3c" rx="1" />
      <rect x="160" y="125" width="12" height="4" fill="#3498db" rx="1" />
      <circle cx="185" cy="123" r="4" fill="#f39c12" />
      <rect x="200" y="121" width="6" height="6" fill="#2ecc71" rx="1" />
      {/* Overflowing bin */}
      <rect x="220" y="100" width="20" height="25" fill="#555" rx="2" />
      <ellipse cx="230" cy="100" rx="12" ry="5" fill="#444" />
      {/* Overflow waste */}
      <ellipse cx="226" cy="97" rx="8" ry="4" fill="#6b5e3a" opacity="0.9" />
      <rect x="222" y="93" width="5" height="4" fill="#e74c3c" rx="1" />
      <rect x="230" y="92" width="6" height="3" fill="#f39c12" rx="1" />
      {/* Broken drain */}
      <rect x="50" y="120" width="30" height="4" fill="#555" />
      <rect x="55" y="118" width="4" height="6" fill="#333" />
      <rect x="63" y="118" width="4" height="6" fill="#333" />
      <rect x="71" y="118" width="4" height="6" fill="#333" />
      {/* Pollution smoke */}
      <ellipse cx="185" cy="90" rx="14" ry="8" fill="#aaaaaa" opacity="0.5" />
      <ellipse cx="195" cy="80" rx="10" ry="6" fill="#aaaaaa" opacity="0.4" />
      <ellipse cx="180" cy="72" rx="8" ry="5" fill="#aaaaaa" opacity="0.3" />
      {/* Stagnant water puddle */}
      <ellipse cx="155" cy="127" rx="20" ry="6" fill="#7a9aaa" opacity="0.6" />
    </svg>
  )
}

function AfterIllustration() {
  return (
    <img
      src={AFTER_IMG}
      alt="After cleanup: Meenakshi Amman Temple — clean, restored Madurai landmark"
      className="w-full h-full object-cover"
      loading="lazy"
    />
  )
}

// Dead code — replaced by <img>
function _AfterIllustrationSVG_UNUSED() {
  return (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-label="After cleanup: clean street scene">
      {/* Sky */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87ceeb" />
          <stop offset="100%" stopColor="#c8e8f8" />
        </linearGradient>
      </defs>
      <rect width="280" height="180" fill="url(#skyGrad)" />
      {/* Sun */}
      <circle cx="240" cy="30" r="18" fill="#FFD700" opacity="0.9" />
      <line x1="240" y1="6" x2="240" y2="2" stroke="#FFD700" strokeWidth="2" />
      <line x1="258" y1="12" x2="261" y2="9" stroke="#FFD700" strokeWidth="2" />
      <line x1="264" y1="30" x2="268" y2="30" stroke="#FFD700" strokeWidth="2" />
      <line x1="258" y1="48" x2="261" y2="51" stroke="#FFD700" strokeWidth="2" />
      {/* Clouds */}
      <ellipse cx="60" cy="25" rx="22" ry="10" fill="white" opacity="0.8" />
      <ellipse cx="80" cy="20" rx="18" ry="10" fill="white" opacity="0.8" />
      <ellipse cx="100" cy="25" rx="16" ry="9" fill="white" opacity="0.8" />
      {/* Ground */}
      <rect y="120" width="280" height="60" fill="#7ab648" />
      {/* Road — clean */}
      <rect y="130" width="280" height="30" fill="#808080" />
      {/* Road markings */}
      <rect x="20" y="143" width="30" height="4" fill="#fff" opacity="0.7" rx="2" />
      <rect x="70" y="143" width="30" height="4" fill="#fff" opacity="0.7" rx="2" />
      <rect x="130" y="143" width="30" height="4" fill="#fff" opacity="0.7" rx="2" />
      <rect x="190" y="143" width="30" height="4" fill="#fff" opacity="0.7" rx="2" />
      <rect x="240" y="143" width="30" height="4" fill="#fff" opacity="0.7" rx="2" />
      {/* Footpath — clean */}
      <rect y="120" width="280" height="10" fill="#c8b89a" />
      {/* Building — repainted */}
      <rect x="10" y="40" width="70" height="80" fill="#e8d8c8" />
      <rect x="15" y="50" width="15" height="15" fill="#88aac0" />
      <rect x="38" y="50" width="15" height="15" fill="#88aac0" />
      <rect x="61" y="50" width="15" height="15" fill="#88aac0" />
      <rect x="15" y="75" width="15" height="15" fill="#88aac0" />
      <rect x="38" y="75" width="15" height="15" fill="#88aac0" />
      <rect x="61" y="75" width="15" height="15" fill="#88aac0" />
      {/* Trees */}
      <rect x="105" y="95" width="6" height="28" fill="#8b5e3c" />
      <circle cx="108" cy="85" r="18" fill="#3ab04a" />
      <circle cx="100" cy="78" r="10" fill="#4cc05a" />
      <circle cx="118" cy="80" r="11" fill="#3ab04a" />
      {/* Bench */}
      <rect x="140" y="113" width="30" height="4" fill="#8b6914" rx="1" />
      <rect x="142" y="117" width="4" height="6" fill="#6b4a10" />
      <rect x="163" y="117" width="4" height="6" fill="#6b4a10" />
      {/* Clean waste bins */}
      <rect x="200" y="100" width="18" height="22" fill="#138808" rx="3" />
      <rect x="200" y="98" width="18" height="5" fill="#0f6b06" rx="2" />
      <text x="209" y="114" textAnchor="middle" fontSize="8" fill="white">♻</text>
      {/* Flower beds */}
      <ellipse cx="250" cy="122" rx="18" ry="5" fill="#5ab83a" />
      <circle cx="244" cy="119" r="3" fill="#e74c3c" />
      <circle cx="252" cy="117" r="3" fill="#f39c12" />
      <circle cx="259" cy="119" r="3" fill="#9b59b6" />
      <circle cx="248" cy="115" r="3" fill="#e91e63" />
      {/* Clean drain cover */}
      <rect x="50" y="120" width="30" height="4" fill="#888" />
      <rect x="55" y="120" width="2" height="4" fill="#666" />
      <rect x="63" y="120" width="2" height="4" fill="#666" />
      <rect x="71" y="120" width="2" height="4" fill="#666" />
      {/* Checkmark badge overlay */}
      <circle cx="248" cy="52" r="14" fill="#138808" opacity="0.9" />
      <polyline points="241,52 246,57 255,46" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default function BeforeAfterCard({ type }) {
  const isBefore = type === 'before'

  return (
    <div
      className="gov-card rounded-xl overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-xl"
      style={{ borderTop: `3px solid ${isBefore ? '#D97706' : '#138808'}` }}
    >
      {/* Header bar */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{
          background: isBefore
            ? 'linear-gradient(to right, #fef3c7, #fef9ee)'
            : 'linear-gradient(to right, #dcfce7, #f0fdf4)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: isBefore ? '#D97706' : '#138808' }}
          aria-hidden="true"
        />
        <span
          className="text-sm font-bold tracking-wide uppercase"
          style={{ color: isBefore ? '#92400e' : '#14532d' }}
        >
          {isBefore ? 'Before Cleanup' : 'After Cleanup'}
        </span>
        <span className="ml-auto" aria-hidden="true">
          {isBefore
            ? <HiExclamationTriangle className="w-4 h-4" style={{ color: '#D97706' }} />
            : <HiCheckBadge className="w-4 h-4" style={{ color: '#138808' }} />
          }
        </span>
      </div>

      {/* Illustration */}
      <div className="aspect-video w-full bg-[#f0f4f8] overflow-hidden">
        {isBefore ? <BeforeIllustration /> : <AfterIllustration />}
      </div>

      {/* Caption */}
      <div className="px-4 py-3">
        <p
          className="text-xs leading-relaxed"
          style={{ color: isBefore ? '#92400e' : '#14532d' }}
        >
          {isBefore
            ? 'Unattended waste accumulation, clogged drains, and public health hazards on Madurai\'s streets — reported by citizens.'
            : 'Swift municipal response restores Madurai\'s civic spaces. The Meenakshi Temple precinct: adjudged India\'s Best Swachh Iconic Place in 2017.'}
        </p>
      </div>
    </div>
  )
}
