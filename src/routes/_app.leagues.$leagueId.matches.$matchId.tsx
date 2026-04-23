import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/leagues/$leagueId/matches/$matchId")({
  head: () => ({ meta: [{ title: "Match · Bisque" }] }),
  component: MatchScoringPage,
});

function MatchScoringPage() {
  const { leagueId, matchId } = useParams({
    from: "/_app/leagues/$leagueId/matches/$matchId",
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-12 pt-6 md:pt-12">
      <Link
        to="/leagues/$leagueId"
        params={{ leagueId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> League
      </Link>
      <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
        Score the match.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Match {matchId.slice(0, 8)} — scoring UI lands in the next iteration.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-lawn-grid bg-lawn-grid-fade p-10 text-center text-sm text-muted-foreground">
        Live scoring tracker coming soon.
      </div>
    </div>
  );
}
