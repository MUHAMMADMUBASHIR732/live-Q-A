// Just a wordmark. No symbol.
export default function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 leading-none ${className}`}>
      <span className="text-[1.7rem] font-bold tracking-tighter">Hexa</span>
      <span className="text-lg font-medium tracking-tight">AskBoard</span>
    </span>
  );
}
