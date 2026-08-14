import type { Settings, Trade, Stats, TradeResult } from '@/types';
import { WIN_RATES, TRADE_COUNTS } from '@/types';

export const DEFAULT_SETTINGS: Settings = {
  startingBalance: 1000,
  winRate: 40,
  rrr: 2,
  riskMode: 'variable',
  riskType: 'dollar',
  fixedRisk: 30,
  riskLevels: [30, 10],
  maxTrades: 100,
};

export { WIN_RATES, TRADE_COUNTS };

export function calculateRiskAmount(
  settings: Settings,
  balance: number,
  levelIndex: number,
): number {
  let baseRisk: number;
  if (settings.riskMode === 'fixed') {
    baseRisk = settings.fixedRisk;
  } else {
    const idx = ((levelIndex % settings.riskLevels.length) + settings.riskLevels.length) %
      settings.riskLevels.length;
    baseRisk = settings.riskLevels[idx];
  }

  let risk: number;
  if (settings.riskType === 'percentage') {
    risk = (balance * baseRisk) / 100;
  } else {
    risk = baseRisk;
  }

  return Math.min(risk, balance);
}

export function executeTrade(
  balance: number,
  currentRiskAmount: number,
  currentRiskLevelIndex: number,
  settings: Settings,
  tradeCount: number,
): {
  trade: Trade;
  newBalance: number;
  newRiskLevelIndex: number;
  newRiskAmount: number;
} {
  const isWin = Math.random() < settings.winRate / 100;
  const pnl = isWin ? currentRiskAmount * settings.rrr : -currentRiskAmount;
  const newBalance = Math.max(0, balance + pnl);

  let newLevelIndex = currentRiskLevelIndex;
  if (settings.riskMode === 'variable' && !isWin) {
    newLevelIndex = (currentRiskLevelIndex + 1) % settings.riskLevels.length;
  }

  const newRiskAmount = calculateRiskAmount(settings, newBalance, newLevelIndex);

  const trade: Trade = {
    index: tradeCount + 1,
    result: isWin ? 'win' : 'loss',
    riskAmount: currentRiskAmount,
    pnl,
    balanceAfter: newBalance,
    riskLevelIndex: currentRiskLevelIndex,
  };

  return { trade, newBalance, newRiskLevelIndex: newLevelIndex, newRiskAmount };
}

export function computeStats(
  trades: Trade[],
  startingBalance: number,
  currentBalance: number,
): Stats {
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === 'win').length;
  const losses = trades.filter((t) => t.result === 'loss').length;
  const actualWinRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const netPnl = currentBalance - startingBalance;
  const netPnlPercent = startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;

  let maxBalance = startingBalance;
  let minBalance = startingBalance;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let peak = startingBalance;

  for (const t of trades) {
    maxBalance = Math.max(maxBalance, t.balanceAfter);
    minBalance = Math.min(minBalance, t.balanceAfter);
    peak = Math.max(peak, t.balanceAfter);
    const dd = peak - t.balanceAfter;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
      maxDrawdownPercent = ddPct;
    }
  }

  let currentStreak = 0;
  let currentStreakType: TradeResult | null = null;
  if (trades.length > 0) {
    currentStreakType = trades[trades.length - 1].result;
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].result === currentStreakType) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let winRun = 0;
  let lossRun = 0;
  for (const t of trades) {
    if (t.result === 'win') {
      winRun++;
      lossRun = 0;
      longestWinStreak = Math.max(longestWinStreak, winRun);
    } else {
      lossRun++;
      winRun = 0;
      longestLossStreak = Math.max(longestLossStreak, lossRun);
    }
  }

  const winTrades = trades.filter((t) => t.result === 'win');
  const lossTrades = trades.filter((t) => t.result === 'loss');
  const largestWin = winTrades.length > 0 ? Math.max(...winTrades.map((t) => t.pnl)) : 0;
  const largestLoss = lossTrades.length > 0 ? Math.min(...lossTrades.map((t) => t.pnl)) : 0;

  const totalRisked = trades.reduce((sum, t) => sum + t.riskAmount, 0);
  const grossProfit = winTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;

  return {
    totalTrades,
    wins,
    losses,
    actualWinRate,
    netPnl,
    netPnlPercent,
    maxBalance,
    minBalance,
    maxDrawdown,
    maxDrawdownPercent,
    currentStreak,
    currentStreakType,
    longestWinStreak,
    longestLossStreak,
    largestWin,
    largestLoss,
    totalRisked,
    profitFactor,
    expectancy,
  };
}

