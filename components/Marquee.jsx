const ITEMS = [
  "Classes",
  "Meetups",
  "Webinars",
  "All-hands",
  "Conferences",
  "Workshops",
  "Town halls",
  "Lectures",
];

// A slow ticker of places Askboard is useful. Pauses on hover.
export default function Marquee() {
  const group = (hidden) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-10">
          <span className="font-display text-3xl font-semibold tracking-tight text-ink/80 transition-colors duration-300 hover:text-sage sm:text-4xl">
            {item}
          </span>
          <span className="h-2 w-2 rounded-full bg-sand" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee overflow-hidden border-y border-ink/15 py-5">
      <div className="marquee-track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
