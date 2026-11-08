// A flat-top hexagon lattice (matching the logo and icons) drawn as a repeating SVG pattern.
// The colour comes from the text colour.
export default function HexGrid({ id = "hex", size = 26, className = "" }) {
  const s = size;
  const h = Math.sqrt(3) * s; // height of one flat-top hexagon
  const w = 3 * s; // one repeat is two columns wide
  const hex = (cx, cy) =>
    [
      [cx - s, cy],
      [cx - s / 2, cy - h / 2],
      [cx + s / 2, cy - h / 2],
      [cx + s, cy],
      [cx + s / 2, cy + h / 2],
      [cx - s / 2, cy + h / 2],
    ]
      .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");

  // Hexagons that touch the tile, so the pattern repeats without seams.
  const centers = [
    [s, h / 2],
    [2.5 * s, 0],
    [2.5 * s, h],
    [-0.5 * s, 0],
    [-0.5 * s, h],
  ];

  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          {centers.map(([cx, cy], i) => (
            <polygon key={i} points={hex(cx, cy)} fill="none" stroke="currentColor" strokeWidth="1" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
