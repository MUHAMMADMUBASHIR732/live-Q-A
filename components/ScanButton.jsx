"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

// The scanner (and its decoder) only downloads when someone actually opens it.
const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

// A button that opens the camera. When a code is read, it goes straight to that session.
export default function ScanButton({ variant = "secondary", size = "md", className = "", children = "Scan a code" }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Scan a QR code">
          <QrScanner
            onClose={() => setOpen(false)}
            onCode={(code) => {
              setOpen(false);
              router.push(`/join/${code}`);
            }}
          />
        </div>
      )}
    </>
  );
}
