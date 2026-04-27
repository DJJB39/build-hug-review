# Make the Settings sections real pages

I checked the current app and the earlier prompts. We did implement the **Account** section only, and the prompt at the time explicitly said to leave **Notifications**, **Appearance**, and **Privacy & data** as “COMING SOON”. So those three pages were not created yet. Current registered route list only contains `/settings`, with no `/settings/notifications`, `/settings/appearance`, or `/settings/privacy` child routes.

## What I’ll change

### 1. Turn the three Settings cards into working links
Edit `src/routes/_app.settings.tsx` so these cards are no longer static “Coming soon” blocks:

- Notifications → `/settings/notifications`
- Appearance → `/settings/appearance`
- Privacy & data → `/settings/privacy`

They will keep the existing card styling and mobile tap target behavior, but show a clear affordance like “Open” instead of “COMING SOON”.

### 2. Add `/settings/notifications`
Create a dedicated notifications settings page with:

- Back link to Settings
- Match results toggle
- Match confirmations toggle
- League activity toggle
- Save button
- Toast feedback on save

If no persistence table exists yet, I’ll keep these preferences local in the user profile metadata or a lightweight profile-backed settings field if already available. If a new database field/table is required, I’ll add it with safe per-user access rules.

### 3. Add `/settings/appearance`
Create an appearance settings page with:

- Back link to Settings
- Light / Dark / Follow system option
- Immediate preview where practical
- Save button and toast feedback

I’ll check the current theme implementation first and wire this into the existing styling approach rather than redesigning the app.

### 4. Add `/settings/privacy`
Create a Privacy & data page with usable actions:

- Export your data action, using the existing export helper if applicable
- Clear explanation of what is included
- Delete account section presented as a dangerous action

For deletion, I will not add a fake or unsafe client-only delete. If account deletion needs backend support, I’ll implement it through the app backend with proper authenticated validation, or present it as a disabled/actionable section if the backend route cannot be safely completed in this pass.

## Technical notes

- Use TanStack Start route files:
  - `src/routes/_app.settings.notifications.tsx`
  - `src/routes/_app.settings.appearance.tsx`
  - `src/routes/_app.settings.privacy.tsx`
- Use `@tanstack/react-router` `Link` components, not plain anchors.
- Do not edit generated route files manually.
- Keep the current Settings visual style shown in your screenshot: same cards, spacing, typography, and colors.
- If persistent notification/appearance preferences require backend changes, add a secure migration with per-user access.

## Verification

After implementation I’ll verify:

1. `/settings` cards are tappable on mobile and desktop.
2. Each card routes to the correct page and renders content, not a dead page.
3. Back navigation returns to `/settings`.
4. Save actions give visible feedback.
5. Any backend-backed preferences are scoped to the signed-in user only.