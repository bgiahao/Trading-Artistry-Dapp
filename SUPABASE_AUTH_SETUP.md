# Supabase Auth setup

## Environment

Set these variables in Vercel and local development (never commit real values):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL` using the Supabase pooler URL with TLS
- `VITE_GUEST_MODE=false`
- `ALLOW_GUEST_AUTH=false`

## Providers

In Supabase Dashboard → Authentication → Providers, enable **Email** and **Google**. For Google, add the Supabase callback URL shown in the provider screen to Google Cloud OAuth credentials. In Authentication → URL Configuration, add the Vercel production URL and the Preview URL as allowed redirect URLs.

## Database and RLS

Run `supabase/migrations/20261107_auth_profiles_rls.sql` in the Supabase SQL Editor. It creates `profiles`, syncs new Auth users to profiles, enables RLS, and limits profiles and trades to the authenticated owner. The application server must first receive a request from Supabase Auth so it can upsert `public.users` with `open_id = supabase:<auth-user-id>`.

## User flow

The app shows a dark Obsidian Emerald login modal when Supabase is configured and no session exists. Users can sign in/register with email/password or continue with Google. After authentication, the Sidebar profile area opens `/settings/profile`, where display name, avatar URL, default risk percentage and USD/VND/EUR/GBP currency are stored in both Supabase Auth metadata and `public.profiles`. Sign Out clears the Supabase session.
