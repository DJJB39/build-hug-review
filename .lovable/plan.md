# Fix the Leagues empty-state actions

I reviewed the Leagues page and the related route files. The three visible controls are currently rendered as route links:

- `Create league` → `/leagues/new`
- `Join with code` → `/leagues/join`
- `New` → `/leagues/new`

The route files for both `/leagues/new` and `/leagues/join` exist, so the likely issue is interaction/routing behavior rather than missing pages. The `New` button is also redundant with the empty-state `Create league` action.

## Changes to make

### 1. Remove the duplicate `New` button
Edit `src/routes/_app.leagues.tsx` so the header only shows:

- `Join with code`

When the user has no leagues, the primary `Create league` button remains in the empty state. This avoids two competing ways to do the same thing.

### 2. Make `Join with code` mobile-friendly and explicit
Update the header action layout in `src/routes/_app.leagues.tsx` so `Join with code` behaves like a proper full tap target on small screens:

- Keep it as a TanStack Router `<Link>` to `/leagues/join`
- Use the existing `tap` helper
- Avoid cramped wrapping where possible
- Keep the visual hierarchy secondary to `Create league`

### 3. Make the empty-state `Create league` action unmistakably functional
Update the empty-state CTA in `src/routes/_app.leagues.tsx` to keep it as the single primary action:

- `<Link to="/leagues/new">Create league</Link>`
- Strong primary styling
- Full, reliable tap target on mobile

### 4. Add defensive diagnostics for the league creation/join routes
Review and tighten the entry behavior of:

- `src/routes/_app.leagues.new.tsx`
- `src/routes/_app.leagues.join.tsx`

The goal is to ensure if navigation succeeds but backend submission fails, the user sees a clear error rather than thinking the button did nothing. I’ll keep the form fields filled on errors.

## Technical notes

- No database changes are expected.
- No route tree edits; TanStack generates that automatically.
- Use typed TanStack Router links, not string interpolation.
- Only code paths related to the Leagues list, Create League page, and Join League page will be touched.

## Verification

After implementation I will verify:

1. On `/leagues`, tapping `Create league` opens `/leagues/new`.
2. On `/leagues`, tapping `Join with code` opens `/leagues/join`.
3. The duplicate `New` button is gone.
4. The create and join forms still submit with visible success/error feedback.