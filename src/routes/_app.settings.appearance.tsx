import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/settings/appearance")({
  head: () => ({ meta: [{ title: "Appearance · Bisque" }] }),
  component: AppearanceSettingsPage,
});

type ThemeChoice = "light" | "dark" | "system";

function applyTheme(choice: ThemeChoice) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", choice === "dark" || (choice === "system" && prefersDark));
}

function parseTheme(value: string | null | undefined): ThemeChoice {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function AppearanceSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [theme, setTheme] = React.useState<ThemeChoice>("system");
  const [initial, setInitial] = React.useState<ThemeChoice>("system");
  const [busy, setBusy] = React.useState(false);

  const settingsQuery = useQuery({
    queryKey: ["user-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("appearance_theme")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  React.useEffect(() => {
    const next = parseTheme(settingsQuery.data?.appearance_theme);
    setTheme(next);
    setInitial(next);
    applyTheme(next);
  }, [settingsQuery.data]);

  React.useEffect(() => {
    const saved = parseTheme(window.localStorage.getItem("bisque.appearance"));
    if (settingsQuery.data || !user || saved === "system") return;
    setTheme(saved);
    applyTheme(saved);
  }, [settingsQuery.data, user]);

  function choose(next: ThemeChoice) {
    setTheme(next);
    applyTheme(next);
  }

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      const { data: existing, error: readError } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (readError) throw readError;

      const { error } = existing
        ? await supabase.from("user_settings").update({ appearance_theme: theme }).eq("user_id", user.id)
        : await supabase.from("user_settings").insert({ user_id: user.id, appearance_theme: theme });
      if (error) throw error;
      window.localStorage.removeItem("bisque.appearance");
      setInitial(theme);
      qc.invalidateQueries({ queryKey: ["user-settings", user.id] });
      toast.success("Appearance settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save appearance settings");
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
        Appearance
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Light, dark, follow system.</p>

      <section className="mt-8 rounded-xl border border-border bg-card p-4">
        <RadioGroup value={theme} onValueChange={(value) => choose(value as ThemeChoice)} className="gap-0">
          <ThemeOption value="light" title="Light" body="Use the light Bisque palette." />
          <ThemeOption value="dark" title="Dark" body="Use the dark Bisque palette." />
          <ThemeOption value="system" title="Follow system" body="Match this device's appearance setting." />
        </RadioGroup>
      </section>

      <Button type="button" disabled={theme === initial || busy || settingsQuery.isLoading} onClick={save} className="tap mt-6 w-full text-base">
        {busy ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function ThemeOption({ value, title, body }: { value: ThemeChoice; title: string; body: string }) {
  return (
    <Label htmlFor={`theme-${value}`} className="tap flex cursor-pointer items-center gap-4 border-b border-border py-4 last:border-b-0">
      <RadioGroupItem id={`theme-${value}`} value={value} />
      <span className="min-w-0">
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{body}</span>
      </span>
    </Label>
  );
}