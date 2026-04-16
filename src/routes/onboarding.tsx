import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { PublicShell } from "@/components/layout/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to Bisque" },
      { name: "description", content: "Set up your Bisque profile in three quick steps." },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = ["Your details", "Handicap", "Terms"] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(0);

  // Step 1
  const [name, setName] = React.useState("");
  const [club, setClub] = React.useState("");
  // Step 2
  const [handicap, setHandicap] = React.useState<string>("");
  const [unknown, setUnknown] = React.useState(false);
  // Step 3
  const [accepted, setAccepted] = React.useState(false);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else navigate({ to: "/" });
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  const canAdvance =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && (unknown || handicap !== "")) ||
    (step === 2 && accepted);

  return (
    <PublicShell hideHeader>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border",
              )}
              aria-hidden
            />
          ))}
        </div>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>

        <div className="mt-8 flex-1">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
                  What should we call you?
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Your name appears on leaderboards and match cards.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="tap"
                    placeholder="Margaret Hennessey"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club">Club (optional)</Label>
                  <Input
                    id="club"
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    className="tap"
                    placeholder="Hurlingham CC"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
                  Your Golf Croquet handicap?
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Croquet England scale, −3 to 24. We’ll start your index at the lower trigger.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handicap">Handicap</Label>
                  <Input
                    id="handicap"
                    type="number"
                    min={-3}
                    max={24}
                    step={1}
                    inputMode="numeric"
                    value={handicap}
                    disabled={unknown}
                    onChange={(e) => setHandicap(e.target.value)}
                    className="tap text-lg handicap-num"
                    placeholder="e.g. 10"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setUnknown((v) => !v)}
                  className={cn(
                    "tap w-full rounded-xl border px-4 text-left transition-colors",
                    unknown
                      ? "border-primary bg-primary/[0.06] text-foreground"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-5 shrink-0 rounded-md border-2 transition-colors",
                        unknown ? "border-primary bg-primary" : "border-border",
                      )}
                      aria-hidden
                    />
                    <div>
                      <div className="text-sm font-medium">I don’t know my handicap</div>
                      <div className="text-xs text-muted-foreground">
                        We’ll start you at 12 and adjust as you play.
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Bisque uses the Croquet England methodology to estimate index changes. Your club
                handicapper remains the official record-keeper.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
                  One last thing.
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Quickly review and accept so we can get you on the lawn.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAccepted((v) => !v)}
                className={cn(
                  "tap w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  accepted
                    ? "border-primary bg-primary/[0.06]"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 size-5 shrink-0 rounded-md border-2 transition-colors",
                      accepted ? "border-primary bg-primary" : "border-border",
                    )}
                    aria-hidden
                  />
                  <div className="text-sm">
                    I agree to the{" "}
                    <a href="#" className="text-primary underline">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary underline">
                      Privacy Policy
                    </a>
                    , and I understand that Bisque’s handicap calculations are estimates.
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 ? (
            <Button variant="outline" onClick={back} className="tap flex-1">
              Back
            </Button>
          ) : (
            <Link
              to="/"
              className="tap inline-flex flex-1 items-center justify-center rounded-md border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </Link>
          )}
          <Button onClick={next} disabled={!canAdvance} className="tap flex-[2]">
            {step === STEPS.length - 1 ? "Finish" : "Continue"}
          </Button>
        </div>
      </div>
    </PublicShell>
  );
}
