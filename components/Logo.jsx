export default function Logo({ className = "", onDark = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="26" viewBox="0 0 28 24" aria-hidden="true">
        <polygon points="7,0 21,0 28,12 21,24 7,24 0,12" fill="currentColor" />
        <path
          d="M11.2 9.6a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.1"
          fill="none"
          stroke={onDark ? "#22333B" : "#EFF3F1"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="14" cy="17.7" r="1.15" fill="#C7A17A" />
      </svg>
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="font-display text-[1.65rem]">Hexa</span>
        <span className="text-[0.95rem] font-semibold tracking-[0.04em]">AskBoard</span>
      </span>
    </span>
  );
}