export function runFullSimulation(settings: Settings): {
  trades: Trade[];
  finalBalance: number;
  stats: Stats;
} {
  let balance = settings.startingBalance;
  let riskLevelIndex = 0;
  const trades: Trade[] = [];

  for (let i = 0; i < settings.maxTrades; i++) {
    const risk = calculateRiskAmount(settings, balance, riskLevelIndex);
    const { trade, newBalance, newRiskLevelIndex } = executeTrade(
      balance,
      risk,
      riskLevelIndex,
      settings,
      i,
    );
    trades.push(trade);
    balance = newBalance;
    riskLevelIndex = newRiskLevelIndex;
  }

  const stats = computeStats(trades, settings.startingBalance, balance);
  return { trades, finalBalance: balance, stats };
}

export function aggregateStats(runs: Stats[]): Stats {
  if (runs.length === 0) {
    return computeStats([], 0, 0);
  }
  const n = runs.length;
  const avg = (f: (s: Stats) => number) => runs.reduce((a, s) => a + f(s), 0) / n;

  const pfValues = runs.map((s) => s.profitFactor);
  const hasInf = pfValues.some((v) => v === Infinity);
  const finitePfs = pfValues.filter((v) => v !== Infinity);
  const avgPf =
    finitePfs.length > 0 ? finitePfs.reduce((a, b) => a + b, 0) / finitePfs.length : 0;

  return {
    totalTrades: runs[0].totalTrades,
    wins: Math.round(avg((s) => s.wins)),
    losses: Math.round(avg((s) => s.losses)),
    actualWinRate: avg((s) => s.actualWinRate),
    netPnl: avg((s) => s.netPnl),
    netPnlPercent: avg((s) => s.netPnlPercent),
    maxBalance: Math.max(...runs.map((s) => s.maxBalance)),
    minBalance: Math.min(...runs.map((s) => s.minBalance)),
    maxDrawdown: avg((s) => s.maxDrawdown),
    maxDrawdownPercent: avg((s) => s.maxDrawdownPercent),
    currentStreak: 0,
    currentStreakType: null,
    longestWinStreak: Math.round(avg((s) => s.longestWinStreak)),
    longestLossStreak: Math.round(avg((s) => s.longestLossStreak)),
    largestWin: avg((s) => s.largestWin),
    largestLoss: avg((s) => s.largestLoss),
    totalRisked: avg((s) => s.totalRisked),
    profitFactor: hasInf && avgPf > 0 ? Infinity : avgPf,
    expectancy: avg((s) => s.expectancy),
  };
}

export function scorePlan(stats: Stats, settings: Settings): number {
  const pnlScore = stats.netPnlPercent;
  const drawdownPenalty = stats.maxDrawdownPercent;
  const winRateBonus = (100 - settings.winRate) * 0.1;
  const rrrBonus = Math.max(0, 5 - settings.rrr) * 5;
  return pnlScore - drawdownPenalty + winRateBonus + rrrBonus;
}

export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export interface SimulatorMonteCarloResult {
  numSimulations: number;
  probProfit: number;
  worstDrawdownPct: number;
  probLargeLoss: number;
  avgFinalBalance: number;
  medianFinalBalance: number;
  bestFinalBalance: number;
  worstFinalBalance: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  avgMaxDrawdownPct: number;
  finalBalances: number[];
  maxDrawdownPcts: number[];
}

