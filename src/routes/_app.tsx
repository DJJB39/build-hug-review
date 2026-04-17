import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { BisqueMark } from "@/components/brand/BisqueWordmark";

export const Route = createFileRoute("/_app")({
  // Best-effort redirect when we can read a session synchronously from storage.
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // If the listener tells us the session ended, bounce out.
  if (!loading && !session) {
    void router.navigate({ to: "/login" });
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <BisqueMark size={28} className="animate-pulse text-primary" />
          <span className="text-xs uppercase tracking-wider">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
