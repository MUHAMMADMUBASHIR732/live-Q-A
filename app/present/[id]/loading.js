import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="min-h-dvh bg-ink" aria-busy="true">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-80 w-full opacity-30" />
          <Skeleton className="h-20 w-full opacity-30" />
        </div>
        <div>
          <Skeleton className="h-14 w-2/3 opacity-30" />
          <Skeleton className="mt-8 h-24 w-full opacity-30" />
          <Skeleton className="mt-3 h-24 w-full opacity-30" />
        </div>
      </div>
      <p className="sr-only">Loading the board</p>
    </main>
  );
}
