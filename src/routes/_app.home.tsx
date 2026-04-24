import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowUpRight, Trophy } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [{ title: "Home · Bisque" }],
  }),
  component: HomePage,
});

interface ProfileRow {
  display_name: string;
  club: string | null;
  gc_handicap: number;
  gc_index: number;
}

interface LeagueRow {
  id: string;
  name: string;
  format: string;
  status: string;
}

function greet() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, club, gc_handicap, gc_index")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const leaguesQuery = useQuery({
    queryKey: ["my-leagues", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<LeagueRow[]> => {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, format, status")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const profile = profileQuery.data;
  const leagues = leaguesQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-8 md:pt-12">
      {/* Greeting + handicap card */}
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">{greet()},</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          {profile?.display_name ?? "Player"}.
        </h1>
      </header>

      <section className="mb-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your handicap
          </span>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Card <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </div>
        <div className="mt-4 flex items-baseline gap-6">
          <div>
            <div className="score handicap-num text-6xl text-foreground">
              {profile?.gc_handicap ?? "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">GC handicap</div>
          </div>
          <div>
            <div className="font-display tabular text-2xl text-muted-foreground">
              {profile?.gc_index ?? "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Index</div>
          </div>
        </div>
        {profile?.club && (
          <p className="mt-4 text-xs text-muted-foreground">Member of {profile.club}</p>
        )}
      </section>

      {/* Leagues */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-medium text-foreground">Your leagues</h2>
          <Link
            to="/leagues/new"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="size-4" aria-hidden /> New league
          </Link>
        </div>

        {leaguesQuery.isLoading ? (
          <LeagueSkeleton />
        ) : leagues.length === 0 ? (
          <EmptyLeagues />
        ) : (
          <ul className="space-y-3">
            {leagues.map((l) => (
              <li key={l.id}>
                <Link
                  to="/leagues/$leagueId"
                  params={{ leagueId: l.id }}
                  className={cn(
                    "tap flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40",
                  )}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                    <Trophy className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground">{l.name}</div>
                    <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      {l.format}
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Floating record-match CTA — only shown when the user has at least one league */}
      {leagues.length === 1 ? (
        <Link
          to="/leagues/$leagueId/matches/new"
          params={{ leagueId: leagues[0].id }}
          className="tap fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:bottom-8"
        >
          <Plus className="size-4" aria-hidden />
          Record a match
        </Link>
      ) : leagues.length > 1 ? (
        <Link
          to="/leagues"
          className="tap fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 md:bottom-8"
        >
          <Plus className="size-4" aria-hidden />
          Record a match
        </Link>
      ) : null}
    </div>
  );
}

function LeagueSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-xl border border-border bg-muted/40" />
      ))}
    </div>
  );
}

function EmptyLeagues() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-lawn-grid bg-lawn-grid-fade p-8 text-center">
      <h3 className="font-display text-lg font-medium text-foreground">No leagues yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Spin one up for your club, your friends, or your weekly Tuesday foursome.
      </p>
      <Link
        to="/leagues/new"
        className="tap mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="mr-1 size-4" aria-hidden /> Create your first league
      </Link>
    </div>
  );
}
