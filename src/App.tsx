import { useState, useCallback, useRef, useEffect } from 'react';
import { Coins, Loader2, CheckCircle2, FlaskConical } from 'lucide-react';
import type { Settings, Trade, Stats } from '@/types';
import TestResultsPanel from '@/components/TestResultsPanel';
import {
  DEFAULT_SETTINGS,
  executeTrade,
  computeStats,
  calculateRiskAmount,
  runFullSimulation,
  aggregateStats,
  scorePlan,
} from '@/lib/riskEngine';
import { savePlan } from '@/lib/supabaseClient';
import { I18nContext, translate, type Lang, type TFunc } from '@/lib/i18n';
import { LANGUAGES } from '@/lib/i18n';
import SettingsPanel from '@/components/SettingsPanel';
import BalanceDisplay from '@/components/BalanceDisplay';
import TradeButton from '@/components/TradeButton';
import StatsPanel from '@/components/StatsPanel';
import TradeHistory from '@/components/TradeHistory';
import EquityCurve from '@/components/EquityCurve';
import SavedPlansPanel from '@/components/SavedPlansPanel';
import AdminPanel from '@/components/AdminPanel';
import LanguageSelector from '@/components/LanguageSelector';
import RiskManagementPage from '@/components/rm/RiskManagementPage';
import MonteCarloSimulatorPanel from '@/components/MonteCarloSimulatorPanel';
import ThemeToggle from '@/components/ThemeToggle';

const VALIDATION_RUNS = 5;

