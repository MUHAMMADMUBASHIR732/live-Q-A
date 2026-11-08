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

// A slow ticker of places Hexa AskBoard is useful. Pauses on hover.
export default function Marquee() {
  const group = (hidden) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-10">
          <span className="font-display text-4xl text-ink/80 transition-colors duration-300 hover:text-sage sm:text-5xl">
            {item}
          </span>
          <svg width="14" height="12" viewBox="0 0 28 24" aria-hidden="true" className="text-sand"><polygon points="7,0 21,0 28,12 21,24 7,24 0,12" fill="currentColor" /></svg>
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
