import Link from "next/link";
import Logo from "@/components/Logo";
import JoinForm from "@/components/JoinForm";
import ScanButton from "@/components/ScanButton";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
      <Link href="/" aria-label="Hexa AskBoard home" className="w-fit">
        <Logo />
      </Link>
      <h1 className="mt-10 text-5xl font-bold leading-[0.95] tracking-tighter">That page does not exist</h1>
      <p className="mt-4 text-lg">If you were looking for a session, check the code with the presenter.</p>
      <div className="mt-6 flex flex-wrap items-stretch gap-3">
        <JoinForm />
        <ScanButton>Scan a code</ScanButton>
      </div>
      <Link href="/" className="mt-8 w-fit text-sm underline underline-offset-4 hover:no-underline">
        Back to the home page
      </Link>
    </main>
  );
}
