import type {
  BacktestTrade,
  BacktestResult,
  RiskSystem,
  RiskRule,
  SimTrade,
  SimResult,
  StrategyStats,
  MonteCarloResult,
  Betreatment,
} from './rmTypes';

export function computeStrategyStats(trades: BacktestTrade[]): StrategyStats {
  const total = trades.length;
  const wins = trades.filter((t) => t.r > 0).length;
  const losses = trades.filter((t) => t.r < 0).length;
  const breakEvens = trades.filter((t) => t.r === 0).length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const lossRate = total > 0 ? (losses / total) * 100 : 0;
  const totalR = trades.reduce((s, t) => s + t.r, 0);
  const avgR = total > 0 ? totalR / total : 0;

  const winTrades = trades.filter((t) => t.r > 0);
  const lossTrades = trades.filter((t) => t.r < 0);
  const avgWinR = winTrades.length > 0 ? winTrades.reduce((s, t) => s + t.r, 0) / winTrades.length : 0;
  const avgLossR = lossTrades.length > 0 ? lossTrades.reduce((s, t) => s + t.r, 0) / lossTrades.length : 0;
  const largestWinR = winTrades.length > 0 ? Math.max(...winTrades.map((t) => t.r)) : 0;
  const largestLossR = lossTrades.length > 0 ? Math.min(...lossTrades.map((t) => t.r)) : 0;

  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let winRun = 0;
  let lossRun = 0;
  for (const t of trades) {
    if (t.r > 0) {
      winRun++;
      lossRun = 0;
      longestWinStreak = Math.max(longestWinStreak, winRun);
    } else if (t.r < 0) {
      lossRun++;
      winRun = 0;
      longestLossStreak = Math.max(longestLossStreak, lossRun);
    } else {
      winRun = 0;
      lossRun = 0;
    }
  }

  const grossProfit = winTrades.reduce((s, t) => s + t.r, 0);
  const grossLoss = Math.abs(lossTrades.reduce((s, t) => s + t.r, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const expectancy = avgR;

  return {
    totalTrades: total,
    wins,
    losses,
    breakEvens,
    winRate,
    lossRate,
    avgR,
    totalR,
    avgWinR,
    avgLossR,
    largestWinR,
    largestLossR,
    longestWinStreak,
    longestLossStreak,
    expectancy,
    profitFactor,
  };
}

function isWin(r: number, beTreatment: Betreatment): boolean {
  if (r > 0) return true;
  if (r === 0 && beTreatment === 'win') return true;
  return false;
}

function isLoss(r: number, beTreatment: Betreatment): boolean {
  if (r < 0) return true;
  if (r === 0 && beTreatment === 'loss') return true;
  return false;
}

function checkCondition(
  cond: RiskRule['conditions'][0],
  ctx: {
    prevWin: boolean;
    prevLoss: boolean;
    consecutiveWins: number;
    consecutiveLosses: number;
    drawdownPct: number;
    profitPct: number;
    lossPct: number;
    currentBalance: number;
    prevRisk: number;
    prevR: number;
    tradesExecuted: number;
  },
): boolean {
  let lhs: number;
  switch (cond.type) {
    case 'prevTradeWin': lhs = ctx.prevWin ? 1 : 0; break;
    case 'prevTradeLoss': lhs = ctx.prevLoss ? 1 : 0; break;
    case 'consecutiveWins': lhs = ctx.consecutiveWins; break;
    case 'consecutiveLosses': lhs = ctx.consecutiveLosses; break;
    case 'drawdownPct': lhs = ctx.drawdownPct; break;
    case 'profitPct': lhs = ctx.profitPct; break;
    case 'lossPct': lhs = ctx.lossPct; break;
    case 'currentBalance': lhs = ctx.currentBalance; break;
    case 'prevRisk': lhs = ctx.prevRisk; break;
    case 'prevTradeR': lhs = ctx.prevR; break;
    case 'tradesExecuted': lhs = ctx.tradesExecuted; break;
    default: return false;
  }

  const rhs = cond.value;
  switch (cond.operator) {
    case '>=': return lhs >= rhs;
    case '>': return lhs > rhs;
    case '<=': return lhs <= rhs;
    case '<': return lhs < rhs;
    case '==': return lhs === rhs;
    case '!=': return lhs !== rhs;
    default: return false;
  }
}

function applyAction(
  action: RiskRule['action'],
  currentRisk: number,
  baseRisk: number,
): { risk: number; stopped: boolean } {
  switch (action.type) {
    case 'setRisk': return { risk: action.value, stopped: false };
    case 'increaseRiskPct': return { risk: currentRisk * (1 + action.value / 100), stopped: false };
    case 'decreaseRiskPct': return { risk: currentRisk * (1 - action.value / 100), stopped: false };
    case 'increaseRiskPoints': return { risk: currentRisk + action.value, stopped: false };
    case 'decreaseRiskPoints': return { risk: currentRisk - action.value, stopped: false };
    case 'resetRisk': return { risk: baseRisk, stopped: false };
    case 'stopTrading': return { risk: 0, stopped: true };
    default: return { risk: currentRisk, stopped: false };
  }
}

function clampRisk(risk: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, risk));
}

