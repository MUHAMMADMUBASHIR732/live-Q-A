"use client";

import { useRouter } from "next/navigation";
import QrScanner from "@/components/QrScanner";

// A full-screen scanner at its own address, handy for a home-screen shortcut.
export default function ScanPage() {
  const router = useRouter();
  return (
    <main className="h-dvh">
      <QrScanner onClose={() => router.push("/")} onCode={(code) => router.replace(`/join/${code}`)} />
    </main>
  );
}
