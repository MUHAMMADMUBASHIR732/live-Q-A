import Link from "next/link";
import Logo from "@/components/Logo";
import JoinForm from "@/components/JoinForm";
import HexIcon from "@/components/HexIcon";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-10">
      <Link href="/" aria-label="Hexa AskBoard home" className="w-fit">
        <Logo />
      </Link>
      <div className="mt-12">
        <HexIcon size={64} tone="outline">
          <span className="font-mono text-lg">404</span>
        </HexIcon>
      </div>
      <h1 className="mt-6 font-display text-5xl leading-[1]">We could not find that session</h1>
      <p className="mt-4 text-lg text-ink/80">
        Check the join code with the presenter. It has six characters, for example K7M2QX.
      </p>
      <div className="mt-7">
        <JoinForm />
      </div>
      <Link
        href="/"
        className="mt-9 w-fit text-sm underline decoration-sand decoration-2 underline-offset-4 transition-[text-underline-offset] hover:underline-offset-8"
      >
        Back to the home page
      </Link>
    </main>
  );
}
