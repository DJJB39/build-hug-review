import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/leagues/new")({
  head: () => ({ meta: [{ title: "New league · Bisque" }] }),
  component: NewLeaguePage,
});

function NewLeaguePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-12 pt-6 md:pt-12">
      <Link
        to="/leagues"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Leagues
      </Link>
      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
        Spin up a league.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Wizard coming next — basics, format, scoring, and invite link in one flow.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-lawn-grid bg-lawn-grid-fade p-10 text-center text-sm text-muted-foreground">
        Builder lands in the next iteration.
      </div>
    </div>
  );
}
