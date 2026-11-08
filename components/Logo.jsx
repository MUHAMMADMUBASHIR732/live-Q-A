export default function Logo({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight ${className}`}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect width="26" height="26" rx="8" fill="currentColor" />
        <circle cx="9" cy="10" r="2.6" fill="#C7A17A" />
        <rect x="8" y="15" width="11" height="3" rx="1.5" fill="#5E8B7E" />
      </svg>
      Askboard
    </span>
  );
}
