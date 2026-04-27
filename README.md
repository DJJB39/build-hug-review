# Bisque

A mobile-first croquet league companion for recording handicap singles matches, managing league membership, confirming results, and keeping a visible handicap history.

Bisque is built for the real rhythm of UK club croquet: create a league, invite players with a join code, record a first-to-7 singles match, use bisques/extra strokes, confirm the result, and review recent match history.

## Live demo

- Published app: https://build-hug-review.lovable.app
- Lovable project: https://lovable.dev/projects/113f5643-63cf-4682-a608-b4908678278e

> Frontend updates in Lovable need to be published from the Publish dialog. Backend/database changes apply automatically.

## What works today

- Email/auth-backed app access
- Player profile and account settings
- GC and AC handicap fields on the profile
- Backend-backed notification preferences
- Backend-backed appearance preference
- League creation with GC/AC discipline, singles format, handicap settings, and join code
- Join league by code
- League hub with members, recent matches, and admin-only join-code copy
- New singles match creation from a league
- Live scorekeeping with target score, extra strokes received/used, and match completion
- Post-match confirmation/dispute flow
- Privacy & data export for the signed-in user's visible app data

## Demo data

A realistic seed script is included at:

```text
supabase/seed.sql
```

It creates:

- 8 realistic UK croquet demo players
- 1 active GC Singles Handicap league: `Watford Spring Handicap Singles 2026`
- 12 confirmed singles matches with varied scores
- Match sides, side players, confirmation rows, extra-stroke usage, and handicap event history

The seed only uses current app functionality. It does **not** add leaderboards, public demo browsing, admin demo buttons, or any other feature that the app does not currently provide.

### Running the seed

1. Run the app migrations.
2. Create at least one signed-in user.
3. Run `supabase/seed.sql` against the database.

The script uses the first authenticated user as the demo league owner/admin. It is idempotent for the demo league join code `WATFRD26`, so rerunning it clears and recreates that demo dataset.

## Tech stack

- TanStack Start + React 19
- Vite 7
- Tailwind CSS v4 design tokens
- Lovable Cloud database/auth
- Cloudflare-compatible deployment target
- shadcn/Radix UI primitives
- TanStack Query

## Local development

```bash
bun install
bun run dev
```

Production build:

```bash
bun run build
```

## Deploying

This project targets a Cloudflare-compatible runtime via the existing Vite/worker configuration. In Lovable, publish from the editor to deploy the public site. If self-hosting, build the worker output and deploy using your Cloudflare Workers/Pages workflow.

## Project shape

```text
src/routes/                         App routes
src/components/                     Shared UI and layout
src/lib/                            App utilities
src/integrations/supabase/          Generated backend client/types
supabase/migrations/                Database schema migrations
supabase/seed.sql                   Demo dataset
```

## Security notes

- User roles are stored separately from profiles.
- League membership and settings are protected with row-level policies.
- Join codes are exposed through restricted backend logic.
- Preferences are backend-backed per user, not stored in localStorage.
