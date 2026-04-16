import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell } from "@/components/layout/PublicShell";
import { BisqueWordmark, BisqueMark } from "@/components/brand/BisqueWordmark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bisque — Golf Croquet leagues, handicaps & live tracker" },
      {
        name: "description",
        content:
          "Run private Golf Croquet leagues with dual leaderboards, an extra-strokes live tracker, and Croquet England-style handicap tracking.",
      },
      { property: "og:title", content: "Bisque — Golf Croquet, tracked properly" },
      {
        property: "og:description",
        content:
          "Private leagues, live extra-strokes tracker, and proper handicap maths for clubs and friend groups.",
      },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  return (
    <PublicShell hideHeader>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-lawn-grid bg-lawn-grid-fade opacity-70" aria-hidden />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-10 px-5 pb-20 pt-12 md:pt-16">
          {/* Top bar inside hero */}
          <div className="flex w-full items-center justify-between">
            <BisqueWordmark size="md" />
            <nav className="flex items-center gap-1 text-sm">
              <Link
                to="/help"
                className="tap hidden items-center rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Help
              </Link>
              <Link
                to="/login"
                className="tap inline-flex items-center rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
            </nav>
          </div>

          <div className="grid w-full grid-cols-1 items-center gap-12 md:grid-cols-12">
            <div className="md:col-span-7">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
                <span className="size-1.5 rounded-full bg-primary" />
                Built for Golf Croquet
              </p>
              <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-tight text-foreground md:text-7xl">
                The handicap,
                <br />
                <span className="italic text-primary">finally</span> sorted.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Bisque runs your private leagues with dual leaderboards, an extra-strokes live
                tracker, and Croquet England-style index maths — so your club can stop arguing
                about the spreadsheet.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="tap inline-flex items-center justify-center rounded-xl bg-primary px-7 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create your league
                </Link>
                <Link
                  to="/login"
                  className="tap inline-flex items-center justify-center rounded-xl border border-border bg-card px-7 text-base font-medium text-foreground transition-colors hover:bg-accent"
                >
                  I already have an account
                </Link>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Free during the beta · No card needed · Works on phone & tablet
              </p>
            </div>

            {/* Right: hero card preview */}
            <div className="md:col-span-5">
              <HeroCard />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-px bg-border md:grid-cols-3">
          <FeatureCell
            kicker="01"
            title="Two leaderboards, one league"
            body="See raw Wins and Handicap Wins side by side, plus a Combined view that rewards genuine upsets."
          />
          <FeatureCell
            kicker="02"
            title="Extra-strokes tracker"
            body="A full-screen scoreboard you can run on the lawn. Tap to spend a stroke, undo if you misclicked."
          />
          <FeatureCell
            kicker="03"
            title="Handicaps that update themselves"
            body="Croquet England trigger logic, anti-oscillation lockout, and a printable handicap card you can show your handicapper."
          />
        </div>
      </section>

      {/* QUOTE / DISCLAIMER */}
      <section className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
        <p className="font-display text-2xl italic leading-snug text-foreground md:text-3xl">
          “Bisque uses the Croquet England methodology to estimate index changes. Your club
          handicapper remains the official record-keeper.”
        </p>
        <div className="mt-10">
          <Link
            to="/signup"
            className="tap inline-flex items-center justify-center rounded-xl bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start a league — it’s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BisqueMark size={18} className="text-primary" />
            <span>© {new Date().getFullYear()} Bisque</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/help" className="hover:text-foreground">
              Help
            </Link>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </PublicShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  HeroCard — a faux scoreboard preview                                       */
/* -------------------------------------------------------------------------- */

function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-xl" aria-hidden />
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span>Live · Lawn 2</span>
          <span className="tabular">First to 7</span>
        </div>

        <div className="grid grid-cols-2">
          <SidePanel
            name="Margaret"
            handicap={4}
            ball="ball-clay"
            score={5}
            strokesLeft={2}
            highlighted
          />
          <SidePanel
            name="Henry"
            handicap={10}
            ball="ball-navy"
            score={3}
            strokesLeft={0}
          />
        </div>

        <div className="border-t border-border bg-background/40 px-5 py-3 text-center text-xs text-muted-foreground">
          Margaret receives <span className="font-medium text-foreground">3 extra strokes</span> ·
          1 used
        </div>
      </div>
    </div>
  );
}

function SidePanel({
  name,
  handicap,
  ball,
  score,
  strokesLeft,
  highlighted,
}: {
  name: string;
  handicap: number;
  ball: string;
  score: number;
  strokesLeft: number;
  highlighted?: boolean;
}) {
  return (
    <div className={cn("relative px-5 py-6", highlighted && "ring-left bg-primary/[0.04]")}>
      <div className="flex items-center gap-2 text-sm">
        <span
          className={cn("inline-block size-3 rounded-full")}
          style={{ backgroundColor: `var(--${ball})` }}
          aria-hidden
        />
        <span className="font-medium text-foreground">{name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          h<span className="handicap-num">{handicap}</span>
        </span>
      </div>
      <div className="mt-3 score text-6xl leading-none text-foreground">{score}</div>
      <div className="mt-3 text-xs text-muted-foreground">
        {strokesLeft > 0 ? (
          <>
            <span className="font-medium text-foreground tabular">{strokesLeft}</span> extra
            stroke{strokesLeft === 1 ? "" : "s"} left
          </>
        ) : (
          "No extra strokes"
        )}
      </div>
    </div>
  );
}

function FeatureCell({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-background p-8">
      <div className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">{kicker}</div>
      <h3 className="font-display text-2xl font-medium leading-snug text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
