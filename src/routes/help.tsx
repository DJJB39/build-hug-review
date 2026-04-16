import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicShell } from "@/components/layout/PublicShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQ · Bisque" },
      {
        name: "description",
        content: "How Bisque handles handicaps, leagues, and the live extra-strokes tracker.",
      },
    ],
  }),
  component: HelpPage,
});

const FAQ = [
  {
    q: "What handicap system does Bisque use?",
    a: "Bisque follows the Croquet England Golf Croquet handicap methodology — extra strokes are calculated as round((|hA − hB|)/2) for singles, with the weaker player receiving them. Index changes are ±10 per handicap singles match (±5 for doubles), with the standard trigger thresholds and a 4-match anti-oscillation lockout.",
  },
  {
    q: "Is Bisque an official handicap record?",
    a: "No. Bisque estimates handicap movement so your group can play meaningful, balanced matches. Your club handicapper remains the official record-keeper. The handicap card screen exports a printable summary you can hand to them.",
  },
  {
    q: "How are doubles strokes calculated?",
    a: "Bisque uses the post-2019 WCF pairwise rule: low of side A vs high of side B, and low of side B vs high of side A. The pre-match briefing shows both statements in plain English.",
  },
  {
    q: "Can I run a league for friends without a club?",
    a: "Absolutely. Create a league, share the join link or QR code, and you’re away. Leagues are private by default — only people with the link can join.",
  },
  {
    q: "What does the live tracker do?",
    a: "It’s a full-screen scoreboard for use on the lawn. Tap +/− to adjust scores, tap the extra-strokes chip to spend a stroke (with a confirm step), and undo anything you misclicked. End the match when someone reaches the target.",
  },
  {
    q: "Does Bisque cost anything?",
    a: "Not during the beta. Eventually there’ll be paid Individual and Club tiers, but everything is free for now.",
  },
];

function HelpPage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">Help</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          Frequently asked.
        </h1>
        <p className="mt-3 text-muted-foreground">
          The short answers. If you need more, write to{" "}
          <a href="mailto:hello@bisque.app" className="text-primary hover:underline">
            hello@bisque.app
          </a>
          .
        </p>

        <Accordion type="single" collapsible className="mt-10">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="tap text-left text-base font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-medium">Ready to play?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your league in under two minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="tap inline-flex items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create your league
            </Link>
            <Link
              to="/login"
              className="tap inline-flex items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
