// A plain status dot. No pulsing.
export default function LiveDot({ closed = false, onDark = false }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 rounded-full ${
        closed ? "bg-current opacity-40" : onDark ? "bg-sand" : "bg-pine"
      }`}
    />
  );
}