export function runSimulation(
  backtestTrades: BacktestTrade[],
  system: RiskSystem,
  startingBalance: number,
  goal?: number,
  maxDrawdownLimit?: number,
): SimResult {
  let balance = startingBalance;
  let peak = startingBalance;
  let currentRisk = system.baseRiskPct;
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let prevWin = false;
  let prevLoss = false;
  let prevR = 0;
  let riskChanges = 0;
  let stopped = false;
  let longestLossStreak = 0;
  let longestWinStreak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  let drawdownSum = 0;
  let totalRiskPct = 0;
  let maxRiskPct = 0;
  let minRiskPct = Infinity;
  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let breakEvens = 0;
  let totalR = 0;
  let hitGoal = false;
  let goalTrade: number | null = null;
  let hitDrawdownLimit = false;
  let drawdownLimitTrade: number | null = null;

  const simTrades: SimTrade[] = [];

  for (let i = 0; i < backtestTrades.length; i++) {
    if (stopped) break;

    const bt = backtestTrades[i];
    const riskPct = clampRisk(currentRisk, system.minRiskPct, system.maxRiskPct);

    let riskAmount: number;
    if (system.calcMethod === 'currentBalance') {
      riskAmount = (balance * riskPct) / 100;
    } else if (system.calcMethod === 'initialBalance') {
      riskAmount = (startingBalance * riskPct) / 100;
    } else {
      riskAmount = system.costs.fixedCost > 0 ? system.costs.fixedCost : balance * 0.01;
    }
    riskAmount = Math.min(riskAmount, balance);

    const pnl = riskAmount * bt.r;
    const cost = system.costs.commission + system.costs.spread + system.costs.slippage + system.costs.fixedCost;
    const netPnl = pnl - cost;
    const balanceAfter = Math.max(0, balance + netPnl);

    peak = Math.max(peak, balanceAfter);
    const dd = peak - balanceAfter;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    maxDrawdown = Math.max(maxDrawdown, dd);
    maxDrawdownPct = Math.max(maxDrawdownPct, ddPct);
    drawdownSum += ddPct;

    totalRiskPct += riskPct;
    maxRiskPct = Math.max(maxRiskPct, riskPct);
    minRiskPct = Math.min(minRiskPct, riskPct);

    const win = isWin(bt.r, system.beTreatment);
    const loss = isLoss(bt.r, system.beTreatment);

    if (win) {
      consecutiveWins++;
      consecutiveLosses = 0;
      wins++;
      grossProfit += netPnl;
      longestWinStreak = Math.max(longestWinStreak, consecutiveWins);
    } else if (loss) {
      consecutiveLosses++;
      consecutiveWins = 0;
      losses++;
      grossLoss += Math.abs(netPnl);
      longestLossStreak = Math.max(longestLossStreak, consecutiveLosses);
    } else {
      breakEvens++;
    }

    totalR += bt.r;

    if (!hitGoal && goal !== undefined && balanceAfter >= goal) {
      hitGoal = true;
      goalTrade = i + 1;
    }
    if (!hitDrawdownLimit && maxDrawdownLimit !== undefined && ddPct >= maxDrawdownLimit) {
      hitDrawdownLimit = true;
      drawdownLimitTrade = i + 1;
    }

    const simTrade: SimTrade = {
      index: i + 1,
      result: bt.result,
      r: bt.r,
      balanceBefore: balance,
      riskPct,
      riskAmount,
      pnl: netPnl,
      cost,
      balanceAfter,
      peakBalance: peak,
      drawdown: dd,
      drawdownPct: ddPct,
      winStreak: consecutiveWins,
      lossStreak: consecutiveLosses,
      nextRiskPct: 0,
    };
    simTrades.push(simTrade);

    balance = balanceAfter;

    // Now determine risk for NEXT trade
    const drawdownPct = ddPct;
    const profitPct = startingBalance > 0 ? ((balance - startingBalance) / startingBalance) * 100 : 0;
    const lossPct = startingBalance > 0 ? Math.min(0, profitPct) : 0;

    const ctx = {
      prevWin: win,
      prevLoss: loss,
      consecutiveWins,
      consecutiveLosses,
      drawdownPct,
      profitPct,
      lossPct: Math.abs(lossPct),
      currentBalance: balance,
      prevRisk: riskPct,
      prevR: bt.r,
      tradesExecuted: i + 1,
    };

    let newRisk = currentRisk;
    let shouldStop = false;

    for (const rule of system.rules) {
      if (!rule.enabled) continue;
      const allMatch = rule.conditions.every((c) => checkCondition(c, ctx));
      if (allMatch) {
        const result = applyAction(rule.action, newRisk, system.baseRiskPct);
        newRisk = result.risk;
        if (result.stopped) shouldStop = true;
      }
    }

    newRisk = clampRisk(newRisk, system.minRiskPct, system.maxRiskPct);

    if (Math.abs(newRisk - currentRisk) > 0.001) {
      riskChanges++;
    }
    currentRisk = newRisk;

    if (shouldStop) {
      stopped = true;
    }

    prevWin = win;
    prevLoss = loss;
    prevR = bt.r;

    simTrade.nextRiskPct = currentRisk;
  }

  const netPnl = balance - startingBalance;
  const netPnlPct = startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const recoveryFactor = maxDrawdownPct > 0 ? netPnlPct / maxDrawdownPct : 0;
  const expectancyDollar = simTrades.length > 0 ? netPnl / simTrades.length : 0;
  const avgRiskPct = simTrades.length > 0 ? totalRiskPct / simTrades.length : 0;
  const avgDrawdown = simTrades.length > 0 ? drawdownSum / simTrades.length : 0;
  const totalTrades = simTrades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgR = totalTrades > 0 ? totalR / totalTrades : 0;

  if (minRiskPct === Infinity) minRiskPct = 0;

  return {
    systemId: system.id,
    systemName: system.name,
    trades: simTrades,
    finalBalance: balance,
    startingBalance,
    netPnl,
    netPnlPct,
    maxDrawdown,
    maxDrawdownPct,
    avgDrawdown,
    profitFactor,
    recoveryFactor,
    expectancyDollar,
    avgRiskPct,
    maxRiskPct,
    minRiskPct,
    longestLossStreak,
    longestWinStreak,
    totalTrades,
    wins,
    losses,
    breakEvens,
    winRate,
    avgR,
    totalR,
    riskChanges,
    hitGoal,
    goalTrade,
    hitDrawdownLimit,
    drawdownLimitTrade,
  };
}

