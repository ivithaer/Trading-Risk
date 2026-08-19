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
