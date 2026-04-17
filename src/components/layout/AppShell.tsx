import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Trophy, User as UserIcon, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { BisqueMark } from "@/components/brand/BisqueWordmark";

interface AppShellProps {
  children: React.ReactNode;
  /** Hides the bottom tab bar — used on full-screen flows like the live tracker. */
  immersive?: boolean;
}

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/leagues", label: "Leagues", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/settings", label: "More", icon: Menu },
] as const;

export function AppShell({ children, immersive }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background md:flex-row">
      {/* Desktop left rail */}
      {!immersive && (
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card/40 px-4 py-6 md:flex">
          <Link to="/home" className="mb-8 flex items-center gap-2 px-2">
            <BisqueMark size={22} className="text-primary" />
            <span className="font-display text-lg font-medium tracking-tight">Bisque</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "tap relative flex items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/[0.08] text-primary ring-left"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main content area */}
      <main
        className={cn(
          "page-enter min-w-0 flex-1",
          !immersive && "pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      {!immersive && (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "tap relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary"
                  />
                )}
                <Icon className="size-5" aria-hidden />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
