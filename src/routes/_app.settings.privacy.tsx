import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadProjectMarkdown } from "@/lib/export/exportProjectMarkdown";

export const Route = createFileRoute("/_app/settings/privacy")({
  head: () => ({ meta: [{ title: "Privacy & data · Bisque" }] }),
  component: PrivacySettingsPage,
});

function PrivacySettingsPage() {
  function exportData() {
    downloadProjectMarkdown("bisque-data-export.md");
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
            Download a Markdown export of the current Bisque project source and app configuration.
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