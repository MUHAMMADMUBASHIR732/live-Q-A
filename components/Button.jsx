import Link from "next/link";

// Flat, square buttons. The ones with a hard shadow press down into the page when clicked.
const VARIANTS = {
  primary:
    "border-2 border-ink bg-pine text-paper shadow-[3px_3px_0_0_#22333b] hover:bg-ink active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  secondary:
    "border-2 border-ink bg-sheet text-ink shadow-[3px_3px_0_0_#22333b] hover:bg-sand active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  // For the dark presenter screen.
  sand: "border-2 border-paper bg-sand text-ink shadow-[3px_3px_0_0_#e8e2d3] hover:bg-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  ghost: "border border-ink/60 text-ink hover:bg-ink hover:text-paper",
  ghostDark: "border border-paper/50 text-paper hover:bg-paper hover:text-ink",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5",
  lg: "px-6 py-3.5 text-lg",
};

export default function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes =
    `inline-flex items-center justify-center rounded-[3px] font-semibold tracking-tight ` +
    `transition-[background-color,color,transform,box-shadow] duration-100 ` +
    `disabled:pointer-events-none disabled:opacity-40 ${SIZES[size]} ${VARIANTS[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
