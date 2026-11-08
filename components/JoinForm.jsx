"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

export default function JoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) router.push(`/join/${clean}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <label htmlFor="join-code" className="sr-only">
        Join code
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        placeholder="Join code"
        autoComplete="off"
        autoCapitalize="characters"
        className="w-36 rounded-full border border-ink/30 bg-paper px-4 py-3 font-medium uppercase tracking-widest transition-[border-color,width] duration-300 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/55 hover:border-ink/60 focus:w-44 focus:border-ink"
      />
      <Button type="submit" variant="outline" size="lg" disabled={!code.trim()}>
        Join
      </Button>
    </form>
  );
}
