export type RiskMode = 'fixed' | 'variable';
export type RiskType = 'dollar' | 'percentage';
export type TradeResult = 'win' | 'loss';

export const WIN_RATES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
export const TRADE_COUNTS = [20, 50, 100, 200, 500, 1000];

export interface Settings {
  startingBalance: number;
  winRate: number;
  rrr: number;
  riskMode: RiskMode;
  riskType: RiskType;
  fixedRisk: number;
  riskLevels: number[];
  maxTrades: number;
}

export interface Trade {
  index: number;
  result: TradeResult;
  riskAmount: number;
  pnl: number;
  balanceAfter: number;
  riskLevelIndex: number;
}

export interface Stats {
  totalTrades: number;
  wins: number;
  losses: number;
  actualWinRate: number;
  netPnl: number;
  netPnlPercent: number;
  maxBalance: number;
  minBalance: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentStreak: number;
  currentStreakType: TradeResult | null;
  longestWinStreak: number;
  longestLossStreak: number;
  largestWin: number;
  largestLoss: number;
  totalRisked: number;
  profitFactor: number;
  expectancy: number;
}