export function runMonteCarlo(
  backtestTrades: BacktestTrade[],
  system: RiskSystem,
  startingBalance: number,
  numSimulations: number,
  goal?: number,
  maxDrawdownLimit?: number,
): MonteCarloResult {
  const finalBalances: number[] = [];
  const maxDrawdowns: number[] = [];
  let hitGoalCount = 0;
  let hitDrawdownCount = 0;

  for (let s = 0; s < numSimulations; s++) {
    const shuffled = [...backtestTrades];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
    }

    const result = runSimulation(shuffled, system, startingBalance, goal, maxDrawdownLimit);
    finalBalances.push(result.finalBalance);
    maxDrawdowns.push(result.maxDrawdownPct);
    if (result.hitGoal) hitGoalCount++;
    if (result.hitDrawdownLimit) hitDrawdownCount++;
  }

  finalBalances.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);

  const percentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const idx = Math.min(arr.length - 1, Math.floor((p / 100) * arr.length));
    return arr[idx];
  };

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    avgFinalBalance: avg(finalBalances),
    medianFinalBalance: percentile(finalBalances, 50),
    bestResult: finalBalances.length > 0 ? finalBalances[finalBalances.length - 1] : 0,
    worstResult: finalBalances.length > 0 ? finalBalances[0] : 0,
    p5: percentile(finalBalances, 5),
    p25: percentile(finalBalances, 25),
    p50: percentile(finalBalances, 50),
    p75: percentile(finalBalances, 75),
    p95: percentile(finalBalances, 95),
    avgMaxDrawdown: avg(maxDrawdowns),
    worstMaxDrawdown: maxDrawdowns.length > 0 ? maxDrawdowns[maxDrawdowns.length - 1] : 0,
    probHitGoal: numSimulations > 0 ? (hitGoalCount / numSimulations) * 100 : 0,
    probExceedDrawdown: numSimulations > 0 ? (hitDrawdownCount / numSimulations) * 100 : 0,
    numSimulations,
  };
}

