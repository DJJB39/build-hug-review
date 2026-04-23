import * as React from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/_app/leagues/$leagueId/matches/new")({
  head: () => ({ meta: [{ title: "New match · Bisque" }] }),
  component: NewMatchPage,
});

type MatchType = "singles" | "doubles";
type TargetScore = 7 | 14 | 21;

interface MemberRow {
  user_id: string;
  display_name: string;
  gc_handicap: number;
  gc_index: number;
}

function NewMatchPage() {
  const { leagueId } = useParams({ from: "/_app/leagues/$leagueId/matches/new" });
  const navigate = useNavigate();
  const { user } = useAuth();

  const [matchType, setMatchType] = React.useState<MatchType>("singles");
  const [targetScore, setTargetScore] = React.useState<TargetScore>(7);
  const [side1, setSide1] = React.useState<string[]>([]);
  const [side2, setSide2] = React.useState<string[]>([]);
  const [handicapApplied, setHandicapApplied] = React.useState(true);
  const [scheduledFor, setScheduledFor] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  const { data: members = [], isLoading: loadingMembers } = useQuery<MemberRow[]>({
    queryKey: ["league-members-with-profile", leagueId],
    queryFn: async () => {
      const { data: lm, error: lmError } = await supabase
        .from("league_members")
        .select("user_id")
        .eq("league_id", leagueId);
      if (lmError) throw lmError;
      const ids = (lm ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("id, display_name, gc_handicap, gc_index")
        .in("id", ids);
      if (pError) throw pError;
      return (profiles ?? []).map((p) => ({
        user_id: p.id,
        display_name: p.display_name,
        gc_handicap: p.gc_handicap,
        gc_index: p.gc_index,
      }));
    },
  });

  const playersPerSide = matchType === "singles" ? 1 : 2;

  // Enforce per-side player count when type changes.
  React.useEffect(() => {
    setSide1((prev) => prev.slice(0, playersPerSide));
    setSide2((prev) => prev.slice(0, playersPerSide));
  }, [playersPerSide]);

  const overlap = React.useMemo(
    () => side1.filter((id) => side2.includes(id)),
    [side1, side2],
  );

  const errors = React.useMemo(() => {
    const e: { side1?: string; side2?: string } = {};
    if (side1.length < 1) e.side1 = "Add at least one player.";
    else if (side1.length !== playersPerSide)
      e.side1 = `${matchType === "singles" ? "Singles" : "Doubles"} needs ${playersPerSide} player${playersPerSide > 1 ? "s" : ""} per side.`;
    if (side2.length < 1) e.side2 = "Add at least one player.";
    else if (side2.length !== playersPerSide)
      e.side2 = `${matchType === "singles" ? "Singles" : "Doubles"} needs ${playersPerSide} player${playersPerSide > 1 ? "s" : ""} per side.`;
    if (overlap.length > 0) {
      const names = overlap
        .map((id) => members.find((m) => m.user_id === id)?.display_name ?? "Player")
        .join(", ");
      e.side2 = `${names} can't be on both sides.`;
    }
    return e;
  }, [side1, side2, playersPerSide, matchType, overlap, members]);

  const isValid = !errors.side1 && !errors.side2 && overlap.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user) return;
    setSubmitting(true);
    try {
      // 1. Create match
      const { data: match, error: matchErr } = await supabase
        .from("matches")
        .insert({
          league_id: leagueId,
          created_by: user.id,
          match_type: matchType,
          target_score: targetScore,
          handicap_applied: handicapApplied,
          status: "awaiting_confirmation",
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        })
        .select("id")
        .single();
      if (matchErr) throw matchErr;

      // 2. Create the two sides
      const { data: sides, error: sidesErr } = await supabase
        .from("match_sides")
        .insert([
          { match_id: match.id, side_number: 1 },
          { match_id: match.id, side_number: 2 },
        ])
        .select("id, side_number");
      if (sidesErr) throw sidesErr;

      const side1Row = sides?.find((s) => s.side_number === 1);
      const side2Row = sides?.find((s) => s.side_number === 2);
      if (!side1Row || !side2Row) throw new Error("Failed to create match sides.");

      // 3. Snapshot players with current handicap
      const memberMap = new Map(members.map((m) => [m.user_id, m]));
      const playerRows = [
        ...side1.map((uid) => ({ side_id: side1Row.id, user_id: uid })),
        ...side2.map((uid) => ({ side_id: side2Row.id, user_id: uid })),
      ].map((row) => {
        const m = memberMap.get(row.user_id);
        return {
          ...row,
          handicap_snapshot: m?.gc_handicap ?? 12,
          index_snapshot: m?.gc_index ?? 1200,
        };
      });

      const { error: playersErr } = await supabase
        .from("match_side_players")
        .insert(playerRows);
      if (playersErr) throw playersErr;

      toast.success("Match created");
      navigate({
        to: "/leagues/$leagueId/matches/$matchId",
        params: { leagueId, matchId: match.id },
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Could not create match.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

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
        New match.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Set up the sides, then jump straight to scoring.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Match type */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Match type</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["singles", "doubles"] as const).map((opt) => (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-4 py-3 text-sm transition-colors hover:bg-accent",
                  matchType === opt && "ring-left border-primary bg-primary-soft",
                )}
              >
                <input
                  type="radio"
                  name="match-type"
                  value={opt}
                  checked={matchType === opt}
                  onChange={() => setMatchType(opt)}
                  className="sr-only"
                />
                <span className="capitalize">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Target score */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Target score</legend>
          <div className="grid grid-cols-3 gap-3">
            {([7, 14, 21] as const).map((score) => (
              <label
                key={score}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-3 text-sm transition-colors hover:bg-accent",
                  targetScore === score && "ring-left border-primary bg-primary-soft",
                )}
              >
                <input
                  type="radio"
                  name="target-score"
                  value={score}
                  checked={targetScore === score}
                  onChange={() => setTargetScore(score)}
                  className="sr-only"
                />
                <span className="tabular">First to {score}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Side 1 */}
        <PlayerSidePicker
          label="Side 1"
          selected={side1}
          onChange={setSide1}
          members={members}
          disabledIds={side2}
          maxPlayers={playersPerSide}
          loading={loadingMembers}
          error={errors.side1}
        />

        {/* Side 2 */}
        <PlayerSidePicker
          label="Side 2"
          selected={side2}
          onChange={setSide2}
          members={members}
          disabledIds={side1}
          maxPlayers={playersPerSide}
          loading={loadingMembers}
          error={errors.side2}
        />

        {/* Handicap toggle */}
        <div className="flex items-center justify-between rounded-md border border-input bg-background px-4 py-3">
          <div>
            <Label htmlFor="handicap" className="text-sm font-medium">
              Apply handicaps
            </Label>
            <p className="text-xs text-muted-foreground">
              Snapshot each player's current handicap into this match.
            </p>
          </div>
          <Switch
            id="handicap"
            checked={handicapApplied}
            onCheckedChange={setHandicapApplied}
          />
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <Label htmlFor="scheduled-for" className="text-sm font-medium">
            Schedule for later <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="scheduled-for"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!isValid || submitting || loadingMembers}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Creating…
              </>
            ) : (
              "Continue to scoring"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface PlayerSidePickerProps {
  label: string;
  selected: string[];
  onChange: (next: string[]) => void;
  members: MemberRow[];
  disabledIds: string[];
  maxPlayers: number;
  loading: boolean;
  error?: string;
}

function PlayerSidePicker({
  label,
  selected,
  onChange,
  members,
  disabledIds,
  maxPlayers,
  loading,
  error,
}: PlayerSidePickerProps) {
  const [open, setOpen] = React.useState(false);
  const atCapacity = selected.length >= maxPlayers;

  const togglePlayer = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else if (!atCapacity) {
      onChange([...selected, id]);
      if (maxPlayers === 1) setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground tabular">
          {selected.length} / {maxPlayers}
        </span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={loading}
          >
            <span className="truncate text-muted-foreground">
              {atCapacity ? "Side full" : "Search players…"}
            </span>
            <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search by name…" />
            <CommandList>
              <CommandEmpty>No players found.</CommandEmpty>
              <CommandGroup>
                {members.map((m) => {
                  const isSelected = selected.includes(m.user_id);
                  const isOnOtherSide = disabledIds.includes(m.user_id);
                  const disabled = isOnOtherSide || (!isSelected && atCapacity);
                  return (
                    <CommandItem
                      key={m.user_id}
                      value={m.display_name}
                      disabled={disabled}
                      onSelect={() => togglePlayer(m.user_id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1 truncate">{m.display_name}</span>
                      <span className="ml-2 text-xs text-muted-foreground tabular">
                        h{m.gc_handicap}
                      </span>
                      {isOnOtherSide && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                          other side
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((id) => {
            const m = members.find((x) => x.user_id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
              >
                {m?.display_name ?? "Player"}
                <button
                  type="button"
                  onClick={() => togglePlayer(id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${m?.display_name ?? "player"}`}
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
