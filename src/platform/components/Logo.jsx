/* StructuraLens mark: a magnifying lens (focus) whose glass contains a small binary tree (nodes + edges),
   with a signal arc for the optics feel. Inline SVG so it needs no extra request. */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="slg-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="13.5" fill="#0b1020" stroke="url(#slg-ring)" strokeWidth="3" />
      <path d="M28 28 L36.5 36.5" stroke="url(#slg-ring)" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M18 11 L11.5 20 M18 11 L24.5 20 M11.5 20 L8.5 27" stroke="#cdeefb" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="11" r="2.7" fill="#22d3ee" />
      <circle cx="11.5" cy="20" r="2.4" fill="#a78bfa" />
      <circle cx="24.5" cy="20" r="2.4" fill="#a78bfa" />
      <circle cx="8.5" cy="27" r="2" fill="#67e8f9" />
      <path d="M8.5 12.5 A11 11 0 0 1 14 7.2" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
