
# Bisque v1 — First Build Pass

A mobile-first PWA for Golf Croquet players: private leagues, dual leaderboards, a live extra-strokes tracker, and Croquet-England-style handicap tracking. Targeting all M-priority requirements from the RTM (excluding Stripe/payments per your direction — every user gets full access for now).

## Design system (established first)

- **Palette**: warm canvas `#F4F1EA`, lawn green `#2E5D3A` primary, ink near-black with green undertone, four ball-colour accents (clay, ochre, navy, charcoal) used sparingly. Light + dark themes.
- **Typography**: Fraunces (serif, variable) for titles, scores, handicap numbers; Geist for UI/body. Tabular numerals for scores.
- **Components**: 52px tap targets, 12px radii, no shadows (left-border highlight for "current"), no gradients, lawn-grid SVG motif on empty states.

## Data & backend (Lovable Cloud / Supabase)

Tables per RTM §4: `profiles`, `leagues`, `league_members`, `matches`, `match_sides`, `match_side_players`, `match_confirmations`, `handicap_events`, `subscriptions` (created but every user starts on a free trial that doesn't expire in this pass).

Postgres views for leaderboards: `v_league_table_gross` (Wins), `v_league_table_net` (Handicap Wins), `v_league_table_combined` (with bonus point for handicap upset), `v_head_to_head`.

Postgres RPC `apply_match_result(match_id)`: atomic — resolve winner, write `handicap_events` for each player, update `profiles.gc_index`, check trigger crossings (with 4-match lockout), apply doubles half-weight (±5).

RLS on every table. Auth via email+password and Google OAuth. Realtime subscriptions on league tables and match confirmations.

## Routes & screens

**Public**
- `/` Splash with wordmark, value prop, sign-up / log-in CTAs, three feature cards.
- `/login`, `/signup` — email+password and Google.
- `/onboarding` — 3-step (name+club → handicap with "I don't know" → terms).
- `/j/:code` — public join link (auth-gates then auto-joins).
- `/help` — FAQ accordion.

**Authenticated (bottom-tab nav: Home · Leagues · Profile · More)**
- `/home` — greeting with handicap/index, league cards with current position chip, empty state, FAB "+ Record a match".
- `/leagues/new` — single-page wizard (basics → format → scoring/handicap toggles → max players).
- `/leagues/:id` — header, **Wins / Handicap Wins / Combined** chip toggle (persisted per-league), full league table (Pos, Player, P, W, L, HF, HA, Diff, Pts), tappable rows → head-to-head modal, recent matches block, fixtures block, FAB.
- `/leagues/:id/members` — list + invite trigger (admin can remove).
- `/leagues/:id/settings` — admin-only edits + archive.
- **Invite modal** — large shareable URL, copy, WhatsApp, email, full-screen QR.
- `/matches/new` — league + type (singles/doubles) + side pickers + game length, validation against double-assignment, default ball colours.
- `/matches/:id` (pre-match briefing) — mirror-image side cards with handicaps, plain-English extra-strokes statement, collapsible "How this was calculated", **Start tracker** / **Enter final score** buttons.
- `/matches/:id/tracker` — full-screen, two huge score panels, +/− buttons, extra-strokes chip with "Use extra stroke" confirmation modal and 240ms flip animation, undo, sticky "End match" enabling at target score, optimistic local updates with debounced sync.
- `/matches/:id/confirm` — hero result display, handicap-upset chip if applicable, extra-strokes used summary, per-player confirmation checkboxes, dispute link, on full confirmation triggers RPC and shows handicap-change summary.
- `/profile` — handicap card (current handicap + index, 30-match index trend chart via Recharts), stats grid (matches, win rates, streak, last-5 form chips), recent matches.
- `/profile/handicap` — printable A4-style full handicap card with PDF export (free) and CSV export (gated to "paid" — shown but flagged as upgrade).
- `/settings` — account, notifications, theme (light/dark/system), delete account.

## Handicap engine (RTM §8)

- **Singles extra strokes**: `round((|hA − hB|)/2)`, 0.5 rounds up, weaker player receives.
- **Doubles**: pairwise (low of A vs high of B, low of B vs high of A) per the post-2019 WCF rule, plain-English statement(s) on the briefing.
- **Index changes**: ±10 per handicap singles match; ±5 for doubles ("half weight" chip in confirm).
- **Triggers**: full table from RTM §8.5 with 4-match anti-oscillation lockout.
- **Manual override** from profile: writes `handicap_events` (reason `manual`), resets index to lower trigger of new handicap, optionally flags `handicap_source = 'club'`.
- **Disclaimer** appears anywhere a handicap calculation is shown: *"Bisque uses the Croquet England methodology to estimate index changes. Your club handicapper remains the official record-keeper."*

## Cross-cutting

- PWA manifest + service worker, Apple touch icons, installable on iOS/Android.
- Responsive 360–1440px. Bottom-tab nav on mobile, left rail on desktop.
- Realtime updates on league table and confirmations (Supabase Realtime).
- Accessibility: AA contrast minimum, keyboard navigation, 48px+ targets.
- GDPR: privacy page, data export request, account deletion that anonymises historical match rows to "Former member".
- Motion: 180ms page fade+slide, 160ms score reveal, 240ms tracker flip — no bounce, no spring overshoot.

## Explicitly deferred from this pass

- Stripe Checkout, Customer Portal, webhook (paywall screens still appear, but show "coming soon" instead of taking payment).
- Offline-first service-worker queue for the live tracker (online-only sync this pass).
- Web push notifications (REQ-124, Should-have).
- Association Croquet, native apps, in-app chat, OCR scorecards, photo upload, lawn diagrams, hoop-by-hoop scoring.

## First-run sanity

- Seed three demo players + a sample "Friendly Summer League" so the new account screens have something to look at while you're testing flows.
- Test scenarios from RTM §10: singles upset, trigger crossing, doubles extra strokes — verified against the engine before declaring done.
