import { createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth/AuthProvider";

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
        <SettingsRow title="Account" body="Edit your name, club, and handicap." />
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
