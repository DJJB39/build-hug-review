import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";

export const Route = createFileRoute("/_app/leagues/join")({
  head: () => ({ meta: [{ title: "Join league · Bisque" }] }),
  component: JoinLeaguePage,
});

function JoinLeaguePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const trimmed = code.trim().toUpperCase();
  const isValidLength = trimmed.length === 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidLength || !user) return;
    setBusy(true);
    setError(null);

    try {
      // 1. Look up league by join code (case-insensitive via uppercased input).
      const { data: league, error: lErr } = await supabase
        .from("leagues")
        .select("id, name")
        .eq("join_code", trimmed)
        .maybeSingle();
      if (lErr) throw lErr;
      if (!league) {
        const msg = "League not found. Check the code and try again.";
        setError(msg);
        toast.error(msg);
        return;
      }

      // 2. Check existing membership.
      const { data: existing, error: mErr } = await supabase
        .from("league_members")
        .select("id")
        .eq("league_id", league.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (mErr) throw mErr;
      if (existing) {
        const msg = "You're already in this league.";
        setError(msg);
        toast.error(msg);
        return;
      }

      // 3. Insert membership.
      const { error: insErr } = await supabase.from("league_members").insert({
        league_id: league.id,
        user_id: user.id,
        role: "player",
      });
      if (insErr) throw insErr;

      toast.success(`Joined ${league.name}`);
      void navigate({
        to: "/leagues/$leagueId",
        params: { leagueId: league.id },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not join league.";
      setError(msg);
      toast.error(msg);
    } finally {
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
          Join a league.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Got a code from your league owner? Drop it in.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="join-code">Enter league join code</Label>
          <Input
            id="join-code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={8}
            placeholder="e.g., ABC12345"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            className="tap tabular tracking-widest uppercase"
          />
          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!isValidLength || busy}
          className="tap w-full text-base"
        >
          {busy ? "Joining…" : "Join league"}
        </Button>
      </form>
    </div>
  );
}
