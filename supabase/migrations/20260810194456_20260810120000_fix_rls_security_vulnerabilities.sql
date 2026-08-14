/*
# Fix critical RLS vulnerabilities on premium_subscribers and risk_plans

1. premium_subscribers
   - REMOVE INSERT and UPDATE policies that allowed any anon/authenticated
     user to write (USING(true) / WITH CHECK(true)). Only the service_role
     (used by the Stripe webhook edge function) should write to this table.
   - Keep SELECT open to anon, authenticated for the email-existence check.
   - Revoke INSERT, UPDATE, DELETE table privileges from anon and authenticated
     so even if a policy is accidentally added later, the grants won't allow it.

2. risk_plans
   - REMOVE the DELETE policy that allowed any anon/authenticated user to
     delete any row. This is a no-auth app so there is no owner_id to scope
     to; the safest fix is to deny DELETE from anon/authenticated entirely.
   - Revoke DELETE table privilege from anon and authenticated.
   - Keep SELECT and INSERT open (the app's core feature is saving and
     browsing plans).
*/

-- ── premium_subscribers: lock down writes ──────────────────────────

DROP POLICY IF EXISTS "anon_insert_premium" ON premium_subscribers;
DROP POLICY IF EXISTS "anon_update_premium" ON premium_subscribers;

-- Revoke write privileges from anon and authenticated
REVOKE INSERT, UPDATE, DELETE ON premium_subscribers FROM anon;
REVOKE INSERT, UPDATE, DELETE ON premium_subscribers FROM authenticated;

-- ── risk_plans: remove open DELETE ─────────────────────────────────

DROP POLICY IF EXISTS "anon_delete_risk_plans" ON risk_plans;

-- Revoke DELETE privilege from anon and authenticated
REVOKE DELETE ON risk_plans FROM anon;
REVOKE DELETE ON risk_plans FROM authenticated;
