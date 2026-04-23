

# League creation form

Replace the placeholder `src/routes/_app.leagues.new.tsx` with a working form. Visual style mirrors `_app.leagues.join.tsx` exactly (no `<Card>` — that page uses a plain centered div; same back-link, same `Input`/`Label`/`Button` primitives, same spacing).

## Schema reality check

- **No triggers exist in the database.** The `add_owner_as_admin` function is defined but not attached. The form **must** insert the admin `league_members` row itself — not as a fallback, as the only path.
- `leagues.join_code` has a DB default (`generate_join_code()`), so we omit it from the insert.
- `profiles.gc_handicap` is `NOT NULL` with default `12`, so every signed-in user already has a value to prefill from.
- AC has no column anywhere — the AC radio is rendered but disabled with "Coming soon".

## File: `src/routes/_app.leagues.new.tsx` (full rewrite)

### Layout
- Outer `<div className="mx-auto w-full max-w-md px-5 pb-12 pt-6 md:pt-12">` (matches join page)
- Back link: `← Back to Leagues` → `/leagues`
- Heading: "Create a league." + muted subtitle
- `<form onSubmit={…} className="mt-8 space-y-5">`

### Fields

1. **League name** — `Input` text, `maxLength={50}`, placeholder `"e.g., Sunday Sixes"`. Counter `{name.trim().length}/50` shown right-aligned in muted text under the field. Inline error below if touched.
2. **Croquet discipline** — two `<button type="button">` radio-style cards in the same visual idiom as the onboarding "I don't know my handicap" toggle (border + checkmark dot, `border-primary` when selected). GC selected by default; AC disabled with `opacity-60 cursor-not-allowed` and "Coming soon" hint.
3. **My GC handicap** — `Input` `type="number"` `min={-3} max={24} step={1}` `inputMode="numeric"`, prefilled from `profiles.gc_handicap`. Hint below: "Range: −3 (best) to 24 (beginner)". Inline error if touched and out of range.
4. **Submit** — full-width primary `Button`, label "Create league" / "Creating…" while busy. Disabled when form invalid or busy.

### State
```text
name, handicap, discipline ('gc'), busy, touched: { name, handicap }, error
profileHandicap (loaded once on mount via supabase.from('profiles').select('gc_handicap').eq('id', user.id).maybeSingle())
```

### Validation (pure derived)
- `nameValid = name.trim().length > 0 && name.trim().length <= 50`
- `handicapValid = Number.isInteger(Number(handicap)) && Number(handicap) >= -3 && Number(handicap) <= 24`
- Errors only render when `touched[field] && !valid`. `onBlur` sets touched; submit attempt sets all touched.

### Submit flow
1. Insert league: `supabase.from('leagues').insert({ name: name.trim(), owner_id: user.id, format: 'singles', handicap_enabled: true }).select('id').single()`
2. Insert admin membership (no trigger exists): `supabase.from('league_members').insert({ league_id, user_id: user.id, role: 'admin' })`. If this errors with a duplicate (unique constraint on `league_id,user_id`), swallow it — means a trigger has been added since.
3. If `Number(handicap) !== profileHandicap`, update profile: `supabase.from('profiles').update({ gc_handicap: Number(handicap) }).eq('id', user.id)` — non-blocking; log but don't fail the whole flow if this errors.
4. `toast.success("League created")` → `navigate({ to: '/leagues/$leagueId', params: { leagueId: newId } })`
5. On any blocking error: `toast.error(err.message)`, `setError`, `setBusy(false)`, leave the form filled in.

## Out of scope (unchanged)
- `_app.leagues.tsx`, `_app.leagues.join.tsx`, any other route
- Schema migrations, AC handicap storage, description/format/target_score pickers

## Files touched
- **Edit:** `src/routes/_app.leagues.new.tsx` (only file modified)

