import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/_app/settings/appearance")({
  head: () => ({ meta: [{ title: "Appearance · Bisque" }] }),
  component: AppearanceSettingsPage,
});

type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "bisque.appearance";

function applyTheme(choice: ThemeChoice) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", choice === "dark" || (choice === "system" && prefersDark));
}

function AppearanceSettingsPage() {
  const [theme, setTheme] = React.useState<ThemeChoice>("system");
  const [initial, setInitial] = React.useState<ThemeChoice>("system");

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    const next = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setTheme(next);
    setInitial(next);
    applyTheme(next);
  }, []);

  function choose(next: ThemeChoice) {
    setTheme(next);
    applyTheme(next);
  }

  function save() {
    window.localStorage.setItem(STORAGE_KEY, theme);
    setInitial(theme);
    toast.success("Appearance settings saved");
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

      <Button type="button" disabled={theme === initial} onClick={save} className="tap mt-6 w-full text-base">
        Save changes
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