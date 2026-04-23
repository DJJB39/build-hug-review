import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · Bisque" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-12 pt-8 md:pt-12">
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

      <section className="mt-8 space-y-3">
        <AccountCard />
        <SettingsRow title="Notifications" body="Match results, confirmations, league activity." />
        <SettingsRow title="Appearance" body="Light, dark, follow system." />
        <SettingsRow title="Privacy & data" body="Export your data, delete your account." />
      </section>

      <button
        type="button"
        onClick={() => void signOut()}
        className="tap mt-10 inline-flex w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}

function AccountCard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, club, gc_handicap, gc_index")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Initial values pulled from auth metadata + profile row.
  const initial = React.useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const metaName =
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      (meta.display_name as string | undefined) ??
      "";
    return {
      fullName: profile?.display_name ?? metaName ?? "",
      club: profile?.club ?? "",
      handicap: profile?.gc_handicap ?? 12,
      index: profile?.gc_index ?? 1200,
    };
  }, [profile, user]);

  const [fullName, setFullName] = React.useState("");
  const [club, setClub] = React.useState("");
  const [handicap, setHandicap] = React.useState<number | "">(12);
  const [busy, setBusy] = React.useState(false);

  // Hydrate fields when initial values load.
  React.useEffect(() => {
    setFullName(initial.fullName);
    setClub(initial.club);
    setHandicap(initial.handicap);
  }, [initial]);

  const handicapNum = handicap === "" ? Number.NaN : Number(handicap);
  const handicapInvalid =
    handicap !== "" && (Number.isNaN(handicapNum) || handicapNum < 0 || handicapNum > 36);

  const dirty =
    fullName.trim() !== initial.fullName ||
    (club.trim() || "") !== (initial.club || "") ||
    (handicap !== "" && handicapNum !== initial.handicap);

  const canSave = dirty && !handicapInvalid && fullName.trim().length > 0 && handicap !== "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !user) return;
    setBusy(true);
    try {
      // 1. Auth metadata (full_name)
      const { error: aErr } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), display_name: fullName.trim() },
      });
      if (aErr) throw aErr;

      // 2. Profile row (display_name, club, gc_handicap)
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          display_name: fullName.trim(),
          club: club.trim() || null,
          gc_handicap: handicapNum,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-medium text-foreground">Account</div>
      <div className="mt-0.5 text-sm text-muted-foreground">
        Edit your name, club, and handicap.
      </div>

      {isLoading ? (
        <div className="mt-4 h-32 animate-pulse rounded-lg bg-muted/40" />
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="tap"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club">
              Home club <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="club"
              type="text"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className="tap"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="handicap">GC handicap</Label>
              <Input
                id="handicap"
                type="number"
                min={0}
                max={36}
                step={1}
                inputMode="numeric"
                value={handicap}
                onChange={(e) => {
                  const v = e.target.value;
                  setHandicap(v === "" ? "" : Number(v));
                }}
                className="tap tabular"
                aria-invalid={handicapInvalid}
              />
              {handicapInvalid && (
                <p className="text-xs font-medium text-destructive">
                  Handicap must be between 0 and 36.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="index">Index</Label>
              <Input
                id="index"
                type="number"
                value={initial.index}
                readOnly
                className="tap tabular bg-muted/40"
              />
            </div>
          </div>

          <Button type="submit" disabled={!canSave || busy} className="tap w-full text-base">
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </form>
      )}
    </div>
  );
}

function SettingsRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-medium text-foreground">{title}</div>
      <div className="mt-0.5 text-sm text-muted-foreground">{body}</div>
      <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-primary">
        Coming soon
      </div>
    </div>
  );
}