export function parseCsv(text: string): { trades: BacktestTrade[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return { trades: [], errors: ['CSV must have a header row and at least one data row'] };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idxTrade = header.findIndex((h) => h === 'trade' || h === 'no' || h === '#' || h === 'index');
  const idxDate = header.findIndex((h) => h === 'date');
  const idxResult = header.findIndex((h) => h === 'result' || h === 'outcome');
  const idxR = header.findIndex((h) => h === 'r' || h === 'rvalue' || h === 'r_value');

  if (idxResult === -1) errors.push('Missing "Result" column');
  if (idxR === -1) errors.push('Missing "R" column');

  const trades: BacktestTrade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 2) {
      errors.push(`Row ${i + 1}: insufficient columns`);
      continue;
    }

    const resultStr = idxResult >= 0 ? cols[idxResult]?.toUpperCase() : '';
    const rVal = idxR >= 0 ? parseFloat(cols[idxR]) : NaN;

    let result: BacktestResult;
    if (resultStr === 'TP' || resultStr === 'W' || resultStr === 'WIN') result = 'TP';
    else if (resultStr === 'SL' || resultStr === 'L' || resultStr === 'LOSS') result = 'SL';
    else if (resultStr === 'BE') result = 'BE';
    else result = 'custom';

    if (isNaN(rVal)) {
      errors.push(`Row ${i + 1}: invalid R value "${cols[idxR] ?? ''}"`);
      continue;
    }

    trades.push({
      id: crypto.randomUUID(),
      index: i,
      date: idxDate >= 0 ? cols[idxDate] : undefined,
      result,
      r: rVal,
      note: undefined,
    });
  }

  return { trades, errors };
}

export function quickEntryToTrades(
  sequence: string,
  winR: number,
  lossR: number,
  beR: number,
): BacktestTrade[] {
  const tokens = sequence.split(/[,;\s]+/).filter((t) => t.length > 0);
  return tokens.map((token, i) => {
    const upper = token.toUpperCase();
    let result: BacktestResult = 'custom';
    let r = 0;

    if (upper === 'TP' || upper === 'W' || upper === 'WIN') {
      result = 'TP';
      r = winR;
    } else if (upper === 'SL' || upper === 'L' || upper === 'LOSS') {
      result = 'SL';
      r = lossR;
    } else if (upper === 'BE') {
      result = 'BE';
      r = beR;
    } else {
      const parsed = parseFloat(token);
      if (!isNaN(parsed)) {
        r = parsed;
        result = parsed > 0 ? 'TP' : parsed < 0 ? 'SL' : 'BE';
      }
    }

    return {
      id: crypto.randomUUID(),
      index: i + 1,
      result,
      r,
      note: undefined,
    };
  });
}
