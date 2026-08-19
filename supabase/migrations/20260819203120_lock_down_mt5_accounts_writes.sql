/*
# Lock down mt5_accounts: remove direct INSERT/UPDATE from the browser

1. Context
   The `mt5_accounts` table stores MetaApi account links. It was created
   outside of a tracked migration, so its RLS posture was never verified.
   At audit time it had four owner-scoped policies (SELECT, INSERT, UPDATE,
   DELETE) all scoped to `TO authenticated` with `auth.uid() = user_id`, and
   table grants giving both `anon` and `authenticated` full CRUD.

2. What changes
   - Keep RLS enabled (it already is).
   - Keep the SELECT policy: an authenticated user can read rows where
     `user_id = auth.uid()`. No access for `anon`.
   - Keep the DELETE policy: an authenticated user can delete their own
     rows. No access for `anon`.
   - DROP the INSERT and UPDATE policies. Inserts and updates must only
     happen through the `mt5-connect` edge function, which uses the
     service_role key and bypasses RLS. The browser never inserts or
     updates this table directly.
   - REVOKE INSERT and UPDATE table privileges from both `anon` and
     `authenticated` as a defense-in-depth layer: even if an INSERT or
     UPDATE policy is accidentally added later, the grants will not
     permit the write.

3. Idempotency
   Every `DROP POLICY` uses `IF EXISTS` and every `REVOKE` is safe to
   re-run (revoking a privilege that is already absent is a no-op).
   `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is also idempotent.

4. Frontend impact
   - Listing linked accounts (SELECT) — unaffected.
   - Deleting a linked account (DELETE) — unaffected.
   - Connecting a new MT5 account (edge function INSERT via service_role) —
     unaffected, service_role bypasses RLS and grants.
   - Fetching account info (edge function SELECT via service_role) —
     unaffected.
*/

-- ── Ensure RLS is enabled ──────────────────────────────────────────
ALTER TABLE mt5_accounts ENABLE ROW LEVEL SECURITY;

-- ── SELECT: authenticated users can read their own rows ────────────
DROP POLICY IF EXISTS "select_own_mt5_accounts" ON mt5_accounts;
CREATE POLICY "select_own_mt5_accounts"
  ON mt5_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ── DELETE: authenticated users can delete their own rows ──────────
DROP POLICY IF EXISTS "delete_own_mt5_accounts" ON mt5_accounts;
CREATE POLICY "delete_own_mt5_accounts"
  ON mt5_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── INSERT / UPDATE: blocked from the browser ─────────────────────
-- These must only happen via edge functions using the service_role key.
DROP POLICY IF EXISTS "insert_own_mt5_accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "update_own_mt5_accounts" ON mt5_accounts;

-- Defense-in-depth: revoke table-level INSERT and UPDATE grants so
-- even an accidentally-added policy cannot permit browser writes.
REVOKE INSERT ON mt5_accounts FROM anon;
REVOKE INSERT ON mt5_accounts FROM authenticated;
REVOKE UPDATE ON mt5_accounts FROM anon;
REVOKE UPDATE ON mt5_accounts FROM authenticated;
