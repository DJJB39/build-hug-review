import * as React from "react";
import { createFileRoute, Link, Outlet, useLocation, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Check, Copy, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leagues/$leagueId")({
  head: () => ({ meta: [{ title: "League · Bisque" }] }),
  component: LeagueRoute,
});

interface MemberWithProfile {
  user_id: string;
  role: "admin" | "player";
  joined_at: string;
  display_name: string;
  gc_handicap: number;
}

interface MatchRow {
  id: string;
  match_type: "singles" | "doubles";
  status: string;
  target_score: number;
  winner_side: number | null;
  created_at: string;
  ended_at: string | null;
  scores: { side_number: number; score: number }[];
}

function LeagueRoute() {
  const location = useLocation();
  const { leagueId } = useParams({ from: "/_app/leagues/$leagueId" });

  if (location.pathname !== `/leagues/${leagueId}`) {
    return <Outlet />;
  }

  return <LeagueDetail />;
}

function LeagueDetail() {
  const { leagueId } = useParams({ from: "/_app/leagues/$leagueId" });
  const { user } = useAuth();

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leagues")
        .select(
          "id, name, description, format, discipline, target_score, status, owner_id",
        )
        .eq("id", leagueId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Join code is restricted to admins/owner via a SECURITY DEFINER RPC.
  // Non-admin members will simply receive null.
  const { data: joinCode } = useQuery({
    queryKey: ["league-join-code", leagueId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_league_join_code", {
        _league_id: leagueId,
      });
      if (error) throw error;
      return (data as string | null) ?? null;
    },
  });

  const { data: members = [] } = useQuery<MemberWithProfile[]>({
    queryKey: ["league-members", leagueId],
    queryFn: async () => {
      const { data: lm, error: lmErr } = await supabase
        .from("league_members")
        .select("user_id, role, joined_at")
        .eq("league_id", leagueId);
      if (lmErr) throw lmErr;
      const ids = (lm ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, gc_handicap")
        .in("id", ids);
      if (pErr) throw pErr;
      const map = new Map(profiles?.map((p) => [p.id, p]) ?? []);
      return (lm ?? [])
        .map((m) => {
          const p = map.get(m.user_id);
          return {
            user_id: m.user_id,
            role: m.role as "admin" | "player",
            joined_at: m.joined_at,
            display_name: p?.display_name ?? "Player",
            gc_handicap: p?.gc_handicap ?? 12,
          };
        })
        .sort((a, b) => {
          if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
          return a.display_name.localeCompare(b.display_name);
        });
    },
  });

  const { data: matches = [] } = useQuery<MatchRow[]>({
    queryKey: ["league-matches", leagueId],
    queryFn: async () => {
      const { data: ms, error: msErr } = await supabase
        .from("matches")
        .select("id, match_type, status, target_score, winner_side, created_at, ended_at")
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (msErr) throw msErr;
      const matchIds = (ms ?? []).map((m) => m.id);
      if (matchIds.length === 0) return [];
      const { data: sides, error: sErr } = await supabase
        .from("match_sides")
        .select("match_id, side_number, score")
        .in("match_id", matchIds);
      if (sErr) throw sErr;
      return (ms ?? []).map((m) => ({
        ...m,
        match_type: m.match_type as "singles" | "doubles",
        scores: (sides ?? [])
          .filter((s) => s.match_id === m.id)
          .map((s) => ({ side_number: s.side_number, score: s.score }))
          .sort((a, b) => a.side_number - b.side_number),
      }));
    },
  });

  const isAdmin =
    !!user && !!league && (league.owner_id === user.id ||
      members.some((m) => m.user_id === user.id && m.role === "admin"));

  const [copied, setCopied] = React.useState(false);
  async function copyJoinCode() {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success("Join code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy code");
    }
  }

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
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                {league.name}
              </h1>
              {league.description && (
                <p className="mt-2 text-sm text-muted-foreground">{league.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wider text-muted-foreground">
                <span>{league.discipline?.toUpperCase() ?? "GC"}</span>
                <span>·</span>
                <span>{league.format}</span>
                <span>·</span>
                <span>First to {league.target_score}</span>
              </div>
            </div>
            <Link
              to="/leagues/$leagueId/matches/new"
              params={{ leagueId }}
              className="tap inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" aria-hidden /> New match
            </Link>
          </div>

          {/* Join code (admin only) */}
          {isAdmin && joinCode && (
            <section className="mt-6 rounded-xl border border-border bg-card p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Invite players
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-2xl tabular tracking-widest text-foreground">
                    {joinCode}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Share this code · they enter it on Join a league.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyJoinCode}
                  className="tap inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" aria-hidden /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" aria-hidden /> Copy
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Members */}
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-foreground">Members</h2>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" aria-hidden /> {members.length}
              </span>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {m.display_name}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Handicap {m.gc_handicap}
                      </div>
                    </div>
                    {m.role === "admin" && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                        Admin
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent matches */}
          <section className="mt-8">
            <h2 className="mb-3 font-display text-xl font-medium text-foreground">
              Recent matches
            </h2>
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-lawn-grid bg-lawn-grid-fade p-8 text-center text-sm text-muted-foreground">
                No matches yet. Hit{" "}
                <span className="font-medium text-foreground">+ New match</span> to record
                your first.
              </div>
            ) : (
              <ul className="space-y-2">
                {matches.map((m) => (
                  <li key={m.id}>
                    <Link
                      to="/leagues/$leagueId/matches/$matchId"
                      params={{ leagueId, matchId: m.id }}
                      className={cn(
                        "tap flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize text-foreground">
                            {m.match_type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · first to {m.target_score}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          <StatusBadge status={m.status} />
                          {m.scores.length === 2 && (
                            <span className="tabular text-foreground">
                              {m.scores[0].score} – {m.scores[1].score}
                            </span>
                          )}
                          {m.winner_side && (
                            <span className="text-muted-foreground">
                              Side {m.winner_side} won
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
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
