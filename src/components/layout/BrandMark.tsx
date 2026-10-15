/** The brand mark: one line of history that forks into a dashed alternative. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="62" height="62" rx="3" fill="none" stroke="#8B7355" strokeOpacity="0.7" />
      <path d="M9 40 H30 C40 40 44 40 55 40" stroke="#C6A66A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path
        d="M30 40 C40 40 44 22 55 20"
        stroke="#D08E95"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="4.5 5"
        fill="none"
      />
      <circle cx="30" cy="40" r="4.5" fill="#E8DCC4" />
    </svg>
  );
}
