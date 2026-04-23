import * as React from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock, Loader2, Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/leagues/$leagueId/matches/$matchId")({
  head: () => ({ meta: [{ title: "Match · Bisque" }] }),
  component: MatchScoringPage,
});

interface PlayerSnapshot {
  id: string;
  user_id: string;
  handicap_snapshot: number;
  index_snapshot: number;
  display_name: string;
}

interface SideState {
  id: string;
  side_number: number;
  score: number;
  extra_strokes_received: number;
  extra_strokes_used: number;
  players: PlayerSnapshot[];
}

interface MatchData {
  id: string;
  league_id: string;
  match_type: "singles" | "doubles";
  target_score: number;
  handicap_applied: boolean;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  winner_side: number | null;
  created_by: string;
  sides: [SideState, SideState];
}

function MatchScoringPage() {
  const { leagueId, matchId } = useParams({
    from: "/_app/leagues/$leagueId/matches/$matchId",
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: match, isLoading, error } = useQuery<MatchData | null>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const { data: m, error: mErr } = await supabase
        .from("matches")
        .select(
          "id, league_id, match_type, target_score, handicap_applied, status, started_at, ended_at, winner_side, created_by",
        )
        .eq("id", matchId)
        .maybeSingle();
      if (mErr) throw mErr;
      if (!m) return null;

      const { data: sides, error: sErr } = await supabase
        .from("match_sides")
        .select("id, side_number, score, extra_strokes_received, extra_strokes_used")
        .eq("match_id", matchId)
        .order("side_number", { ascending: true });
      if (sErr) throw sErr;

      const sideIds = (sides ?? []).map((s) => s.id);
      const { data: players, error: pErr } = await supabase
        .from("match_side_players")
        .select("id, side_id, user_id, handicap_snapshot, index_snapshot")
        .in("side_id", sideIds);
      if (pErr) throw pErr;

      const userIds = (players ?? []).map((p) => p.user_id);
      const { data: profiles, error: prErr } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      if (prErr) throw prErr;
      const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

      const sidesWithPlayers = (sides ?? []).map((s) => ({
        ...s,
        players: (players ?? [])
          .filter((p) => p.side_id === s.id)
          .map((p) => ({
            id: p.id,
            user_id: p.user_id,
            handicap_snapshot: p.handicap_snapshot,
            index_snapshot: p.index_snapshot,
            display_name: nameMap.get(p.user_id) ?? "Player",
          })),
      })) as SideState[];

      return { ...m, sides: sidesWithPlayers as [SideState, SideState] };
    },
  });

  // Local optimistic state mirrors server data once loaded.
  const [local, setLocal] = React.useState<MatchData | null>(null);
  React.useEffect(() => {
    if (match) {
      // Compute handicap-derived bisques on first load if not yet recorded.
      const next = { ...match, sides: [...match.sides] as [SideState, SideState] };
      if (next.handicap_applied) {
        const totalH = (s: SideState) =>
          s.players.reduce((sum, p) => sum + p.handicap_snapshot, 0);
        const h1 = totalH(next.sides[0]);
        const h2 = totalH(next.sides[1]);
        next.sides[0] = {
          ...next.sides[0],
          extra_strokes_received: Math.max(0, h1 - h2),
        };
        next.sides[1] = {
          ...next.sides[1],
          extra_strokes_received: Math.max(0, h2 - h1),
        };
      }
      setLocal(next);
    }
  }, [match]);

  const [busy, setBusy] = React.useState(false);

  const isComplete =
    !!local &&
    (local.status === "awaiting_confirmation" ||
      local.status === "confirmed" ||
      local.status === "disputed" ||
      !!local.winner_side);
  const isLive = !!local && local.status === "live";
  const canScore = isLive && !isComplete;

  // ---- Mutations (optimistic) ----
  type SidePatch = Partial<
    Pick<SideState, "score" | "extra_strokes_received" | "extra_strokes_used">
  >;
  const updateSide = async (sideIdx: 0 | 1, patch: SidePatch) => {
    if (!local) return;
    const sides = [...local.sides] as [SideState, SideState];
    sides[sideIdx] = { ...sides[sideIdx], ...patch };
    setLocal({ ...local, sides });

    const { error: upErr } = await supabase
      .from("match_sides")
      .update(patch)
      .eq("id", sides[sideIdx].id);
    if (upErr) {
      toast.error("Could not save score");
      // Revert
      setLocal(local);
    }
  };

  const adjustScore = async (sideIdx: 0 | 1, delta: 1 | -1) => {
    if (!local || !canScore) return;
    const side = local.sides[sideIdx];
    const next = side.score + delta;
    if (next < 0 || next > local.target_score) return;
    await updateSide(sideIdx, { score: next });

    // Auto-end on target reached
    if (next >= local.target_score) {
      await endMatch(side.side_number);
    }
  };

  const useBisque = async (sideIdx: 0 | 1) => {
    if (!local || !canScore || !local.handicap_applied) return;
    const side = local.sides[sideIdx];
    const remaining = side.extra_strokes_received - side.extra_strokes_used;
    if (remaining <= 0) return;
    await updateSide(sideIdx, { extra_strokes_used: side.extra_strokes_used + 1 });
  };

  const markLive = async () => {
    if (!local || !user) return;
    setBusy(true);
    try {
      const startedAt = new Date().toISOString();
      const { error: upErr } = await supabase
        .from("matches")
        .update({ status: "live", started_at: startedAt })
        .eq("id", local.id);
      if (upErr) throw upErr;
      setLocal({ ...local, status: "live", started_at: startedAt });
      toast.success("Match is live");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start match");
    } finally {
      setBusy(false);
    }
  };

  const endMatch = async (winnerSideNumber?: number) => {
    if (!local || !user) return;
    setBusy(true);
    try {
      const endedAt = new Date().toISOString();
      const winner =
        winnerSideNumber ??
        (local.sides[0].score > local.sides[1].score
          ? local.sides[0].side_number
          : local.sides[1].side_number);
      const { error: upErr } = await supabase
        .from("matches")
        .update({
          status: "awaiting_confirmation",
          ended_at: endedAt,
          winner_side: winner,
        })
        .eq("id", local.id);
      if (upErr) throw upErr;

      // Append-only handicap event log per player on the losing/winning sides
      // Capture initial snapshot rows so the audit log records the moment.
      const events = local.sides.flatMap((s) =>
        s.players.map((p) => ({
          user_id: p.user_id,
          match_id: local.id,
          handicap_before: p.handicap_snapshot,
          handicap_after: p.handicap_snapshot,
          index_before: p.index_snapshot,
          index_after: p.index_snapshot,
          index_delta: 0,
          reason: "match" as const,
          notes: `Side ${s.side_number} score ${s.score}`,
        })),
      );
      // Best-effort write — don't block the user if it fails.
      const { error: evErr } = await supabase.from("handicap_events").insert(events);
      if (evErr) console.warn("handicap_events insert failed:", evErr);

      setLocal({
        ...local,
        status: "awaiting_confirmation",
        ended_at: endedAt,
        winner_side: winner,
      });
      qc.invalidateQueries({ queryKey: ["match", matchId] });
      toast.success("Match complete — awaiting confirmation");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not end match");
    } finally {
      setBusy(false);
    }
  };

  // ---- Render ----
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 md:pt-12">
        <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (error || !local) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 md:pt-12">
        <Link
          to="/leagues/$leagueId"
          params={{ leagueId }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> League
        </Link>
        <p className="mt-8 text-sm text-muted-foreground">Match not found.</p>
      </div>
    );
  }

  const statusLabel =
    local.status === "live"
      ? "Live"
      : local.status === "awaiting_confirmation"
        ? "Awaiting Confirmation"
        : local.status === "confirmed"
          ? "Confirmed"
          : local.status === "disputed"
            ? "Disputed"
            : local.status === "scheduled"
              ? "Scheduled"
              : local.status;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 md:pt-12">
      <Link
        to="/leagues/$leagueId"
        params={{ leagueId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> League
      </Link>

      {/* Match header */}
      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl capitalize">
            {local.match_type}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="tabular">First to {local.target_score}</span>
            <span>·</span>
            <span>Handicap {local.handicap_applied ? "applied" : "off"}</span>
            {local.started_at && (
              <>
                <span>·</span>
                <span className="tabular">
                  Started {new Date(local.started_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>
        </div>
        <span
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs uppercase tracking-wider",
            isLive
              ? "border-primary bg-primary-soft text-primary"
              : "border-border bg-secondary text-secondary-foreground",
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Pre-live actions */}
      {!isLive && !isComplete && (
        <div className="mt-6">
          <Button onClick={markLive} disabled={busy} size="lg">
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Starting…
              </>
            ) : (
              "Mark as live"
            )}
          </Button>
        </div>
      )}

      {/* Completion banner */}
      {isComplete && (
        <div className="mt-6 rounded-xl border border-primary bg-primary-soft p-5">
          <p className="font-display text-lg text-foreground">Match complete</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Side {local.winner_side} won {local.sides[(local.winner_side ?? 1) - 1].score}–
            {local.sides[(local.winner_side ?? 1) === 1 ? 1 : 0].score}.
          </p>
          <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
            {local.status === "confirmed"
              ? "Result confirmed by all players"
              : local.status === "disputed"
                ? "Result disputed — needs resolution"
                : "Next: players confirm result"}
          </p>
        </div>
      )}

      {/* Confirmation flow (post-match) */}
      {isComplete && (
        <ConfirmationPanel
          matchId={local.id}
          matchStatus={local.status}
          participants={local.sides.flatMap((s) =>
            s.players.map((p) => ({
              user_id: p.user_id,
              display_name: p.display_name,
              side_number: s.side_number,
            })),
          )}
          currentUserId={user?.id ?? null}
          onStatusChange={(next) => setLocal((prev) => (prev ? { ...prev, status: next } : prev))}
        />
      )}

      {/* Two-column score panel */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {local.sides.map((side, idx) => (
          <SidePanel
            key={side.id}
            side={side}
            sideIdx={idx as 0 | 1}
            handicapApplied={local.handicap_applied}
            targetScore={local.target_score}
            canScore={canScore}
            isWinner={local.winner_side === side.side_number}
            onAdjust={adjustScore}
            onBisque={useBisque}
          />
        ))}
      </div>

      {/* End match */}
      {isLive && !isComplete && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => endMatch()}
            disabled={busy}
          >
            End match
          </Button>
        </div>
      )}
    </div>
  );
}

