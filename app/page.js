import Logo from "@/components/Logo";
import Button from "@/components/Button";
import JoinForm from "@/components/JoinForm";
import NegativeHeading from "@/components/NegativeHeading";
import DemoBoard from "@/components/DemoBoard";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";

const STEPS = [
  {
    title: "Scan to join",
    text: "Put the QR code on your screen. Phones open the page straight away, with no account and no app.",
    icon: (
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="4" width="9" height="9" rx="2" />
        <rect x="19" y="4" width="9" height="9" rx="2" />
        <rect x="4" y="19" width="9" height="9" rx="2" />
        <path d="M19 19h3v3h-3zM25 19h3M19 25h3M25 25h3v3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Ask and upvote",
    text: "Everyone can post a question and give each question one vote. The best ones rise to the top.",
    icon: (
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M5 8a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H15l-6 5v-5H8a3 3 0 0 1-3-3z" strokeLinejoin="round" />
        <path d="M12 16l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Answer what matters",
    text: "Questions are grouped by topic and sorted by votes. Finish with a summary of what the room asked.",
    icon: (
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 9h20M6 16h14M6 23h9" strokeLinecap="round" />
        <circle cx="25" cy="22" r="4" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-5">
            <a
              href="#how"
              className="relative hidden px-1 py-2 text-sm font-medium after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-sand after:transition-transform after:duration-300 hover:after:scale-x-100 sm:block"
            >
              How it works
            </a>
            <Button href="/create" variant="outline" size="sm">
              Start a session
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <NegativeHeading
              lines={["Let the room ask.", "Hear the best", "questions first."]}
              className="font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.25rem]"
            />
            <span
              aria-hidden="true"
              className="draw mt-6 block h-1 w-24 rounded-full bg-sand"
              style={{ animationDelay: "1.5s" }}
            />
            <p
              className="settle mt-6 max-w-[46ch] text-lg text-ink/80"
              style={{ "--i": 0 }}
            >
              Your audience scans a QR code, posts questions, and upvotes the ones they care about.
              Spam is hidden and similar questions are grouped, so the top of your board is worth
              answering.
            </p>

            <div className="settle mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--i": 1 }}>
              <Button href="/create" size="lg">
                Start a session
              </Button>
              <JoinForm />
            </div>
            <p className="settle mt-4 text-sm text-ink/70" style={{ "--i": 2 }}>
              Free to use. Your audience needs no account and no app.
            </p>
          </div>

          <DemoBoard />
        </section>

        <Marquee />

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps from silence to a sorted board
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 130}>
                <div className="group h-full cursor-default border-l-2 border-sage pl-5 transition-[border-color,transform] duration-300 hover:translate-x-1 hover:border-sand">
                  <span className="inline-block text-sage transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:text-ink">
                    {step.icon}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 max-w-[34ch] text-ink/80">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
          <Reveal>
            <div className="group relative overflow-hidden rounded-3xl bg-ink px-7 py-12 text-paper sm:px-12 sm:py-16">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sage/30 transition-transform duration-700 group-hover:scale-125"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-sand/40 transition-transform duration-700 group-hover:-translate-y-4"
              />
              <div className="relative max-w-xl">
                <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Your next event deserves better questions.
                </h2>
                <p className="mt-4 text-lg text-paper/80">
                  Create a session in under a minute and share the code.
                </p>
                <div className="mt-8">
                  <Button href="/create" variant="sand" size="lg">
                    Start a session
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-8 text-sm text-ink/65 sm:px-8">
        Askboard is a free live Q&amp;A tool for events and classes.
      </footer>
    </>
  );
}
