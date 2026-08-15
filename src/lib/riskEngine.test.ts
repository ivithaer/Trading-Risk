import { scorePlanRobust, rankPlans, type RobustnessInput } from './riskEngine';
import type { Stats, Settings } from '../types';

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    totalTrades: 100,
    wins: 50,
    losses: 50,
    actualWinRate: 50,
    netPnl: 100,
    netPnlPercent: 10,
    maxBalance: 1100,
    minBalance: 900,
    maxDrawdown: 50,
    maxDrawdownPercent: 5,
    currentStreak: 0,
    currentStreakType: null,
    longestWinStreak: 4,
    longestLossStreak: 3,
    largestWin: 60,
    largestLoss: -30,
    totalRisked: 3000,
    profitFactor: 1.5,
    expectancy: 1,
    ...overrides,
  };
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    startingBalance: 1000,
    winRate: 50,
    rrr: 2,
    riskMode: 'fixed',
    riskType: 'percentage',
    fixedRisk: 3,
    riskLevels: [3],
    maxTrades: 100,
    ...overrides,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

const tests: { name: string; fn: () => void }[] = [];

tests.push({
  name: 'Higher netPnl with same drawdown should score higher',
  fn: () => {
    const base: RobustnessInput = { stats: makeStats({ netPnlPercent: 10 }), settings: makeSettings() };
    const better: RobustnessInput = { stats: makeStats({ netPnlPercent: 20 }), settings: makeSettings() };
    const baseResult = scorePlanRobust(base);
    const betterResult = scorePlanRobust(better);
    assert(betterResult.totalScore > baseResult.totalScore, 'Higher PnL should produce higher total score');
  },
});

tests.push({
  name: 'Lower win rate should increase robustness score',
  fn: () => {
    const highWr: RobustnessInput = { stats: makeStats(), settings: makeSettings({ winRate: 80 }) };
    const lowWr: RobustnessInput = { stats: makeStats(), settings: makeSettings({ winRate: 30 }) };
    const highResult = scorePlanRobust(highWr);
    const lowResult = scorePlanRobust(lowWr);
    assert(lowResult.robustnessScore > highResult.robustnessScore, 'Lower win rate should yield higher robustness');
  },
});

tests.push({
  name: 'Lower RRR should increase robustness score',
  fn: () => {
    const highRrr: RobustnessInput = { stats: makeStats(), settings: makeSettings({ rrr: 4 }) };
    const lowRrr: RobustnessInput = { stats: makeStats(), settings: makeSettings({ rrr: 1.5 }) };
    const highResult = scorePlanRobust(highRrr);
    const lowResult = scorePlanRobust(lowRrr);
    assert(lowResult.robustnessScore > highResult.robustnessScore, 'Lower RRR should yield higher robustness');
  },
});

tests.push({
  name: 'Monte Carlo drawdown should override single-path drawdown when provided',
  fn: () => {
    const noMc: RobustnessInput = { stats: makeStats({ maxDrawdownPercent: 5 }), settings: makeSettings() };
    const withMc: RobustnessInput = { stats: makeStats({ maxDrawdownPercent: 5 }), settings: makeSettings(), mcWorstDrawdownPct: 12, numSimulations: 1000 };
    const noMcResult = scorePlanRobust(noMc);
    const withMcResult = scorePlanRobust(withMc);
    assert(withMcResult.effectiveDrawdown === 12, 'MC drawdown should be used as effective drawdown');
    assert(withMcResult.totalScore < noMcResult.totalScore, 'Higher MC drawdown should reduce total score');
  },
});

tests.push({
  name: 'Larger trade count should increase confidence weight',
  fn: () => {
    const small: RobustnessInput = { stats: makeStats({ totalTrades: 20 }), settings: makeSettings() };
    const large: RobustnessInput = { stats: makeStats({ totalTrades: 200 }), settings: makeSettings() };
    const smallResult = scorePlanRobust(small);
    const largeResult = scorePlanRobust(large);
    assert(largeResult.confidenceWeight > smallResult.confidenceWeight, '200 trades should have higher confidence than 20');
    assert(largeResult.confidenceWeight === 1.0, '200+ trades should have confidence weight of 1.0');
  },
});

tests.push({
  name: 'Shorter loss streak should improve robustness',
  fn: () => {
    const longStreak: RobustnessInput = { stats: makeStats({ longestLossStreak: 10 }), settings: makeSettings() };
    const shortStreak: RobustnessInput = { stats: makeStats({ longestLossStreak: 3 }), settings: makeSettings() };
    const longResult = scorePlanRobust(longStreak);
    const shortResult = scorePlanRobust(shortStreak);
    assert(shortResult.totalScore > longResult.totalScore, 'Shorter loss streak should yield higher total score');
  },
});

tests.push({
  name: 'Recovery factor should be calculated and contribute to score',
  fn: () => {
    const input: RobustnessInput = { stats: makeStats({ netPnlPercent: 20, maxDrawdownPercent: 5 }), settings: makeSettings() };
    const result = scorePlanRobust(input);
    assert(result.recoveryFactor === 4, 'Recovery factor should be 20/5 = 4');
    assert(result.recoveryFactor > 0, 'Recovery factor should be positive');
  },
});

tests.push({
  name: 'rankPlans should prefer robust plan when performance is within 5%',
  fn: () => {
    const extreme: RobustnessInput = {
      stats: makeStats({ netPnlPercent: 10.5, longestLossStreak: 8 }),
      settings: makeSettings({ winRate: 80, rrr: 4, fixedRisk: 8 }),
    };
    const robust: RobustnessInput = {
      stats: makeStats({ netPnlPercent: 10, longestLossStreak: 3 }),
      settings: makeSettings({ winRate: 35, rrr: 1.5, fixedRisk: 2 }),
    };
    const ranked = rankPlans([extreme, robust]);
    assert(ranked[0].isRecommended, 'Top plan should be recommended');
    assert(ranked[0].plan === robust, 'Robust plan should rank first when performance is within 5%');
    assert(ranked[0].recommendationReason.length > 0, 'Recommendation reason should be provided');
  },
});

tests.push({
  name: 'rankPlans should prefer higher performance when gap exceeds 5%',
  fn: () => {
    const lowPerf: RobustnessInput = {
      stats: makeStats({ netPnlPercent: 5 }),
      settings: makeSettings({ winRate: 30, rrr: 1.5, fixedRisk: 2 }),
    };
    const highPerf: RobustnessInput = {
      stats: makeStats({ netPnlPercent: 20 }),
      settings: makeSettings({ winRate: 80, rrr: 4, fixedRisk: 8 }),
    };
    const ranked = rankPlans([lowPerf, highPerf]);
    assert(ranked[0].plan === highPerf, 'Higher performance plan should rank first when gap exceeds 5%');
  },
});

tests.push({
  name: 'Explanation should be non-empty for all plans',
  fn: () => {
    const input: RobustnessInput = { stats: makeStats(), settings: makeSettings() };
    const result = scorePlanRobust(input);
    assert(result.explanation.length > 0, 'Explanation should always be non-empty');
  },
});

let passed = 0;
let failed = 0;
for (const test of tests) {
  try {
    test.fn();
    console.log(`  ✓ ${test.name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${test.name}`);
    console.error(`    ${(e as Error).message}`);
    failed++;
  }
}

console.log(`\n${passed}/${tests.length} tests passed`);
if (failed > 0) process.exit(1);
