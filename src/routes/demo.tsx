import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Trophy, Users } from "lucide-react";

import { PublicShell } from "@/components/layout/PublicShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo League · Bisque" },
      {
        name: "description",
        content:
          "Browse a seeded Bisque demo league with realistic UK croquet players, confirmed singles matches, scores, extra strokes, and handicap movement.",
      },
      { property: "og:title", content: "Bisque Demo League" },
      {
        property: "og:description",
        content:
          "A public, read-only demo of Bisque's league, member, match, score, confirmation, and handicap-history experience.",
      },
    ],
  }),
  component: DemoLeaguePage,
});

const members = [
  { name: "Margaret Hughes", club: "Watford CC", handicap: 8, source: "club" },
  { name: "Henry Thompson", club: "Sussex County", handicap: 12, source: "system" },
  { name: "David Patel", club: "Phyllis Court", handicap: 5, source: "club" },
  { name: "Sarah O'Connor", club: "Colchester", handicap: 15, source: "self" },
  { name: "James Whitaker", club: "Wrest Park", handicap: 9, source: "club" },
  { name: "Emma Leclerc", club: "East Anglian", handicap: 11, source: "system" },
  { name: "Robert \"Bob\" McKenzie", club: "Watford CC", handicap: 18, source: "self" },
  { name: "Priya Sharma", club: "Southern Fed", handicap: 7, source: "club" },
];

const matches = [
  { side1: "Margaret Hughes", side2: "Henry Thompson", score: "7 – 4", winner: "Margaret Hughes", extra: "Henry +4, 0 used", delta: "+15 / −15" },
  { side1: "David Patel", side2: "Sarah O'Connor", score: "6 – 7", winner: "Sarah O'Connor", extra: "Sarah +10, 3 used", delta: "−24 / +24" },
  { side1: "James Whitaker", side2: "Emma Leclerc", score: "7 – 5", winner: "James Whitaker", extra: "Emma +2, 2 used", delta: "+12 / −12" },
  { side1: "Priya Sharma", side2: "Robert McKenzie", score: "7 – 3", winner: "Priya Sharma", extra: "Robert +11, 3 used", delta: "+10 / −10" },
  { side1: "Henry Thompson", side2: "Sarah O'Connor", score: "7 – 6", winner: "Henry Thompson", extra: "Sarah +3, 3 used", delta: "+18 / −18" },
  { side1: "Margaret Hughes", side2: "David Patel", score: "5 – 7", winner: "David Patel", extra: "Margaret +3, 3 used", delta: "−14 / +14" },
  { side1: "Emma Leclerc", side2: "Robert McKenzie", score: "7 – 2", winner: "Emma Leclerc", extra: "Robert +7, 3 used", delta: "+11 / −11" },
  { side1: "James Whitaker", side2: "Priya Sharma", score: "4 – 7", winner: "Priya Sharma", extra: "James +2, 2 used", delta: "−16 / +16" },
  { side1: "Sarah O'Connor", side2: "Robert McKenzie", score: "7 – 5", winner: "Sarah O'Connor", extra: "Robert +3, 3 used", delta: "+13 / −13" },
  { side1: "Henry Thompson", side2: "Emma Leclerc", score: "3 – 7", winner: "Emma Leclerc", extra: "Henry +1, 1 used", delta: "−20 / +20" },
  { side1: "David Patel", side2: "Priya Sharma", score: "7 – 6", winner: "David Patel", extra: "Priya +2, 2 used", delta: "+22 / −22" },
  { side1: "Margaret Hughes", side2: "James Whitaker", score: "6 – 7", winner: "James Whitaker", extra: "James +1, 1 used", delta: "−17 / +17" },
];

function DemoLeaguePage() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 md:pt-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Home
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" /> Public demo
            </p>
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              Watford Spring Handicap Singles 2026
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Internal club ladder plus occasional visitors. First to 7, full handicap.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wider text-muted-foreground">
              <span>GC</span>
              <span>·</span>
              <span>singles</span>
              <span>·</span>
              <span>First to 7</span>
              <span>·</span>
              <span>Join code WATFRD26</span>
            </div>
          </div>
          <Link
            to="/signup"
            className="tap inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create your league
          </Link>
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What you are seeing
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This public page mirrors the seeded demo league data in <code className="rounded bg-muted px-1 py-0.5 text-foreground">supabase/seed.sql</code>.
            It is read-only and does not bypass app security, add a public data endpoint, or change existing access rules.
          </p>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-medium text-foreground">Members</h2>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" aria-hidden /> {members.length}
            </span>
          </div>
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.name}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">{member.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {member.club} · Handicap {member.handicap}
                  </div>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                  {member.source}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-medium text-foreground">Recent matches</h2>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="size-3" aria-hidden /> {matches.length}
            </span>
          </div>
          <ul className="space-y-2">
            {matches.map((match, index) => (
              <li
                key={`${match.side1}-${match.side2}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {match.side1} vs {match.side2}
                    </span>
                    <span className="text-xs text-muted-foreground">· first to 7</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                    <StatusBadge status="confirmed" />
                    <span className="tabular text-foreground">{match.score}</span>
                    <span className="text-muted-foreground">{match.winner} won</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{match.extra}</span>
                    <span>Index {match.delta}</span>
                  </div>
                </div>
                <span className="hidden rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline-flex">
                  Match {index + 1}
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  const tone =
    status === "confirmed"
      ? "bg-primary/10 text-primary"
      : status === "live"
        ? "bg-primary/10 text-primary"
        : status === "disputed"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        tone,
      )}
    >
      {label}
    </span>
  );
}
