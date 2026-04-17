import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Settings, FileText, LogOut } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile · Bisque" }] }),
  component: ProfilePage,
});

interface ProfileRow {
  display_name: string;
  club: string | null;
  gc_handicap: number;
  gc_index: number;
  handicap_source: string;
}

function ProfilePage() {
  const { user, signOut } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, club, gc_handicap, gc_index, handicap_source")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profile = profileQuery.data;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-12 pt-8 md:pt-12">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {profile?.display_name ?? "Profile"}
          </h1>
          {profile?.club && (
            <p className="mt-1 text-sm text-muted-foreground">{profile.club}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Link
          to="/settings"
          className="tap inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings className="size-4" aria-hidden />
        </Link>
      </header>

      {/* Handicap card */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Handicap card
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
            {profile?.handicap_source ?? "self"}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <div className="score handicap-num text-7xl text-foreground">
              {profile?.gc_handicap ?? "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">GC handicap</div>
          </div>
          <div>
            <div className="font-display tabular text-3xl text-muted-foreground">
              {profile?.gc_index ?? "—"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Index</div>
          </div>
        </div>
        <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          Bisque uses the Croquet England methodology to estimate index changes. Your club
          handicapper remains the official record-keeper.
        </p>
      </section>

      {/* Stats grid placeholder */}
      <section className="mb-6 grid grid-cols-3 gap-3">
        <StatCell label="Matches" value="0" />
        <StatCell label="Win rate" value="—" />
        <StatCell label="Streak" value="—" />
      </section>

      <section className="mb-6">
        <Link
          to="/profile"
          className="tap flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <FileText className="size-5 text-primary" aria-hidden />
          <div className="flex-1">
            <div className="font-medium text-foreground">Printable handicap card</div>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </div>
        </Link>
      </section>

      <button
        type="button"
        onClick={() => void signOut()}
        className="tap inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden /> Sign out
      </button>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-display tabular text-2xl text-foreground">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
