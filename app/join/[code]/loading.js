import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 pt-4 sm:px-6" aria-busy="true">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-10 h-10 w-3/4" />
      <Skeleton className="mt-6 h-44 w-full" />
      <Skeleton className="mt-6 h-24 w-full" />
      <Skeleton className="mt-3 h-24 w-full" />
      <p className="sr-only">Loading the session</p>
    </main>
  );
}