export function runSimulatorMonteCarlo(
  trades: Trade[],
  startingBalance: number,
  numSimulations: number,
  largeLossThreshold = 50,
): SimulatorMonteCarloResult {
  const finalBalances: number[] = [];
  const maxDrawdownPcts: number[] = [];
  let profitCount = 0;
  let largeLossCount = 0;

  for (let s = 0; s < numSimulations; s++) {
    const shuffled = [...trades];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }

    let balance = startingBalance;
    let peak = startingBalance;
    let maxDrawdownPct = 0;

    for (const trade of shuffled) {
      balance = Math.max(0, balance + trade.pnl);
      peak = Math.max(peak, balance);
      const dd = peak - balance;
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
    }

    finalBalances.push(balance);
    maxDrawdownPcts.push(maxDrawdownPct);

    if (balance > startingBalance) profitCount++;
    const lossPct = startingBalance > 0 ? ((startingBalance - balance) / startingBalance) * 100 : 0;
    if (lossPct >= largeLossThreshold) largeLossCount++;
  }

  finalBalances.sort((a, b) => a - b);
  maxDrawdownPcts.sort((a, b) => a - b);

  const percentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const idx = Math.min(arr.length - 1, Math.floor((p / 100) * arr.length));
    return arr[idx];
  };

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    numSimulations,
    probProfit: numSimulations > 0 ? (profitCount / numSimulations) * 100 : 0,
    worstDrawdownPct: maxDrawdownPcts.length > 0 ? maxDrawdownPcts[maxDrawdownPcts.length - 1] : 0,
    probLargeLoss: numSimulations > 0 ? (largeLossCount / numSimulations) * 100 : 0,
    avgFinalBalance: avg(finalBalances),
    medianFinalBalance: percentile(finalBalances, 50),
    bestFinalBalance: finalBalances.length > 0 ? finalBalances[finalBalances.length - 1] : 0,
    worstFinalBalance: finalBalances.length > 0 ? finalBalances[0] : 0,
    p5: percentile(finalBalances, 5),
    p25: percentile(finalBalances, 25),
    p50: percentile(finalBalances, 50),
    p75: percentile(finalBalances, 75),
    p95: percentile(finalBalances, 95),
    avgMaxDrawdownPct: avg(maxDrawdownPcts),
    finalBalances,
    maxDrawdownPcts,
  };
}

export interface PlanRow {
  nickname: string | null;
  settings: Settings;
  stats: Stats;
  final_balance: number;
  trade_count: number;
  win_rate: number;
  score: number;
  created_at: string;
  id?: string;
}

export function downloadPlanCsv(plan: PlanRow, filename?: string) {
  const s = plan.settings;
  const st = plan.stats;
  const headers = ['الحقل', 'القيمة'];
  const rows: [string, string][] = [
    ['الاسم', plan.nickname ?? ''],
    ['رأس المال', `$${s.startingBalance}`],
    ['نسبة النجاح', `${s.winRate}%`],
    ['RRR', `${s.rrr}`],
    ['نوع المخاطرة', s.riskMode === 'fixed' ? 'ثابت' : 'متغير'],
    ['طريقة الحساب', s.riskType === 'percentage' ? 'نسبة %' : 'مبلغ $'],
    ['المخاطرة', s.riskMode === 'fixed' ? `${s.fixedRisk}` : `[${s.riskLevels.join(';')}]`],
    ['عدد الصفقات', `${plan.trade_count}`],
    ['الرصيد النهائي', `$${plan.final_balance.toFixed(2)}`],
    ['صافي الربح', `$${st.netPnl.toFixed(2)}`],
    ['نسبة الربح', `${st.netPnlPercent.toFixed(2)}%`],
    ['أقصى تراجع', `$${st.maxDrawdown.toFixed(2)}`],
    ['نسبة التراجع', `${st.maxDrawdownPercent.toFixed(2)}%`],
    ['نسبة النجاح الفعلية', `${st.actualWinRate.toFixed(1)}%`],
    ['معامل الربحية', st.profitFactor === Infinity ? '∞' : st.profitFactor.toFixed(2)],
    ['متوسط العائد/صفقة', `$${st.expectancy.toFixed(2)}`],
    ['أطول سلسلة أرباح', `${st.longestWinStreak}`],
    ['أطول سلسلة خسائر', `${st.longestLossStreak}`],
    ['التقييم', plan.score.toFixed(2)],
    ['التاريخ', new Date(plan.created_at).toLocaleString('ar')],
  ];
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `plan_${plan.nickname ?? 'untitled'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
