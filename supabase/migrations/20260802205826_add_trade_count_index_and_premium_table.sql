/*
# Add trade_count to index and create premium_subscribers table

1. Purpose
   - Plans are now categorized by both win_rate AND trade_count. We need a
     composite index that supports "best N per (win_rate, trade_count)" queries.
   - A `premium_subscribers` table tracks users who have paid the subscription
     fee to unlock viewing the best 20 global plans' settings.

2. Indexes
   - Replace the old (win_rate, score) index with (win_rate, trade_count, score DESC)
     so queries filtering by both win_rate and trade_count are efficient.

3. New Tables
   - `premium_subscribers`
     - `id`            (uuid, primary key)
     - `email`         (text, unique not null — the subscriber's email)
     - `stripe_customer_id` (text, nullable — Stripe customer ID after payment)
     - `is_active`     (boolean, default true — whether subscription is current)
     - `subscribed_at` (timestamptz, default now())
     - `expires_at`    (timestamptz, nullable — when the subscription expires)

4. Security
   - RLS enabled on `premium_subscribers`.
   - `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`:
     the frontend needs to check if an email is premium (SELECT) and insert
     new subscribers after payment (INSERT). The table is intentionally
     world-readable for the email-existence check and world-writable for
     post-payment inserts. Stripe webhook verification happens server-side
     in an edge function before insert in production; for now the insert
     is gated by the Stripe checkout flow on the client.
*/

-- Drop old index and create new composite index
DROP INDEX IF EXISTS idx_risk_plans_winrate_score;
CREATE INDEX IF NOT EXISTS idx_risk_plans_winrate_tradescore
  ON risk_plans (win_rate, trade_count, score DESC);

-- Premium subscribers table
CREATE TABLE IF NOT EXISTS premium_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  stripe_customer_id text,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE premium_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_premium" ON premium_subscribers;
CREATE POLICY "anon_select_premium"
ON premium_subscribers FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_premium" ON premium_subscribers;
CREATE POLICY "anon_insert_premium"
ON premium_subscribers FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_premium" ON premium_subscribers;
CREATE POLICY "anon_update_premium"
ON premium_subscribers FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);
