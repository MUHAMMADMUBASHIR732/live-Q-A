// A small status dot that pulses while the session is live.
export default function LiveDot({ closed = false, onDark = false }) {
  const base = onDark ? "bg-sand" : "bg-sage";
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
      {!closed && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${base}`}
        />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
          closed ? (onDark ? "bg-paper/40" : "bg-ink/40") : base
        }`}
      />
    </span>
  );
}
