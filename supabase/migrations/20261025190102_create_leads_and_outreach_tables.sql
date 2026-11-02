/*
# Create leads and outreach_history tables

## What this migration does
Creates the two core tables that power the AI sales agency outreach dashboard,
with Row Level Security enabled on both. Access is restricted to the
authenticated role only — the dashboard will be wired for Supabase Auth at a
later stage, so the anon (public) key intentionally cannot read or write any
lead data. The frontend is built to surface "authentication required" states
honestly rather than exposing lead data publicly.

## 1. New Tables

### leads
- id (uuid, primary key)
- niche (text, NOT NULL) — 'Dental', 'Dermatology', or 'HVAC'
- business_name (text, NOT NULL)
- phone (text, nullable)
- rating (numeric, nullable) — Google rating, e.g. 4.7
- review_count (integer, nullable) — total Google reviews
- address (text, nullable)
- google_maps_url (text, nullable)
- website (text, nullable)
- email (text, nullable) — publicly listed business email
- email_source_url (text, nullable) — URL where the email was found
- service_type (text, nullable) — 'website' or 'voice'
- lead_status (text, NOT NULL DEFAULT 'New')
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### outreach_history
- id (uuid, primary key)
- lead_id (uuid, NOT NULL, references leads.id ON DELETE CASCADE)
- message (text, NOT NULL) — the EXACT message content that was sent
- channel (text, NOT NULL) — 'WhatsApp', 'Gmail', or 'Other'
- status (text, NOT NULL DEFAULT 'Draft') — 'Draft', 'Sent', or 'Failed'
- sent_at (timestamptz, nullable) — timestamp a message was actually sent; NULL until sent
- created_at (timestamptz, default now())

A lead may have multiple outreach records. Each outreach record represents a
single message attempt. Only records with status = 'Sent' are counted as
successfully sent in dashboard stats. sent_at carries the actual outreach date
used to group history by date.

## 2. Indexes
- leads(niche) — speeds niche filtering
- leads(lead_status) — speeds status filtering
- leads(created_at desc) — speeds "recently added" sorting
- outreach_history(lead_id) — speeds per-lead message history
- outreach_history(status) — speeds sent/draft/failed filtering
- outreach_history(sent_at desc) — speeds date grouping and "today/yesterday" stats

## 3. Security
- RLS ENABLED on both tables.
- Grants + policies target the authenticated role ONLY (no anon grants):
  the dashboard intentionally requires sign-in before any lead data is
  exposed. Until Supabase Auth is added, the anon-key frontend will receive
  permission errors, which the UI displays honestly instead of fake data.
- Four policies per table (SELECT/INSERT/UPDATE/DELETE), no FOR ALL.
- service_role gets full access for future server-side edge functions.

## 4. Notes
- Tables are idempotent (CREATE TABLE IF NOT EXISTS).
- Policies are dropped before re-create so the migration is safe to re-run.
- No user_id column: leads are owned by the agency as a whole (single tenant
  once authenticated), not per individual user.
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche text NOT NULL CHECK (niche IN ('Dental', 'Dermatology', 'HVAC')),
  business_name text NOT NULL,
  phone text,
  rating numeric(2, 1),
  review_count integer,
  address text,
  google_maps_url text,
  website text,
  email text,
  email_source_url text,
  service_type text CHECK (service_type IN ('website', 'voice')),
  lead_status text NOT NULL DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outreach_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('WhatsApp', 'Gmail', 'Other')),
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Failed')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche);
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_lead_id ON outreach_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_history(status);
CREATE INDEX IF NOT EXISTS idx_outreach_sent_at ON outreach_history(sent_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_history ENABLE ROW LEVEL SECURITY;

-- Grants: authenticated only (no anon). service_role for future edge functions.
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON outreach_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON outreach_history TO service_role;

-- leads policies (authenticated only)
DROP POLICY IF EXISTS "authenticated_select_leads" ON leads;
CREATE POLICY "authenticated_select_leads" ON leads FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_leads" ON leads;
CREATE POLICY "authenticated_insert_leads" ON leads FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_leads" ON leads;
CREATE POLICY "authenticated_update_leads" ON leads FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_leads" ON leads;
CREATE POLICY "authenticated_delete_leads" ON leads FOR DELETE
  TO authenticated USING (true);

-- outreach_history policies (authenticated only)
DROP POLICY IF EXISTS "authenticated_select_outreach" ON outreach_history;
CREATE POLICY "authenticated_select_outreach" ON outreach_history FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_outreach" ON outreach_history;
CREATE POLICY "authenticated_insert_outreach" ON outreach_history FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_outreach" ON outreach_history;
CREATE POLICY "authenticated_update_outreach" ON outreach_history FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_outreach" ON outreach_history;
CREATE POLICY "authenticated_delete_outreach" ON outreach_history FOR DELETE
  TO authenticated USING (true);
