/*
# Enable anon-key access for BeyondCom tables

The backend uses Supabase JS (anon key) for all persistence. Without these policies
the anon role cannot SELECT/INSERT/UPDATE/DELETE, and every query would fail RLS.

1. Security
- RLS is ENABLED on every table.
- Policies allow anon + authenticated full CRUD because this is the internal admin
  backend of a single-tenant tool (no per-user isolation at the DB layer; isolation
  is enforced in the Express session middleware instead).
2. Tables affected
- users, events, event_links, scan_logs, click_logs
*/

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scan_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "click_logs" ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "anon_crud_users_select" ON "users";
CREATE POLICY "anon_crud_users_select" ON "users" FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_users_insert" ON "users";
CREATE POLICY "anon_crud_users_insert" ON "users" FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_users_update" ON "users";
CREATE POLICY "anon_crud_users_update" ON "users" FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_users_delete" ON "users";
CREATE POLICY "anon_crud_users_delete" ON "users" FOR DELETE TO anon, authenticated USING (true);

-- events
DROP POLICY IF EXISTS "anon_crud_events_select" ON "events";
CREATE POLICY "anon_crud_events_select" ON "events" FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_events_insert" ON "events";
CREATE POLICY "anon_crud_events_insert" ON "events" FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_events_update" ON "events";
CREATE POLICY "anon_crud_events_update" ON "events" FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_events_delete" ON "events";
CREATE POLICY "anon_crud_events_delete" ON "events" FOR DELETE TO anon, authenticated USING (true);

-- event_links
DROP POLICY IF EXISTS "anon_crud_event_links_select" ON "event_links";
CREATE POLICY "anon_crud_event_links_select" ON "event_links" FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_event_links_insert" ON "event_links";
CREATE POLICY "anon_crud_event_links_insert" ON "event_links" FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_event_links_update" ON "event_links";
CREATE POLICY "anon_crud_event_links_update" ON "event_links" FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_event_links_delete" ON "event_links";
CREATE POLICY "anon_crud_event_links_delete" ON "event_links" FOR DELETE TO anon, authenticated USING (true);

-- scan_logs
DROP POLICY IF EXISTS "anon_crud_scan_logs_select" ON "scan_logs";
CREATE POLICY "anon_crud_scan_logs_select" ON "scan_logs" FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_scan_logs_insert" ON "scan_logs";
CREATE POLICY "anon_crud_scan_logs_insert" ON "scan_logs" FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_scan_logs_update" ON "scan_logs";
CREATE POLICY "anon_crud_scan_logs_update" ON "scan_logs" FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_scan_logs_delete" ON "scan_logs";
CREATE POLICY "anon_crud_scan_logs_delete" ON "scan_logs" FOR DELETE TO anon, authenticated USING (true);

-- click_logs
DROP POLICY IF EXISTS "anon_crud_click_logs_select" ON "click_logs";
CREATE POLICY "anon_crud_click_logs_select" ON "click_logs" FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_click_logs_insert" ON "click_logs";
CREATE POLICY "anon_crud_click_logs_insert" ON "click_logs" FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_click_logs_update" ON "click_logs";
CREATE POLICY "anon_crud_click_logs_update" ON "click_logs" FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_click_logs_delete" ON "click_logs";
CREATE POLICY "anon_crud_click_logs_delete" ON "click_logs" FOR DELETE TO anon, authenticated USING (true);
