import * as React from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { BisqueWordmark } from "@/components/brand/BisqueWordmark";

interface PublicShellProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  className?: string;
}

/**
 * PublicShell — wraps unauthenticated routes (splash, login, signup, help, etc.)
 * with the Bisque header + footer.
 */
export function PublicShell({ children, hideHeader = false, className }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {!hideHeader && (
        <header className="border-b border-border/60">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
            <Link to="/" className="tap flex items-center" aria-label="Bisque home">
              <BisqueWordmark size="sm" />
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                to="/demo"
                className="tap inline-flex items-center rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                Demo
              </Link>
              <Link
                to="/help"
                className="tap inline-flex items-center rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                Help
              </Link>
              <Link
                to="/login"
                className="tap inline-flex items-center rounded-md px-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="tap inline-flex items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign up
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className={cn("page-enter flex-1", className)}>{children}</main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Bisque · Golf Croquet, tracked properly.</p>
          <div className="flex items-center gap-4">
            <Link to="/demo" className="hover:text-foreground">
              Demo
            </Link>
            <Link to="/help" className="hover:text-foreground">
              Help
            </Link>
            <a href="#" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