interface SidePanelProps {
  side: SideState;
  sideIdx: 0 | 1;
  handicapApplied: boolean;
  targetScore: number;
  canScore: boolean;
  isWinner: boolean;
  onAdjust: (sideIdx: 0 | 1, delta: 1 | -1) => void;
  onBisque: (sideIdx: 0 | 1) => void;
}

function SidePanel({
  side,
  sideIdx,
  handicapApplied,
  targetScore,
  canScore,
  isWinner,
  onAdjust,
  onBisque,
}: SidePanelProps) {
  const remainingBisques = side.extra_strokes_received - side.extra_strokes_used;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow",
        isWinner && "ring-left border-primary",
      )}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Side {side.side_number}
        </p>
        {handicapApplied && (
          <p className="text-xs text-muted-foreground tabular">
            h{side.players.reduce((s, p) => s + p.handicap_snapshot, 0)}
          </p>
        )}
      </div>

      <div className="mt-1 space-y-0.5">
        {side.players.map((p) => (
          <p key={p.id} className="text-sm font-medium text-foreground truncate">
            {p.display_name}
          </p>
        ))}
      </div>

      <div className="mt-4 score text-7xl leading-none text-foreground tabular">
        {side.score}
      </div>

      {handicapApplied && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Bisques received</span>
          <span className="tabular handicap-num">{side.extra_strokes_received}</span>
        </div>
      )}
      {handicapApplied && (
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Bisques remaining</span>
          <span className="tabular handicap-num text-foreground">{remainingBisques}</span>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={() => onAdjust(sideIdx, 1)}
          disabled={!canScore || side.score >= targetScore}
        >
          <Plus className="size-4" aria-hidden /> 1 point
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onAdjust(sideIdx, -1)}
          disabled={!canScore || side.score <= 0}
        >
          <Minus className="size-4" aria-hidden /> 1 point
        </Button>
      </div>

      {handicapApplied && (
        <div className="mt-2">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => onBisque(sideIdx)}
            disabled={!canScore || remainingBisques <= 0}
          >
            Use bisque ({remainingBisques})
          </Button>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Confirmation flow
// ===========================================================================

interface Participant {
  user_id: string;
  display_name: string;
  side_number: number;
}

interface ConfirmationRow {
  id: string;
  user_id: string;
  state: "pending" | "confirmed" | "disputed";
  note: string | null;
  responded_at: string | null;
}

interface ConfirmationPanelProps {
  matchId: string;
  matchStatus: string;
  participants: Participant[];
  currentUserId: string | null;
  onStatusChange: (next: string) => void;
}

function ConfirmationPanel({
  matchId,
  matchStatus,
  participants,
  currentUserId,
  onStatusChange,
}: ConfirmationPanelProps) {
  const qc = useQueryClient();
  const [showDispute, setShowDispute] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const { data: confirmations = [], isLoading } = useQuery<ConfirmationRow[]>({
    queryKey: ["match-confirmations", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_confirmations")
        .select("id, user_id, state, note, responded_at")
        .eq("match_id", matchId);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: matchStatus === "awaiting_confirmation" ? 5000 : false,
  });

  const byUser = React.useMemo(() => {
    const m = new Map<string, ConfirmationRow>();
    confirmations.forEach((c) => m.set(c.user_id, c));
    return m;
  }, [confirmations]);

  const myRow = currentUserId ? byUser.get(currentUserId) : undefined;
  const isParticipant =
    !!currentUserId && participants.some((p) => p.user_id === currentUserId);
  const matchLocked = matchStatus === "confirmed" || matchStatus === "disputed";
  const canRespond = isParticipant && !matchLocked && (!myRow || myRow.state === "pending");

  // After each write, see if the match itself should transition.
  const maybeTransitionMatch = async (latest: ConfirmationRow[]) => {
    if (matchStatus !== "awaiting_confirmation") return;
    const responses = participants.map(
      (p) => latest.find((c) => c.user_id === p.user_id)?.state ?? "pending",
    );
    if (responses.includes("disputed")) {
      const { error } = await supabase
        .from("matches")
        .update({ status: "disputed" })
        .eq("id", matchId);
      if (!error) onStatusChange("disputed");
      return;
    }
    if (responses.every((s) => s === "confirmed")) {
      const { error } = await supabase
        .from("matches")
        .update({ status: "confirmed" })
        .eq("id", matchId);
      if (!error) onStatusChange("confirmed");
    }
  };

  const respond = async (state: "confirmed" | "disputed", noteText?: string) => {
    if (!currentUserId || !canRespond) return;
    setBusy(true);
    try {
      const payload = {
        match_id: matchId,
        user_id: currentUserId,
        state,
        note: noteText?.trim() || null,
        responded_at: new Date().toISOString(),
      };
      // Upsert by composite (match_id, user_id) — fall back to insert/update.
      let upsertErr: { message: string } | null = null;
      if (myRow) {
        const { error } = await supabase
          .from("match_confirmations")
          .update({
            state: payload.state,
            note: payload.note,
            responded_at: payload.responded_at,
          })
          .eq("id", myRow.id);
        upsertErr = error;
      } else {
        const { error } = await supabase.from("match_confirmations").insert(payload);
        upsertErr = error;
      }
      if (upsertErr) throw new Error(upsertErr.message);

      const { data: latest, error: refetchErr } = await supabase
        .from("match_confirmations")
        .select("id, user_id, state, note, responded_at")
        .eq("match_id", matchId);
      if (refetchErr) throw refetchErr;

      qc.setQueryData(["match-confirmations", matchId], latest ?? []);
      await maybeTransitionMatch(latest ?? []);

      toast.success(state === "confirmed" ? "Result confirmed" : "Result disputed");
      setShowDispute(false);
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save response");
    } finally {
      setBusy(false);
    }
  };

  const disputedNotes = confirmations.filter((c) => c.state === "disputed" && c.note);

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-medium text-foreground">Player confirmations</h2>
        {matchStatus === "confirmed" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            <Check className="size-3" aria-hidden /> Match confirmed
          </span>
        )}
        {matchStatus === "disputed" && (
          <span className="inline-flex items-center gap-1 rounded-md border border-destructive bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            <X className="size-3" aria-hidden /> Disputed
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-muted/40" />
      ) : (
        <ul className="mt-4 space-y-2">
          {participants.map((p) => {
            const row = byUser.get(p.user_id);
            const state = row?.state ?? "pending";
            return (
              <li
                key={p.user_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.display_name}
                    {p.user_id === currentUserId && (
                      <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Side {p.side_number}
                  </p>
                </div>
                <ConfirmationBadge state={state} />
              </li>
            );
          })}
        </ul>
      )}

      {/* Dispute notes */}
      {disputedNotes.length > 0 && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-destructive">
            Dispute notes
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {disputedNotes.map((c) => {
              const name =
                participants.find((p) => p.user_id === c.user_id)?.display_name ?? "Player";
              return (
                <li key={c.id}>
                  <span className="font-medium">{name}:</span> {c.note}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Your action */}
      {isParticipant && !matchLocked && (
        <div className="mt-5 border-t border-border pt-5">
          {myRow && myRow.state !== "pending" ? (
            <p className="text-sm text-muted-foreground">
              You {myRow.state === "confirmed" ? "confirmed" : "disputed"} this result.
            </p>
          ) : showDispute ? (
            <div className="space-y-3">
              <label htmlFor="dispute-note" className="text-sm font-medium text-foreground">
                What's wrong? <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="dispute-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., wrong final score for side 2"
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => respond("disputed", note)}
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden /> Submitting…
                    </>
                  ) : (
                    "Submit dispute"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowDispute(false);
                    setNote("");
                  }}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => respond("confirmed")}
                disabled={busy}
              >
                <Check className="size-4" aria-hidden /> Confirm result
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDispute(true)}
                disabled={busy}
              >
                <X className="size-4" aria-hidden /> Dispute
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ConfirmationBadge({ state }: { state: "pending" | "confirmed" | "disputed" }) {
  if (state === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
        <Check className="size-3" aria-hidden /> Confirmed
      </span>
    );
  }
  if (state === "disputed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-destructive bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <X className="size-3" aria-hidden /> Disputed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <Clock className="size-3" aria-hidden /> Pending
    </span>
  );
}
