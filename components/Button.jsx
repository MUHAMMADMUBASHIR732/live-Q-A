import Link from "next/link";

// A pill button with a colour that sweeps up from the bottom on hover.
const VARIANTS = {
  // Dark button on a light page. Sand sweeps in.
  primary: { shell: "bg-ink text-paper hover:text-ink", fill: "bg-sand" },
  // Outlined button on a light page. Ink sweeps in.
  outline: { shell: "border border-ink/80 text-ink hover:text-paper", fill: "bg-ink" },
  // Outlined button on the dark presenter screen. Paper sweeps in.
  ghostDark: { shell: "border border-paper/30 text-paper hover:text-ink", fill: "bg-paper" },
  // Sand button on a dark background. Paper sweeps in.
  sand: { shell: "bg-sand text-ink", fill: "bg-paper" },
};

const SIZES = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5",
  lg: "px-7 py-3.5 text-lg",
};

export default function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const v = VARIANTS[variant];
  const classes =
    `group relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium tracking-tight ` +
    `transition-[color,transform,box-shadow] duration-300 active:scale-[0.96] ` +
    `disabled:cursor-not-allowed disabled:opacity-40 ${SIZES[size]} ${v.shell} ${className}`;

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`absolute inset-0 translate-y-full rounded-[inherit] transition-transform duration-300 ease-out group-hover:translate-y-0 group-disabled:translate-y-full ${v.fill}`}
      />
      <span className="relative">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
}
