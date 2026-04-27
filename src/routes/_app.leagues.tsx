import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, Trophy, Archive } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/leagues")({
  head: () => ({ meta: [{ title: "Leagues · Bisque" }] }),
  component: LeaguesRoute,
});

interface LeagueListRow {
  id: string;
  name: string;
  description: string | null;
  format: string;
  status: string;
  member_count?: number;
}

function LeaguesRoute() {
  const location = useLocation();

  if (location.pathname !== "/leagues") {
    return <Outlet />;
  }

  return <LeaguesPage />;
}

function LeaguesPage() {
  const { user } = useAuth();

  const leaguesQuery = useQuery({
    queryKey: ["leagues", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<LeagueListRow[]> => {
      const { data, error } = await supabase
        .from("leagues")
        .select("id, name, description, format, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const leagues = leaguesQuery.data ?? [];
  const active = leagues.filter((l) => l.status === "active");
  const archived = leagues.filter((l) => l.status === "archived");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-8 md:pt-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Leagues
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you're playing in, plus what you've put away.
          </p>
        </div>
        <Link
          to="/leagues/join"
          className="tap inline-flex w-full items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:w-auto"
        >
          Join with code
        </Link>
      </header>

      {leaguesQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : leagues.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-border p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-lawn-grid bg-lawn-grid-fade" aria-hidden />
          <div className="relative z-10">
          <Trophy className="mx-auto size-8 text-primary" aria-hidden />
          <h3 className="mt-4 font-display text-lg font-medium text-foreground">No leagues yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Create one and share the join link with your club.
          </p>
          <Link
            to="/leagues/new"
            className="tap mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="mr-1 size-4" aria-hidden /> Create league
          </Link>
          </div>
        </div>
      ) : (
        <>
          {active.length > 0 && <LeagueSection title="Active" leagues={active} />}
          {archived.length > 0 && (
            <LeagueSection title="Archived" leagues={archived} icon="archive" />
          )}
        </>
      )}
    </div>
  );
}

function LeagueSection({
  title,
  leagues,
  icon = "trophy",
}: {
  title: string;
  leagues: LeagueListRow[];
  icon?: "trophy" | "archive";
}) {
  const Icon = icon === "archive" ? Archive : Trophy;
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-3">
        {leagues.map((l) => (
          <li key={l.id}>
            <Link
              to="/leagues/$leagueId"
              params={{ leagueId: l.id }}
              className="tap flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{l.name}</div>
                {l.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {l.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider">{l.format}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" aria-hidden /> members
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
