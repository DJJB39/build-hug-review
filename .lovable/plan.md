

# Connect the existing pieces — make leagues and matches actually usable

The match-creation and live-scoring pages already work. What's missing is the navigation between them and a few "Coming soon" labels that should now be "live". This is a wiring pass, not new features.

## Changes

### 1. `src/routes/_app.leagues.$leagueId.tsx` — the critical fix

Replace the placeholder with a real league hub:
- **"+ New match" primary button** → `/leagues/$leagueId/matches/new`
- **Members section** — list profiles from `league_members` joined with `profiles` (display_name, gc_handicap), showing the admin badge for the owner
- **Recent matches section** — list `matches` for this league (most recent first), each linking to `/leagues/$leagueId/matches/$matchId`, showing match_type, target_score, status, and final score if present
- **Join code + share** — show `join_code` with a copy-to-clipboard button (admin only)
- Keep the discipline/format/target_score line that's already there
- Remove the "next iteration" placeholder block

### 2. `src/routes/_app.home.tsx` — fix the broken CTA

The floating "Record a match" button currently goes to `/leagues`, which is useless. Two options, I'll go with (a):

- **(a)** If the user has exactly one league, link straight to that league's `/matches/new`. If they have multiple, link to `/leagues` with a hint. If zero, hide the button and surface the "Create your first league" empty state more prominently.
- (b) Always go to `/leagues` and call the button "Pick a league" — worse UX.

### 3. `src/routes/_app.leagues.new.tsx` — finish the AC work

The AC migration shipped (`ac_handicap` column, `discipline` enum). Enable the AC radio button, remove the "Coming soon" hint. The form logic already handles both disciplines — only the disabled state needs removing.

### 4. `src/routes/_app.settings.tsx` — fix the handicap range bug

Change min/max from `0..36` to `-3..24` to match the DB constraint and the rest of the app. Update the error message. Also surface `ac_handicap` alongside `gc_handicap` (the column exists; Settings ignores it).

### 5. Honest "Coming soon" cleanup

Leave the three Settings rows (Notifications, Appearance, Privacy & data) and the Profile "Printable handicap card" labeled as Coming soon — those genuinely aren't built and shouldn't pretend otherwise. **Don't** silently remove them; they signal roadmap.

## Out of scope for this pass

- Leaderboards, head-to-head stats, fixtures (real feature work, separate task)
- Notifications, theme switcher, data export (the three Settings rows)
- Printable handicap card
- Real handicap-event recalculation on match end (the current flow logs a no-op event — works but doesn't change handicaps)

## Files touched

- **Edit:** `src/routes/_app.leagues.$leagueId.tsx` (full rewrite of the body)
- **Edit:** `src/routes/_app.home.tsx` (CTA target logic)
- **Edit:** `src/routes/_app.leagues.new.tsx` (enable AC radio)
- **Edit:** `src/routes/_app.settings.tsx` (handicap range, add AC field)

## Verification after shipping

1. Sign in → Home → "Record a match" goes somewhere sensible
2. Home → "Create your first league" → fill form → land on league detail → see "+ New match" button → reach the match form
3. Create a match → score it → end it → confirmation panel appears
4. Settings → save handicap of 20 (works) and 30 (rejected with clear error)

