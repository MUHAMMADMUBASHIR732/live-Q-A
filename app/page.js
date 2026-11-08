import Logo from "@/components/Logo";
import Button from "@/components/Button";
import JoinForm from "@/components/JoinForm";
import NegativeHeading from "@/components/NegativeHeading";
import DemoBoard from "@/components/DemoBoard";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import HexIcon from "@/components/HexIcon";
import HexGrid from "@/components/HexGrid";
import SpotlightCard from "@/components/SpotlightCard";
import FileBadge from "@/components/FileBadge";
import PrivateReplyDemo from "@/components/PrivateReplyDemo";

const icon = (children) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS = {
  lock: icon(<><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></>),
  bars: icon(<><path d="M5 20V12M12 20V5M19 20v-5" /></>),
  filter: icon(<><path d="M4 6h16M7 12h10M10 18h4" /></>),
  file: icon(<><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /></>),
  scan: icon(<><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M8 12h8" /></>),
  vote: icon(<><path d="M12 19V6M6 12l6-6 6 6" /></>),
  note: icon(<><path d="M5 6h14M5 12h10M5 18h6" /></>),
};

const STEPS = [
  { title: "Scan to join", text: "Put the QR code on your screen. Phones open the page at once, with no account and no app.", icon: ICONS.scan },
  { title: "Ask and upvote", text: "Everyone can post a question and give each question one vote. The best ones rise to the top.", icon: ICONS.vote },
  { title: "Answer what matters", text: "Questions are grouped by topic. Reply on stage, or privately to one person with a file.", icon: ICONS.note },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-6">
            {[["Features", "#features"], ["Private replies", "#private"], ["How it works", "#how"]].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="relative hidden px-1 py-2 text-sm font-medium after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100 md:block"
              >
                {label}
              </a>
            ))}
            <Button href="/create" variant="outline" size="sm">
              Start a session
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[640px] text-ink/[0.09]"
            style={{
              maskImage: "radial-gradient(55% 90% at 90% 0%, black, transparent 80%)",
              WebkitMaskImage: "radial-gradient(55% 90% at 90% 0%, black, transparent 80%)",
            }}
          >
            <HexGrid id="hero-hex" size={34} />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <p className="settle inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/60 px-3.5 py-1.5 text-sm" style={{ "--i": 0 }}>
                <svg width="12" height="10" viewBox="0 0 28 24" aria-hidden="true" className="text-sand">
                  <polygon points="7,0 21,0 28,12 21,24 7,24 0,12" fill="currentColor" />
                </svg>
                Live Q&amp;A with private replies
              </p>

              <NegativeHeading
                lines={["Let the room ask.", "Hear the best", "questions first."]}
                className="mt-6 font-display text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[5.6rem]"
              />
              <span
                aria-hidden="true"
                className="draw mt-7 block h-px w-28 bg-gradient-to-r from-sand to-transparent"
                style={{ animationDelay: "1.5s" }}
              />
              <p className="settle mt-6 max-w-[46ch] text-lg text-ink/80" style={{ "--i": 0 }}>
                Your audience scans a QR code, posts questions, and upvotes the ones they care
                about. Spam is hidden, similar questions are grouped, and you can answer anyone
                privately, with a file.
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
          </div>
        </section>

        <Marquee />

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
          <Reveal>
            <h2 className="max-w-[18ch] font-display text-5xl leading-[1] sm:text-6xl">
              Everything a live room needs
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg text-ink/75">
              Built for classes, meetups, webinars and all-hands. Calm for you, effortless for
              your audience.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-6">
            <Reveal className="md:col-span-2">
              <SpotlightCard dark className="h-full">
                <div className="flex h-full flex-col p-7">
                  <HexIcon size={52} tone="sand">{ICONS.lock}</HexIcon>
                  <h3 className="mt-6 font-display text-3xl leading-tight">Answer one person, privately</h3>
                  <p className="mt-3 text-paper/75">
                    Reply to any question with text and files. Only the person who asked can read
                    it. Everyone else sees nothing.
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    {["Text", "Any file type", "One reader"].map((t) => (
                      <span key={t} className="rounded-full border border-paper/20 px-3 py-1 text-sm">{t}</span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={100} className="md:col-span-2">
              <SpotlightCard className="h-full">
                <div className="p-7">
                  <HexIcon size={52} tone="sage">{ICONS.bars}</HexIcon>
                  <h3 className="mt-6 font-display text-3xl leading-tight">A board that moves with the room</h3>
                  <p className="mt-3 text-ink/75">
                    Votes and new questions appear live, and the list re-orders smoothly as the
                    room decides what matters.
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={200} className="md:col-span-2">
              <SpotlightCard className="h-full">
                <div className="p-7">
                  <HexIcon size={52} tone="sage">{ICONS.filter}</HexIcon>
                  <h3 className="mt-6 font-display text-3xl leading-tight">AI that clears the noise</h3>
                  <p className="mt-3 text-ink/75">
                    Spam is hidden and similar questions are grouped under short topic labels, so
                    the top of your board is worth answering.
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={100} className="md:col-span-3">
              <SpotlightCard className="h-full">
                <div className="grid gap-6 p-7 sm:grid-cols-2">
                  <div>
                    <HexIcon size={52} tone="sage">{ICONS.file}</HexIcon>
                    <h3 className="mt-6 font-display text-3xl leading-tight">Files of any type</h3>
                    <p className="mt-3 text-ink/75">
                      Paste a screenshot, drop a PDF or attach a spreadsheet. Files are delivered
                      to the person you choose.
                    </p>
                  </div>
                  <div className="space-y-2 self-center">
                    <FileBadge name="pricing-sheet.pdf" size={245760} />
                    <FileBadge name="launch-slides.pptx" size={3250585} />
                    <FileBadge name="raw-data.zip" size={1258291} />
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>

            <Reveal delay={200} className="md:col-span-3">
              <SpotlightCard className="h-full">
                <div className="grid gap-6 p-7 sm:grid-cols-2">
                  <div>
                    <HexIcon size={52} tone="sage">{ICONS.scan}</HexIcon>
                    <h3 className="mt-6 font-display text-3xl leading-tight">Join in one scan</h3>
                    <p className="mt-3 text-ink/75">
                      A QR code and a six-character code. No account, no app, no waiting.
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="rounded-[1.5rem] border border-ink/15 bg-paper px-6 py-5 text-center">
                      <p className="text-sm text-ink/65">Join code</p>
                      <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.2em]">K7M2QX</p>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          </div>
        </section>

        {/* Private replies */}
        <section id="private" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20 sm:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.25rem] bg-ink px-6 py-14 text-paper sm:px-12 sm:py-16">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-paper/[0.06]"
                style={{
                  maskImage: "radial-gradient(70% 80% at 0% 0%, black, transparent 80%)",
                  WebkitMaskImage: "radial-gradient(70% 80% at 0% 0%, black, transparent 80%)",
                }}
              >
                <HexGrid id="private-hex" size={32} />
              </div>
              <div className="relative">
                <h2 className="max-w-[16ch] font-display text-5xl leading-[1] sm:text-6xl">
                  Answer one person. Keep it between you.
                </h2>
                <p className="mt-5 max-w-[58ch] text-lg text-paper/80">
                  Pick a question and reply with text and any file. It is delivered only to the
                  device that asked. The board, the audience and the screen behind you never
                  show it.
                </p>
                <div className="mt-12">
                  <PrivateReplyDemo />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-20 sm:px-8">
          <Reveal>
            <h2 className="max-w-[20ch] font-display text-5xl leading-[1] sm:text-6xl">
              Three steps from silence to a sorted board
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 130}>
                <div className="group h-full cursor-default border-t border-ink/20 pt-6 transition-[border-color] duration-300 hover:border-sand">
                  <HexIcon
                    size={56}
                    tone="outline"
                    className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                  >
                    {step.icon}
                  </HexIcon>
                  <h3 className="mt-5 font-display text-3xl">{step.title}</h3>
                  <p className="mt-2 max-w-[34ch] text-ink/80">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <Reveal>
            <div className="group relative overflow-hidden rounded-[2.25rem] bg-ink px-7 py-14 text-paper sm:px-14 sm:py-20">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 text-sand/30 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110"
              >
                <svg width="260" height="225" viewBox="0 0 28 24" fill="currentColor">
                  <polygon points="7,0 21,0 28,12 21,24 7,24 0,12" />
                </svg>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-12 right-40 text-sage/40 transition-transform duration-700 group-hover:-translate-y-4"
              >
                <svg width="150" height="130" viewBox="0 0 28 24" fill="currentColor">
                  <polygon points="7,0 21,0 28,12 21,24 7,24 0,12" />
                </svg>
              </div>
              <div className="relative max-w-2xl">
                <h2 className="font-display text-5xl leading-[1] sm:text-7xl">
                  Your next event deserves better questions.
                </h2>
                <p className="mt-5 text-lg text-paper/80">
                  Create a session in under a minute and share the code.
                </p>
                <div className="mt-9">
                  <Button href="/create" variant="sand" size="lg">
                    Start a session
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative overflow-hidden border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink/70 sm:px-8">
          <Logo />
          <p>A free live Q&amp;A tool for events and classes.</p>
        </div>
        <p
          aria-hidden="true"
          className="select-none whitespace-nowrap pb-2 text-center font-display text-[15vw] leading-none text-ink/[0.06]"
        >
          Hexa AskBoard
        </p>
      </footer>
    </>
  );
}
