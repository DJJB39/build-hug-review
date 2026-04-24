import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leagues/new")({
  head: () => ({ meta: [{ title: "New league · Bisque" }] }),
  component: NewLeaguePage,
});

type Discipline = "gc" | "ac";

const DISCIPLINE_LABEL: Record<Discipline, string> = {
  gc: "Golf Croquet (GC)",
  ac: "Association Croquet (AC)",
};

const DISCIPLINE_HINT: Record<Discipline, string> = {
  gc: "Hoop-by-hoop · most common in club play.",
  ac: "Long-form · break-building.",
};

function NewLeaguePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = React.useState("");
  const [discipline, setDiscipline] = React.useState<Discipline>("gc");
  const [gcHandicap, setGcHandicap] = React.useState<string>("");
  const [acHandicap, setAcHandicap] = React.useState<string>("");
  const [profileGc, setProfileGc] = React.useState<number | null>(null);
  const [profileAc, setProfileAc] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState<{ name: boolean; handicap: boolean }>({
    name: false,
    handicap: false,
  });

  // Load current profile handicaps to prefill the active input.
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data, error: pErr } = await supabase
        .from("profiles")
        .select("gc_handicap, ac_handicap")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || pErr || !data) return;
      if (typeof data.gc_handicap === "number") {
        setProfileGc(data.gc_handicap);
        setGcHandicap(String(data.gc_handicap));
      }
      if (typeof data.ac_handicap === "number") {
        setProfileAc(data.ac_handicap);
        setAcHandicap(String(data.ac_handicap));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const trimmedName = name.trim();
  const nameLength = trimmedName.length;
  const nameValid = nameLength > 0 && nameLength <= 50;

  const activeHandicapStr = discipline === "gc" ? gcHandicap : acHandicap;
  const activeHandicapNum = Number(activeHandicapStr);
  const handicapValid =
    activeHandicapStr !== "" &&
    Number.isInteger(activeHandicapNum) &&
    activeHandicapNum >= -3 &&
    activeHandicapNum <= 24;

  const formValid = nameValid && handicapValid;

  function selectDiscipline(next: Discipline) {
    if (next === discipline) return;
    setDiscipline(next);
    // Reset touched state on the handicap so we don't flash an error on switch.
    setTouched((t) => ({ ...t, handicap: false }));
    if (error) setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, handicap: true });
    if (!formValid || !user) return;
    setBusy(true);
    setError(null);

    try {
      // 1. Insert league with chosen discipline. join_code is auto-generated.
      const { data: league, error: lErr } = await supabase
        .from("leagues")
        .insert({
          name: trimmedName,
          owner_id: user.id,
          format: "singles",
          discipline,
          handicap_enabled: true,
        })
        .select("id")
        .single();
      if (lErr) throw lErr;
      if (!league) throw new Error("League could not be created.");

      // 2. Insert admin membership (no trigger attached). Swallow duplicates.
      const { error: mErr } = await supabase.from("league_members").insert({
        league_id: league.id,
        user_id: user.id,
        role: "admin",
      });
      if (mErr && mErr.code !== "23505") {
        throw mErr;
      }

      // 3. Update the matching profile handicap if it changed. Non-blocking.
      const currentProfileValue = discipline === "gc" ? profileGc : profileAc;
      if (currentProfileValue === null || activeHandicapNum !== currentProfileValue) {
        const patch =
          discipline === "gc"
            ? { gc_handicap: activeHandicapNum }
            : { ac_handicap: activeHandicapNum };
        const { error: upErr } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", user.id);
        if (upErr) {
          console.warn("Failed to update profile handicap:", upErr.message);
        }
      }

      toast.success("League created");
      void navigate({
        to: "/leagues/$leagueId",
        params: { leagueId: league.id },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create league.";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-12 pt-6 md:pt-12">
      <Link
        to="/leagues"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to Leagues
      </Link>

      <div className="mt-8">
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Create a league.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Name it, pick your discipline, and set your handicap. You can invite players right
          after.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {/* League name */}
        <div className="space-y-2">
          <Label htmlFor="league-name">League name</Label>
          <Input
            id="league-name"
            type="text"
            autoComplete="off"
            maxLength={50}
            placeholder="e.g., Sunday Sixes"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            className="tap"
          />
          <div className="flex items-center justify-between">
            {touched.name && !nameValid ? (
              <p className="text-xs font-medium text-destructive">
                League name is required
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {nameLength}/50
            </span>
          </div>
        </div>

        {/* Discipline */}
        <div
          className="space-y-2"
          role="radiogroup"
          aria-label="Croquet discipline"
        >
          <Label>Croquet discipline</Label>
          <div className="grid gap-2">
            {(["gc", "ac"] as const).map((d) => {
              const selected = discipline === d;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectDiscipline(d)}
                  className={cn(
                    "tap flex items-center justify-between rounded-md border bg-transparent px-3 py-3 text-left text-sm shadow-sm transition-colors",
                    selected
                      ? "border-primary text-foreground"
                      : "border-input text-foreground hover:bg-accent",
                  )}
                >
                  <span className="font-medium">{DISCIPLINE_LABEL[d]}</span>
                  {selected && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Handicap (swaps with discipline) */}
        <div className="space-y-2">
          <Label htmlFor="handicap">My {discipline.toUpperCase()} handicap</Label>
          <Input
            id="handicap"
            key={discipline}
            type="number"
            inputMode="numeric"
            min={-3}
            max={24}
            step={1}
            placeholder="e.g., 12"
            value={activeHandicapStr}
            onChange={(e) => {
              const next = e.target.value;
              if (discipline === "gc") setGcHandicap(next);
              else setAcHandicap(next);
              if (error) setError(null);
            }}
            onBlur={() => setTouched((t) => ({ ...t, handicap: true }))}
            className="tap tabular-nums"
          />
          {touched.handicap && !handicapValid ? (
            <p className="text-xs font-medium text-destructive">
              {activeHandicapStr === ""
                ? "Handicap is required"
                : "Handicap must be a whole number between −3 and 24"}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Range: −3 (best) to 24 (beginner)
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={!formValid || busy}
          className="tap w-full text-base"
        >
          {busy ? "Creating…" : "Create league"}
        </Button>
      </form>
    </div>
  );
}
