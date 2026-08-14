/*
# Create risk_plans table for saving best risk-management strategies

1. Purpose
   - Stores the best risk-management plans users have tried in the trading
     risk simulator. Each row captures the full settings, the outcome stats,
     and an optional nickname. The owner of the app can later view and
     download all submitted plans across all users.

2. New Tables
   - `risk_plans`
     - `id`            (uuid, primary key)
     - `nickname`      (text, optional friendly name for the plan)
     - `settings`      (jsonb, the full Settings object used: startingBalance,
                       winRate, rrr, riskMode, riskType, fixedRisk,
                       riskLevels, maxTrades)
     - `stats`         (jsonb, the full Stats object produced: netPnl,
                       netPnlPercent, maxDrawdown, maxDrawdownPercent,
                       actualWinRate, profitFactor, expectancy, etc.)
     - `final_balance` (numeric, balance at end of simulation)
     - `trade_count`   (integer, number of trades executed)
     - `created_at`    (timestamptz, default now)

3. Security
   - Enable RLS on `risk_plans`.
   - This is a single-tenant app with NO sign-in screen, so the anon-key
     client must be able to read and write. Policies use
     `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
     because the data is intentionally public/shared (any visitor can save
     and browse plans, and the owner can view/download all of them).
*/

CREATE TABLE IF NOT EXISTS risk_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text,
  settings jsonb NOT NULL,
  stats jsonb NOT NULL,
  final_balance numeric NOT NULL,
  trade_count integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE risk_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_risk_plans" ON risk_plans;
CREATE POLICY "anon_select_risk_plans"
ON risk_plans FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_risk_plans" ON risk_plans;
CREATE POLICY "anon_insert_risk_plans"
ON risk_plans FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_risk_plans" ON risk_plans;
CREATE POLICY "anon_delete_risk_plans"
ON risk_plans FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_risk_plans_created_at ON risk_plans (created_at DESC);
