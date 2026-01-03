interface MascotProps {
  size?: number
  className?: string
}

export function Mascot({ size = 64, className = '' }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Chameleon - "Rudy the Resolver" */}

      {/* Tail - curled like a data spiral */}
      <rect x="2" y="22" width="2" height="2" fill="#22c55e" />
      <rect x="4" y="24" width="2" height="2" fill="#22c55e" />
      <rect x="6" y="24" width="2" height="2" fill="#16a34a" />
      <rect x="8" y="22" width="2" height="2" fill="#16a34a" />
      <rect x="8" y="20" width="2" height="2" fill="#15803d" />
      <rect x="6" y="20" width="2" height="2" fill="#22c55e" />

      {/* Back legs */}
      <rect x="12" y="24" width="2" height="4" fill="#15803d" />
      <rect x="10" y="26" width="2" height="2" fill="#166534" />
      <rect x="14" y="26" width="2" height="2" fill="#166534" />

      {/* Body - with data pattern texture */}
      <rect x="10" y="14" width="12" height="10" fill="#22c55e" />
      <rect x="10" y="14" width="2" height="2" fill="#16a34a" />
      <rect x="14" y="14" width="2" height="2" fill="#16a34a" />
      <rect x="18" y="14" width="2" height="2" fill="#16a34a" />
      <rect x="12" y="16" width="2" height="2" fill="#4ade80" />
      <rect x="16" y="16" width="2" height="2" fill="#4ade80" />
      <rect x="20" y="16" width="2" height="2" fill="#16a34a" />
      <rect x="10" y="18" width="2" height="2" fill="#16a34a" />
      <rect x="14" y="18" width="2" height="2" fill="#4ade80" />
      <rect x="18" y="18" width="2" height="2" fill="#16a34a" />
      <rect x="12" y="20" width="2" height="2" fill="#16a34a" />
      <rect x="16" y="20" width="2" height="2" fill="#16a34a" />
      <rect x="20" y="20" width="2" height="2" fill="#4ade80" />

      {/* Body underside */}
      <rect x="10" y="22" width="12" height="2" fill="#15803d" />

      {/* Front legs */}
      <rect x="20" y="22" width="2" height="4" fill="#15803d" />
      <rect x="18" y="24" width="2" height="2" fill="#166534" />
      <rect x="22" y="24" width="2" height="2" fill="#166534" />

      {/* Neck */}
      <rect x="20" y="10" width="4" height="4" fill="#22c55e" />
      <rect x="22" y="10" width="2" height="2" fill="#4ade80" />

      {/* Head - distinctive chameleon shape */}
      <rect x="22" y="6" width="6" height="8" fill="#22c55e" />
      <rect x="24" y="4" width="4" height="2" fill="#22c55e" />
      <rect x="26" y="6" width="2" height="2" fill="#4ade80" />

      {/* Crest/ridge on head */}
      <rect x="22" y="4" width="2" height="2" fill="#16a34a" />
      <rect x="20" y="6" width="2" height="2" fill="#16a34a" />

      {/* Eye - large and expressive */}
      <rect x="24" y="8" width="4" height="4" fill="#fef3c7" />
      <rect x="26" y="8" width="2" height="2" fill="#ffffff" />
      <rect x="24" y="10" width="2" height="2" fill="#1e293b" />

      {/* Snout */}
      <rect x="28" y="10" width="2" height="4" fill="#16a34a" />
      <rect x="28" y="12" width="2" height="2" fill="#15803d" />

      {/* Small "R" on body - represents R code */}
      <rect x="14" y="15" width="1" height="3" fill="#166534" opacity="0.6" />
      <rect x="15" y="15" width="1" height="1" fill="#166534" opacity="0.6" />
      <rect x="15" y="17" width="1" height="1" fill="#166534" opacity="0.6" />

      {/* Data points floating near tail */}
      <rect x="4" y="20" width="1" height="1" fill="#4ade80" opacity="0.7" />
      <rect x="2" y="18" width="1" height="1" fill="#22c55e" opacity="0.5" />
      <rect x="6" y="17" width="1" height="1" fill="#86efac" opacity="0.6" />
    </svg>
  )
}
