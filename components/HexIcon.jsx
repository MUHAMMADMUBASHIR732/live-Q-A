// A flat-top hexagon frame. The hexagon is the brand motif.
const POINTS = "25,0 75,0 100,43.5 75,87 25,87 0,43.5";

const TONES = {
  outline: { fill: "transparent", stroke: "rgba(34,51,59,0.28)", text: "text-ink" },
  ink: { fill: "#22333B", stroke: "#22333B", text: "text-paper" },
  sand: { fill: "#C7A17A", stroke: "#C7A17A", text: "text-ink" },
  sage: { fill: "rgba(94,139,126,0.2)", stroke: "rgba(94,139,126,0.75)", text: "text-ink" },
  dark: { fill: "rgba(239,243,241,0.07)", stroke: "rgba(239,243,241,0.3)", text: "text-paper" },
};

export default function HexIcon({ children, size = 56, tone = "outline", className = "" }) {
  const t = TONES[tone];
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${t.text} ${className}`}
      style={{ width: size, height: size * 0.87 }}
    >
      <svg viewBox="0 0 100 87" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <polygon
          points={POINTS}
          fill={t.fill}
          stroke={t.stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative flex items-center justify-center">{children}</span>
    </span>
  );
}
