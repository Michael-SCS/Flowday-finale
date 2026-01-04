# Supabase Edge Functions

This folder contains Supabase Edge Functions used by the app.

## Function: `delete-account`

Deletes the authenticated user's rows (`profiles`, `user_onboarding`) and then deletes the Supabase Auth user.

### Required secrets

Set these in your Supabase project (NOT in the app code):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deploy

From repo root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set SUPABASE_URL="https://<ref>.supabase.co" SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
supabase functions deploy delete-account
```

### Invoke

The mobile app calls:

```js
await supabase.functions.invoke('delete-account', { body: {} })
```

The user's JWT is automatically forwarded by supabase-js and is validated server-side.

---

## Function: `check-email`

Returns whether an email exists in the app database (currently checks the `profiles` table).

### Required secrets

Uses the same secrets as `delete-account`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deploy

```bash
supabase functions deploy check-email
```

### Invoke

```js
await supabase.functions.invoke('check-email', { body: { email } })
// -> { data: { ok: true, exists: boolean } }
```

---

# Feedback (v1)

For v1, feedback is stored directly in the database (no email provider, no additional Edge Functions).

- Table: `public.feedback`
- Migration: `supabase/migrations/20260104120000_create_feedback_table.sql`
- The app inserts rows via `supabase.from('feedback').insert(...)`.

You can read feedback messages from the Supabase Dashboard (Table editor / SQL) using service role privileges.
