import { useState, useMemo } from 'react';
import { Wallet, Play, ListChecks, Table2, Dices } from 'lucide-react';
import type { BacktestTrade, RiskSystem, SimResult, StrategyStats as StratStats } from '@/lib/rmTypes';
import { computeStrategyStats, runSimulation } from '@/lib/rmEngine';
import { useI18n } from '@/lib/i18n';
import BacktestInput from '@/components/rm/BacktestInput';
import StrategyStatsPanel from '@/components/rm/StrategyStatsPanel';
import RiskSystemBuilder from '@/components/rm/RiskSystemBuilder';
import ComparisonTable from '@/components/rm/ComparisonTable';
import EquityCurves from '@/components/rm/EquityCurves';
import TradeDetailTable from '@/components/rm/TradeDetailTable';
import MonteCarloPanel from '@/components/rm/MonteCarloPanel';

export default function RiskManagementPage() {
  const { t } = useI18n();
  const [startingBalance, setStartingBalance] = useState(10000);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [systems, setSystems] = useState<RiskSystem[]>([]);
  const [results, setResults] = useState<SimResult[]>([]);
  const [selectedSysId, setSelectedSysId] = useState<string | null>(null);
  const [goal, setGoal] = useState('');
  const [ddLimit, setDdLimit] = useState('');

  const strategyStats: StratStats = useMemo(() => computeStrategyStats(trades), [trades]);

  const selectedResult = results.find((r) => r.systemId === selectedSysId) ?? null;
  const selectedSystem = systems.find((s) => s.id === selectedSysId) ?? null;

  const handleRunAll = () => {
    const goalNum = goal ? parseFloat(goal) : undefined;
    const ddNum = ddLimit ? parseFloat(ddLimit) : undefined;
    const simResults = systems.map((sys) => runSimulation(trades, sys, startingBalance, goalNum, ddNum));
    setResults(simResults);
    if (simResults.length > 0) setSelectedSysId(simResults[0].systemId);
  };

  return (
    <div className="space-y-5">
      {/* Step 1: Starting Balance */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wallet size={18} className="text-gold" />
          <h2 className="text-base font-semibold text-ink-primary">{t('rm.step1')}</h2>
        </div>
        <input
          type="number"
          step="100"
          value={startingBalance}
          onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
          className="input-field max-w-xs"
        />
      </div>

      {/* Step 2: Backtest Results */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <ListChecks size={18} className="text-gold" />
          <h2 className="text-sm font-semibold text-ink-secondary">{t('rm.step2')}</h2>
        </div>
        <BacktestInput trades={trades} onChange={setTrades} />
      </div>

      {/* Step 3: Strategy Performance */}
      {trades.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ListChecks size={18} className="text-gold" />
            <h2 className="text-sm font-semibold text-ink-secondary">{t('rm.step3')}</h2>
          </div>
          <StrategyStatsPanel stats={strategyStats} />
        </div>
      )}

      {/* Step 4: Build Risk Systems */}
      {trades.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ListChecks size={18} className="text-gold" />
            <h2 className="text-sm font-semibold text-ink-secondary">{t('rm.step4')}</h2>
          </div>
          <RiskSystemBuilder systems={systems} onChange={setSystems} />
        </div>
      )}

      {/* Run Simulation + Goal/DD Limit */}
      {trades.length > 0 && systems.length > 0 && (
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Play size={18} className="text-gold" />
            <h2 className="text-base font-semibold text-ink-primary">{t('rm.step5')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label-text">{t('rm.goal')}</label>
              <input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="$12,000" className="input-field" />
            </div>
            <div>
              <label className="label-text">{t('rm.maxDDLimit')}</label>
              <input type="number" step="0.5" value={ddLimit} onChange={(e) => setDdLimit(e.target.value)} placeholder="10%" className="input-field" />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRunAll}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-base-900 transition-colors hover:bg-gold-light"
              >
                <Play size={16} />
                {t('rm.runAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Comparison Table */}
      {results.length > 0 && <ComparisonTable results={results} />}

      {/* Step 6: Equity Curves */}
      {results.length > 0 && <EquityCurves results={results} />}

      {/* Step 7: Trade Details */}
      {results.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Table2 size={18} className="text-gold" />
            <h2 className="text-sm font-semibold text-ink-secondary">{t('rm.tradeDetails')}</h2>
          </div>
          {results.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {results.map((r, i) => (
                <button
                  key={r.systemId}
                  onClick={() => setSelectedSysId(r.systemId)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSysId === r.systemId
                      ? 'border-gold/50 bg-gold/10 text-gold'
                      : 'border-base-500 bg-base-800 text-ink-secondary hover:border-base-400'
                  }`}
                >
                  {r.systemName}
                </button>
              ))}
            </div>
          )}
          <TradeDetailTable result={selectedResult} />
        </div>
      )}

      {/* Step 8: Monte Carlo */}
      {results.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Dices size={18} className="text-gold" />
            <h2 className="text-sm font-semibold text-ink-secondary">{t('rm.monteCarlo')}</h2>
          </div>
          <MonteCarloPanel trades={trades} system={selectedSystem} startingBalance={startingBalance} />
        </div>
      )}
    </div>
  );
}
