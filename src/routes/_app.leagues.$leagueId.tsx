import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/leagues/$leagueId")({
  head: () => ({ meta: [{ title: "League · Bisque" }] }),
  component: LeagueDetail,
});

function LeagueDetail() {
  const { leagueId } = useParams({ from: "/_app/leagues/$leagueId" });

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, description, format, target_score, status, join_code")
        .eq("id", leagueId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 md:pt-12">
      <Link
        to="/leagues"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Leagues
      </Link>

      {isLoading ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-muted/40" />
      ) : !league ? (
        <p className="mt-8 text-sm text-muted-foreground">League not found.</p>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {league.name}
          </h1>
          {league.description && (
            <p className="mt-2 text-sm text-muted-foreground">{league.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span>{league.format}</span>
            <span>·</span>
            <span>First to {league.target_score}</span>
            <span>·</span>
            <span>Code {league.join_code}</span>
          </div>

          <section className="mt-8 rounded-2xl border border-dashed border-border bg-lawn-grid bg-lawn-grid-fade p-10 text-center text-sm text-muted-foreground">
            Leaderboard, fixtures, and head-to-head land in the next iteration.
          </section>
        </>
      )}
    </div>
  );
}
