export type BacktestResult = 'TP' | 'SL' | 'BE' | 'custom';

export interface BacktestTrade {
  id: string;
  index: number;
  date?: string;
  result: BacktestResult;
  r: number;
  note?: string;
}

export type RiskCalcMethod = 'currentBalance' | 'initialBalance' | 'fixedAmount';
export type Betreatment = 'neutral' | 'win' | 'loss';

export type RuleConditionType =
  | 'prevTradeWin'
  | 'prevTradeLoss'
  | 'consecutiveWins'
  | 'consecutiveLosses'
  | 'drawdownPct'
  | 'profitPct'
  | 'lossPct'
  | 'currentBalance'
  | 'prevRisk'
  | 'prevTradeR'
  | 'tradesExecuted';

export type RuleActionType =
  | 'setRisk'
  | 'increaseRiskPct'
  | 'decreaseRiskPct'
  | 'increaseRiskPoints'
  | 'decreaseRiskPoints'
  | 'resetRisk'
  | 'stopTrading';

export interface RuleCondition {
  type: RuleConditionType;
  operator: '>=' | '>' | '<=' | '<' | '==' | '!=';
  value: number;
}

export interface RuleAction {
  type: RuleActionType;
  value: number;
}

export interface RiskRule {
  id: string;
  conditions: RuleCondition[];
  action: RuleAction;
  enabled: boolean;
}

export interface RiskSystem {
  id: string;
  name: string;
  description: string;
  baseRiskPct: number;
  calcMethod: RiskCalcMethod;
  minRiskPct: number;
  maxRiskPct: number;
  beTreatment: Betreatment;
  rules: RiskRule[];
  costs: {
    commission: number;
    spread: number;
    slippage: number;
    fixedCost: number;
  };
}

export interface SimTrade {
  index: number;
  result: BacktestResult;
  r: number;
  balanceBefore: number;
  riskPct: number;
  riskAmount: number;
  pnl: number;
  cost: number;
  balanceAfter: number;
  peakBalance: number;
  drawdown: number;
  drawdownPct: number;
  winStreak: number;
  lossStreak: number;
  nextRiskPct: number;
}

export interface SimResult {
  systemId: string;
  systemName: string;
  trades: SimTrade[];
  finalBalance: number;
  startingBalance: number;
  netPnl: number;
  netPnlPct: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  avgDrawdown: number;
  profitFactor: number;
  recoveryFactor: number;
  expectancyDollar: number;
  avgRiskPct: number;
  maxRiskPct: number;
  minRiskPct: number;
  longestLossStreak: number;
  longestWinStreak: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
  avgR: number;
  totalR: number;
  riskChanges: number;
  hitGoal: boolean;
  goalTrade: number | null;
  hitDrawdownLimit: boolean;
  drawdownLimitTrade: number | null;
}

export interface MonteCarloResult {
  avgFinalBalance: number;
  medianFinalBalance: number;
  bestResult: number;
  worstResult: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  avgMaxDrawdown: number;
  worstMaxDrawdown: number;
  probHitGoal: number;
  probExceedDrawdown: number;
  numSimulations: number;
}

export interface StrategyStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
  lossRate: number;
  avgR: number;
  totalR: number;
  avgWinR: number;
  avgLossR: number;
  largestWinR: number;
  largestLossR: number;
  longestWinStreak: number;
  longestLossStreak: number;
  expectancy: number;
  profitFactor: number;
}