function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState(DEFAULT_SETTINGS.startingBalance);
  const [riskLevelIndex, setRiskLevelIndex] = useState(0);
  const [lastPnl, setLastPnl] = useState<number | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [test5xRunning, setTest5xRunning] = useState(false);
  const [test5xProgress, setTest5xProgress] = useState(0);
  const [test5xResult, setTest5xResult] = useState<Stats[] | null>(null);
  const [test5xAggregate, setTest5xAggregate] = useState<Stats | null>(null);
  const [test5xScore, setTest5xScore] = useState(0);
  const [test5xSaved, setTest5xSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'rmTester'>('simulator');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-neu-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const t: TFunc = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  );

  const stateRef = useRef({ trades, balance, riskLevelIndex, settings });
  stateRef.current = { trades, balance, riskLevelIndex, settings };

  const isComplete = trades.length >= settings.maxTrades;
  const currentRiskAmount = calculateRiskAmount(settings, balance, riskLevelIndex);
  const stats = computeStats(trades, settings.startingBalance, balance);
  const lastResult = trades.length > 0 ? trades[trades.length - 1].result : null;

  const executeOne = useCallback(() => {
    const s = stateRef.current;
    if (s.trades.length >= s.settings.maxTrades) return false;

    const risk = calculateRiskAmount(s.settings, s.balance, s.riskLevelIndex);
    const { trade, newBalance, newRiskLevelIndex } = executeTrade(
      s.balance,
      risk,
      s.riskLevelIndex,
      s.settings,
      s.trades.length,
    );

    setTrades((prev) => [...prev, trade]);
    setBalance(newBalance);
    setRiskLevelIndex(newRiskLevelIndex);
    setLastPnl(trade.pnl);
    return true;
  }, []);

  useEffect(() => {
    if (!autoRun) return;
    if (trades.length >= settings.maxTrades) {
      setAutoRun(false);
      return;
    }
    const interval = setInterval(() => {
      const ok = executeOne();
      if (!ok) setAutoRun(false);
    }, 120);
    return () => clearInterval(interval);
  }, [autoRun, trades.length, settings.maxTrades, executeOne]);

  const handleExecute = useCallback(() => {
    executeOne();
  }, [executeOne]);

  const handleReset = useCallback(() => {
    setAutoRun(false);
    setTest5xRunning(false);
    setTest5xProgress(0);
    setTest5xResult(null);
    setTest5xAggregate(null);
    setTest5xSaved(false);
    setTrades([]);
    setBalance(settings.startingBalance);
    setRiskLevelIndex(0);
    setLastPnl(null);
  }, [settings.startingBalance]);

  const handleSettingsChange = useCallback((newSettings: Settings) => {
    setAutoRun(false);
    setTest5xRunning(false);
    setTest5xProgress(0);
    setTest5xResult(null);
    setTest5xAggregate(null);
    setTest5xSaved(false);
    setSettings(newSettings);
    setTrades([]);
    setBalance(newSettings.startingBalance);
    setRiskLevelIndex(0);
    setLastPnl(null);
  }, []);

  const toggleAutoRun = useCallback(() => {
    if (trades.length >= settings.maxTrades) return;
    setAutoRun((prev) => !prev);
  }, [trades.length, settings.maxTrades]);

  const handleTest5x = useCallback(async () => {
    setTest5xRunning(true);
    setTest5xProgress(0);
    setTest5xResult(null);
    setTest5xAggregate(null);
    setTest5xSaved(false);

    const allStats: Stats[] = [];
    for (let i = 0; i < VALIDATION_RUNS; i++) {
      const { stats: runStats } = runFullSimulation(settings);
      allStats.push(runStats);
      setTest5xProgress(i + 1);
      await new Promise((r) => setTimeout(r, 50));
    }

    const aggStats = aggregateStats(allStats);
    const score = scorePlan(aggStats, settings);
    const avgBalance = settings.startingBalance + aggStats.netPnl;
    const name = `${translate(lang, 'common.plan')} ${new Date().toLocaleString(lang)}`;

    setTest5xResult(allStats);
    setTest5xAggregate(aggStats);
    setTest5xScore(score);

    await savePlan(name, settings, aggStats, avgBalance, settings.maxTrades);

    // Dispatch event so SavedPlansPanel picks up the new local plan
    const localPlan = {
      id: crypto.randomUUID(),
      nickname: name,
      settings,
      stats: aggStats,
      finalBalance: avgBalance,
      tradeCount: settings.maxTrades,
      winRate: settings.winRate,
      score,
      createdAt: Date.now(),
    };
    window.dispatchEvent(new CustomEvent('plan-saved-5x', { detail: localPlan }));

    setTest5xSaved(true);
    setTest5xRunning(false);
    setTimeout(() => setTest5xSaved(false), 5000);
  }, [settings, lang]);

  const dir = LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr';

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--neu-bg)' }} dir={dir}>
        <header className="relative z-50 border-b border-base-500/40 bg-base-800/50 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark shadow-lg shadow-gold/20">
                <Coins size={22} className="text-base-900" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink-primary">{t('app.title')}</h1>
                <p className="text-xs text-ink-secondary">{t('app.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl border border-base-500/50 bg-base-800/60 p-1">
                <button
                  onClick={() => setActiveTab('simulator')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'simulator' ? 'bg-gold/15 text-gold' : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  <Coins size={14} />
                  {t('rm.simulatorTab')}
                </button>
                <button
                  onClick={() => setActiveTab('rmTester')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'rmTester' ? 'bg-gold/15 text-gold' : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  <FlaskConical size={14} />
                  {t('rm.testerTab')}
                </button>
              </div>
              <LanguageSelector />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {activeTab === 'rmTester' ? (
          <RiskManagementPage />
          ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-3">
              <SettingsPanel settings={settings} onChange={handleSettingsChange} />
              <AdminPanel />
            </div>

            <div className="space-y-5 lg:col-span-5">
              <BalanceDisplay
                balance={balance}
                startingBalance={settings.startingBalance}
                lastResult={lastResult}
                lastPnl={lastPnl}
                currentRiskAmount={currentRiskAmount}
                tradeCount={trades.length}
                maxTrades={settings.maxTrades}
              />
              <div className="card p-6">
                <TradeButton
                  onExecute={handleExecute}
                  onReset={handleReset}
                  disabled={false}
                  isComplete={isComplete}
                  tradeCount={trades.length}
                  maxTrades={settings.maxTrades}
                  autoRun={autoRun}
                  onToggleAutoRun={toggleAutoRun}
                  onTest5x={handleTest5x}
                  test5xRunning={test5xRunning}
                  test5xProgress={test5xProgress}
                />
              </div>

              {test5xRunning && (
                <div className="card flex items-center gap-3 p-4">
                  <Loader2 size={18} className="animate-spin text-gold" />
                  <span className="text-sm text-ink-secondary">
                    {t('trade.testing', { cur: test5xProgress, total: VALIDATION_RUNS })}
                  </span>
                </div>
              )}

              {test5xSaved && (
                <div className="card flex items-center gap-3 border-profit/30 p-4">
                  <CheckCircle2 size={18} className="text-profit" />
                  <span className="text-sm text-profit">
                    {t('plans.validated', { wr: settings.winRate, tc: settings.maxTrades })}
                  </span>
                </div>
              )}

              {test5xResult && test5xAggregate && !test5xRunning && (
                <TestResultsPanel
                  runs={test5xResult}
                  aggregate={test5xAggregate}
                  settings={settings}
                  score={test5xScore}
                />
              )}

              <EquityCurve trades={trades} startingBalance={settings.startingBalance} />
              <MonteCarloSimulatorPanel trades={trades} startingBalance={settings.startingBalance} />
            </div>

            <div className="space-y-5 lg:col-span-4">
              <StatsPanel stats={stats} hasTrades={trades.length > 0} />
              <SavedPlansPanel
                trades={trades}
                settings={settings}
                balance={balance}
                isComplete={isComplete}
                onReset={handleReset}
              />
              <TradeHistory trades={trades} />
            </div>
          </div>
          )}

          {activeTab === 'simulator' && isComplete && (
            <div className="mt-5">
              <div
                className={`card flex items-center justify-between p-5 ${
                  stats.netPnl >= 0 ? 'border-profit/30' : 'border-loss/30'
                }`}
              >
                <div>
                  <h3 className="text-lg font-bold text-ink-primary">{t('complete.title')}</h3>
                  <p className="text-sm text-ink-secondary">
                    {t('complete.executed', { count: stats.totalTrades })}{' '}
                    <span className={`font-mono font-semibold ${stats.netPnl >= 0 ? 'text-profit' : 'text-loss-light'}`}>
                      {stats.netPnl >= 0 ? '+' : ''}${Math.abs(stats.netPnl).toFixed(2)} ({stats.netPnlPercent >= 0 ? '+' : ''}{stats.netPnlPercent.toFixed(1)}%)
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-base-900 transition-colors hover:bg-gold-light"
                >
                  {t('complete.newSim')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
          <footer className="mt-8 border-t border-base-500/30 pt-4 text-center text-xs text-ink-muted">
            <p>{t('footer.disclaimer')}</p>
          </footer>
          )}
        </main>
      </div>
    </I18nContext.Provider>
  );
}

export default App;
