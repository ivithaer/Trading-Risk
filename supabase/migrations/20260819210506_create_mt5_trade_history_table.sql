/*
# Create mt5_trade_history table for behavioral analysis infrastructure

1. New Tables
   - `mt5_trade_history`: stores closed MT5 deals synced from MetaApi.
     Each row represents one closed trade (DEAL_ENTRY_OUT) with:
     - `id` (uuid, primary key)
     - `user_id` (uuid, not null — owner of the trade, defaults to auth.uid())
     - `mt5_account_id` (uuid, not null — FK to mt5_accounts, cascade delete)
     - `metaapi_deal_id` (text, not null — the deal ticket from MetaApi)
     - `open_time` (timestamptz, nullable — when the position was opened)
     - `close_time` (timestamptz, not null — when the deal was closed)
     - `lot_size` (numeric, default 0)
     - `trade_type` (text — 'buy' or 'sell')
     - `profit` (numeric, default 0 — profit/loss in account currency)
     - `has_stop_loss` (boolean, default false — whether SL was set at open)
     - `has_take_profit` (boolean, default false — whether TP was set at open)
     - `created_at` (timestamptz, default now())

2. Indexes
   - Index on `mt5_account_id` for efficient lookups per account.
   - Index on `user_id` for RLS policy evaluation.

3. Security
   - RLS enabled.
   - SELECT: authenticated users can read only their own rows (auth.uid() = user_id).
   - DELETE: authenticated users can delete only their own rows.
   - INSERT and UPDATE: blocked from anon and authenticated. Writes happen
     only via the mt5-trade-history edge function using the service_role key.
   - REVOKE INSERT, UPDATE from anon and authenticated as defense-in-depth.
*/

CREATE TABLE IF NOT EXISTS mt5_trade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mt5_account_id uuid NOT NULL REFERENCES mt5_accounts(id) ON DELETE CASCADE,
  metaapi_deal_id text NOT NULL,
  open_time timestamptz,
  close_time timestamptz NOT NULL,
  lot_size numeric DEFAULT 0,
  trade_type text,
  profit numeric DEFAULT 0,
  has_stop_loss boolean DEFAULT false,
  has_take_profit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mt5_trade_history_account ON mt5_trade_history(mt5_account_id);
CREATE INDEX IF NOT EXISTS idx_mt5_trade_history_user ON mt5_trade_history(user_id);

ALTER TABLE mt5_trade_history ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users can read their own rows
DROP POLICY IF EXISTS "select_own_mt5_trade_history" ON mt5_trade_history;
CREATE POLICY "select_own_mt5_trade_history"
  ON mt5_trade_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- DELETE: authenticated users can delete their own rows
DROP POLICY IF EXISTS "delete_own_mt5_trade_history" ON mt5_trade_history;
CREATE POLICY "delete_own_mt5_trade_history"
  ON mt5_trade_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT / UPDATE: blocked from the browser — only via edge function (service_role)
DROP POLICY IF EXISTS "insert_own_mt5_trade_history" ON mt5_trade_history;
DROP POLICY IF EXISTS "update_own_mt5_trade_history" ON mt5_trade_history;

-- Defense-in-depth: revoke table-level INSERT and UPDATE grants
REVOKE INSERT ON mt5_trade_history FROM anon;
REVOKE INSERT ON mt5_trade_history FROM authenticated;
REVOKE UPDATE ON mt5_trade_history FROM anon;
REVOKE UPDATE ON mt5_trade_history FROM authenticated;
