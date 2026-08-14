/*
# Add win_rate and score columns to risk_plans

1. Purpose
   - We now group saved plans by the strategy's win rate (20%, 25%, ... 90%).
   - A numeric `score` column lets us rank plans: lower max drawdown, higher
     net PnL, lower win rate (bigger achievement), and lower RRR (bigger
     achievement) all contribute to a higher score.

2. Changes to `risk_plans`
   - `win_rate`  (numeric, NOT NULL DEFAULT 0) — the win rate percentage
     used in the simulation (20, 25, 30, ... 90).
   - `score`     (numeric, NOT NULL DEFAULT 0) — ranking score; higher is
     better. Computed in the frontend as:
       score = netPnlPercent - maxDrawdownPercent + (100 - winRate) * 0.1 + (5 - rrr) * 5
     This rewards low drawdown, high return, and better results with lower
     win rates and lower RRR.

3. Indexes
   - Composite index on (win_rate, score DESC) for efficient "best N per
     win rate" queries used by both the user and admin panels.
*/

ALTER TABLE risk_plans
  ADD COLUMN IF NOT EXISTS win_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_risk_plans_winrate_score
  ON risk_plans (win_rate, score DESC);
