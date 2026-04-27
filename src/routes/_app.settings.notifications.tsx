import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Bisque" }] }),
  component: NotificationsSettingsPage,
});

const STORAGE_KEY = "bisque.notificationSettings";

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
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [initial, setInitial] = React.useState(DEFAULT_SETTINGS);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as NotificationSettings;
      setSettings(parsed);
      setInitial(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const dirty = JSON.stringify(settings) !== JSON.stringify(initial);

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setInitial(settings);
    toast.success("Notification settings saved");
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

      <Button type="button" disabled={!dirty} onClick={save} className="tap mt-6 w-full text-base">
        Save changes
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