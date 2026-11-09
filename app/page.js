import Logo from "@/components/Logo";
import Button from "@/components/Button";
import JoinForm from "@/components/JoinForm";
import ScanButton from "@/components/ScanButton";
import NegativeHeading from "@/components/NegativeHeading";
import DemoBoard from "@/components/DemoBoard";
import PrivateReplyDemo from "@/components/PrivateReplyDemo";
import Warmup from "@/components/Warmup";

const STEPS = [
  {
    title: "Put the code on screen.",
    text: "You get a QR code and a six-character code. Show them on a slide, or print them for the tables.",
  },
  {
    title: "People ask and vote.",
    text: "Anyone can ask, with a name or without. Each person gets one vote per question. No accounts and no app to install.",
  },
  {
    title: "You choose what to answer.",
    text: "Answer out loud, pin a question, tick it off, or reply to one person privately with a message and a file.",
  },
];

const INSIDE = [
  ["A scanner built in", "The site opens the phone or tablet camera by itself. A six-character code works too."],
  ["A board that stays current", "Questions and votes show up as they happen. Without live updates the page checks every few seconds."],
  ["Spam out, topics in", "Obvious spam is hidden and similar questions share a short label. A real AI model is optional."],
  ["Private replies with files", "Text and any kind of file, up to 4 MB together. Pasting a screenshot works."],
  ["One-click summary", "When the talk ends, turn the board into a short list of what people asked about."],
  ["No sign-up", "Nobody has an account. People are anonymous unless they type a name."],
];

export default function Home() {
  return (
    <>
      <Warmup />

      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-5">
            <a href="#how" className="hidden text-sm font-medium underline-offset-4 hover:underline md:block">
              How it works
            </a>
            <a href="#private" className="hidden text-sm font-medium underline-offset-4 hover:underline md:block">
              Private replies
            </a>
            <ScanButton variant="ghost" size="sm">
              Scan a code
            </ScanButton>
            <Button href="/create" size="sm">
              Start a session
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <NegativeHeading
              lines={["Let the room ask.", "Hear the best", "questions first."]}
              className="text-[3.2rem] font-bold leading-[0.92] tracking-tighter sm:text-7xl lg:text-[5.4rem]"
            />
            <span
              aria-hidden="true"
              className="draw mt-6 block h-[3px] w-24 bg-pine"
              style={{ animationDelay: "1.4s" }}
            />
            <p className="mt-6 max-w-[48ch] text-lg">
              Hexa AskBoard is a live Q&amp;A page for talks, classes and meetings. People scan a
              code, type a question and vote on the ones they want answered. You see the best ones
              first, and you can answer anyone privately, even with a file.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href="/create" size="lg">
                Start a session
              </Button>
              <ScanButton size="lg">Scan a code</ScanButton>
            </div>
            <p className="mt-6 text-sm text-ink/80">Already have a code? Type it here.</p>
            <JoinForm className="mt-2" />
          </div>

          <DemoBoard />
        </section>

        <section id="how" className="scroll-mt-4 border-y-2 border-ink">
          <div className="mx-auto max-w-6xl">
            <h2 className="px-5 pt-10 text-4xl font-bold tracking-tighter sm:px-8 sm:text-5xl">How it works</h2>
            <div className="mt-8 grid md:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.title}
                  className="border-t-2 border-ink p-6 sm:px-8 md:border-r-2 md:last:border-r-0"
                >
                  <h3 className="text-2xl font-bold leading-tight tracking-tight">{step.title}</h3>
                  <p className="mt-3 max-w-[36ch]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="private" className="scroll-mt-4 border-b-2 border-ink bg-sand">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <h2 className="max-w-[18ch] text-4xl font-bold leading-[0.98] tracking-tighter sm:text-6xl">
              Answer one person without the whole room watching.
            </h2>
            <p className="mt-5 max-w-[60ch] text-lg">
              Pick a question and reply with text and any file. It goes only to the device that
              asked. The board, the audience and the screen behind you never show it.
            </p>
            <div className="mt-10">
              <PrivateReplyDemo />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl">What is inside</h2>
          <dl className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
            {INSIDE.map(([term, description]) => (
              <div key={term} className="border-t-2 border-ink pt-3">
                <dt className="text-xl font-bold tracking-tight">{term}</dt>
                <dd className="mt-1 max-w-[52ch]">{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-y-2 border-ink bg-pine text-paper">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-12 sm:px-8">
            <h2 className="max-w-[20ch] text-4xl font-bold leading-[0.98] tracking-tighter sm:text-5xl">
              Try it at your next talk.
            </h2>
            <Button href="/create" variant="sand" size="lg">
              Start a session
            </Button>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm sm:px-8">
        <Logo />
        <p className="text-ink/80">A free live Q&amp;A tool for talks, classes and meetings.</p>
      </footer>
    </>
  );
}
