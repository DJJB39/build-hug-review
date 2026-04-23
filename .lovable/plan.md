
# Fix: Can't log in after publishing

## What's happening

Two separate issues are at play:

1. **Console error in preview** — `AppLayout` calls `router.navigate(...)` directly during render when the session ends. React flags this as "Cannot update a component while rendering a different component." This can interrupt the render cycle and may be why login appears to silently fail or bounce you back to `/login` even after credentials succeed.

2. **Login on the published site** — Lovable Cloud uses **separate auth environments** for preview vs. published. An account created in preview does **not** exist in the production environment, and vice versa. If you signed up in preview and then tried to log in on the published URL (or the other way round), the credentials simply won't match.

## The fix

### 1. Move the redirect out of render (`src/routes/_app.tsx`)

Replace the inline `router.navigate(...)` call with a `useEffect` so the navigation happens after render, not during it:

```tsx
React.useEffect(() => {
  if (!loading && !session) {
    void router.navigate({ to: "/login" });
  }
}, [loading, session, router]);
```

This eliminates the "setState in render" warning and ensures the login → home transition completes cleanly without React tearing down the tree mid-render.

### 2. Verify which environment you're testing in

After the code fix is in:
- **For the published site (`build-hug-review.lovable.app`)**: create a fresh account directly on that URL, then log in there. Accounts from preview will not work.
- **For the preview**: use accounts created in preview.

If you'd prefer the same credentials to work everywhere, the cleanest answer is to pick one environment as your "real" testing target and stick to it during development.

### 3. If Google sign-in specifically fails on preview but works published

That's the known Cloud Dev vs Cloud Production OAuth credentials split — fixed by adjusting the Cloud Dev environment, not the code. We'll only chase that if it shows up after step 1.

## What I'll do once approved

- Patch `src/routes/_app.tsx` to move the redirect into `useEffect`.
- Confirm the console error is gone.
- Ask you to try email/password sign-up + login on the published URL with a fresh account, and report back which (if any) flow still fails so we can target it precisely.
