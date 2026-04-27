import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/settings/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Bisque" }] }),
  component: NotificationsSettingsPage,
});

type NotificationSettings = {
  matchResults: boolean;
  matchConfirmations: boolean;
  leagueActivity: boolean;
};

const DEFAULT_SETTINGS: NotificationSettings = {
  matchResults: true,
  matchConfirmations: true,
  leagueActivity: true,
};

function NotificationsSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [initial, setInitial] = React.useState(DEFAULT_SETTINGS);
  const [busy, setBusy] = React.useState(false);

  const settingsQuery = useQuery({
    queryKey: ["user-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("notify_match_results, notify_match_confirmations, notify_league_activity")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  React.useEffect(() => {
    const next = settingsQuery.data
      ? {
          matchResults: settingsQuery.data.notify_match_results,
          matchConfirmations: settingsQuery.data.notify_match_confirmations,
          leagueActivity: settingsQuery.data.notify_league_activity,
        }
      : DEFAULT_SETTINGS;
    setSettings(next);
    setInitial(next);
  }, [settingsQuery.data]);

  React.useEffect(() => {
    const raw = window.localStorage.getItem("bisque.notificationSettings");
    if (!raw || settingsQuery.data || !user) return;
    try {
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as NotificationSettings;
      setSettings(parsed);
    } catch {
      window.localStorage.removeItem("bisque.notificationSettings");
    }
  }, [settingsQuery.data, user]);

  const dirty = JSON.stringify(settings) !== JSON.stringify(initial);

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        notify_match_results: settings.matchResults,
        notify_match_confirmations: settings.matchConfirmations,
        notify_league_activity: settings.leagueActivity,
      });
      if (error) throw error;
      window.localStorage.removeItem("bisque.notificationSettings");
      setInitial(settings);
      qc.invalidateQueries({ queryKey: ["user-settings", user.id] });
      toast.success("Notification settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save notification settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-12 pt-8 md:pt-12">
      <Link to="/settings" className="tap mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Settings
      </Link>
      <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
        Notifications
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Match results, confirmations, league activity.</p>

      <section className="mt-8 space-y-3 rounded-xl border border-border bg-card p-4">
        <PreferenceSwitch title="Match results" body="Updates when a league match is completed." checked={settings.matchResults} onCheckedChange={(checked) => setSettings((s) => ({ ...s, matchResults: checked }))} />
        <PreferenceSwitch title="Match confirmations" body="Reminders when a result needs your confirmation." checked={settings.matchConfirmations} onCheckedChange={(checked) => setSettings((s) => ({ ...s, matchConfirmations: checked }))} />
        <PreferenceSwitch title="League activity" body="New members and league-level updates." checked={settings.leagueActivity} onCheckedChange={(checked) => setSettings((s) => ({ ...s, leagueActivity: checked }))} />
      </section>

      <Button type="button" disabled={!dirty || busy || settingsQuery.isLoading} onClick={save} className="tap mt-6 w-full text-base">
        {busy ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function PreferenceSwitch({ title, body, checked, onCheckedChange }: { title: string; body: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="font-medium text-foreground">{title}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{body}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}