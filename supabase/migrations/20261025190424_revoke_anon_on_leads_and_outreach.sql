/*
# Revoke anon access on leads and outreach_history

## Why
The create_leads_and_outreach_tables migration granted CRUD to `authenticated`
and `service_role` only, but Supabase's default privileges on the public schema
also granted the `anon` role table-level privileges on the new tables.

RLS policies target `authenticated` only, so `anon` already gets zero rows
(deny-by-default RLS). The table-level grants to `anon` are therefore
unnecessary and misleading in a security posture audit. This migration removes
them so the only path to the data is through an authenticated session — which
is exactly the safe configuration requested: no private lead data exposed to a
public, unauthenticated dashboard.

## Changes
- REVOKE all privileges on leads and outreach_history FROM anon.
- No changes to authenticated or service_role grants.
- No changes to RLS policies.
*/

REVOKE ALL PRIVILEGES ON leads FROM anon;
REVOKE ALL PRIVILEGES ON outreach_history FROM anon;
