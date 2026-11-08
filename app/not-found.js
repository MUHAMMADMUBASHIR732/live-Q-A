import Link from "next/link";
import Logo from "@/components/Logo";
import JoinForm from "@/components/JoinForm";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-10">
      <Link href="/" aria-label="Askboard home">
        <Logo />
      </Link>
      <h1 className="mt-10 font-display text-4xl font-semibold tracking-tight">
        We could not find that session
      </h1>
      <p className="mt-3 text-ink/80">
        Check the join code with the presenter. It has six characters, for example K7M2QX.
      </p>
      <div className="mt-6">
        <JoinForm />
      </div>
      <Link
        href="/"
        className="mt-8 w-fit text-sm underline decoration-sand decoration-2 underline-offset-4 transition-[text-underline-offset] hover:underline-offset-8"
      >
        Back to the home page
      </Link>
    </main>
  );
}
