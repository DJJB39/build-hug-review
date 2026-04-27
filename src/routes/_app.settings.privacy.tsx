import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/settings/privacy")({
  head: () => ({ meta: [{ title: "Privacy & data · Bisque" }] }),
  component: PrivacySettingsPage,
});

function PrivacySettingsPage() {
  const { user } = useAuth();

  async function exportData() {
    if (!user) return;

    const [profile, memberships, leagues, matches, confirmations, handicapEvents] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("league_members").select("*").eq("user_id", user.id),
      supabase.from("leagues").select("*"),
      supabase.from("matches").select("*"),
      supabase.from("match_confirmations").select("*"),
      supabase.from("handicap_events").select("*"),
    ]);

    const firstError = [profile, memberships, leagues, matches, confirmations, handicapEvents].find(
      (result) => result.error,
    )?.error;
    if (firstError) {
      toast.error(firstError.message);
      return;
    }

    const payload = {
      exported_at: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      profile: profile.data,
      memberships: memberships.data ?? [],
      visible_leagues: leagues.data ?? [],
      visible_matches: matches.data ?? [],
      match_confirmations: confirmations.data ?? [],
      handicap_events: handicapEvents.data ?? [],
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bisque-data-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
    toast.success("Export started");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-12 pt-8 md:pt-12">
      <Link to="/settings" className="tap mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Settings
      </Link>
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
        Privacy & data
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Export your data, delete your account.</p>

      <section className="mt-8 space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="font-medium text-foreground">Export data</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Download your profile, memberships, visible leagues, matches, confirmations, and handicap events.
          </div>
          <Button type="button" onClick={exportData} className="tap mt-5 w-full text-base">
            <Download className="size-4" aria-hidden /> Export data
          </Button>
        </div>

        <div className="rounded-xl border border-destructive/40 bg-card p-4">
          <div className="font-medium text-foreground">Delete account</div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Account deletion needs secure backend verification before it can be enabled.
          </div>
          <Button type="button" variant="destructive" disabled className="tap mt-5 w-full text-base">
            Delete account
          </Button>
        </div>
      </section>
    </div>
  );
}