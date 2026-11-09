"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

export default function JoinForm({ className = "" }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) router.push(`/join/${clean}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-stretch gap-2 ${className}`}>
      <label htmlFor="join-code" className="sr-only">
        Join code
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        placeholder="Six-character code"
        autoComplete="off"
        autoCapitalize="characters"
        className="w-44 rounded-[3px] border-2 border-ink bg-sheet px-3 font-mono uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/55"
      />
      <Button type="submit" variant="secondary" disabled={!code.trim()}>
        Join
      </Button>
    </form>
  );
}
