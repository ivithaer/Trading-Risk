import { useState, useMemo } from 'react';
import { Wallet, Play, ListChecks, Table2, Dices } from 'lucide-react';
import type { BacktestTrade, RiskSystem, SimResult, StrategyStats as StratStats } from '@/lib/rmTypes';
import { computeStrategyStats, runSimulation } from '@/lib/rmEngine';
import { useI18n } from '@/lib/i18n';
import DecimalInput from '@/components/DecimalInput';
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
  const [goal, setGoal] = useState(0);
  const [ddLimit, setDdLimit] = useState(0);

  const strategyStats: StratStats = useMemo(() => computeStrategyStats(trades), [trades]);

  const selectedResult = results.find((r) => r.systemId === selectedSysId) ?? null;
  const selectedSystem = systems.find((s) => s.id === selectedSysId) ?? null;

  const handleRunAll = () => {
    const goalNum = goal > 0 ? goal : undefined;
    const ddNum = ddLimit > 0 ? ddLimit : undefined;
    const simResults = systems.map((sys) => runSimulation(trades, sys, startingBalance, goalNum, ddNum));
    setResults(simResults);
    if (simResults.length > 0) setSelectedSysId(simResults[0].systemId);
  };

  return (
    <div className="space-y-5">
      <div className="neu-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wallet size={18} className="neu-text-gold" />
          <h2 className="text-base font-semibold neu-text-primary">{t('rm.step1')}</h2>
        </div>
        <DecimalInput
          value={startingBalance}
          onChange={setStartingBalance}
          className="neu-input max-w-xs px-4 py-2.5 font-mono"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <ListChecks size={18} className="neu-text-gold" />
          <h2 className="text-sm font-semibold neu-text-secondary">{t('rm.step2')}</h2>
        </div>
        <BacktestInput trades={trades} onChange={setTrades} />
      </div>

      {trades.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ListChecks size={18} className="neu-text-gold" />
            <h2 className="text-sm font-semibold neu-text-secondary">{t('rm.step3')}</h2>
          </div>
          <StrategyStatsPanel stats={strategyStats} />
        </div>
      )}

      {trades.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ListChecks size={18} className="neu-text-gold" />
            <h2 className="text-sm font-semibold neu-text-secondary">{t('rm.step4')}</h2>
          </div>
          <RiskSystemBuilder systems={systems} onChange={setSystems} />
        </div>
      )}

      {trades.length > 0 && systems.length > 0 && (
        <div className="neu-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Play size={18} className="neu-text-gold" />
            <h2 className="text-base font-semibold neu-text-primary">{t('rm.step5')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.goal')}</label>
              <DecimalInput value={goal} onChange={setGoal} placeholder="$12,000" className="neu-input w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.maxDDLimit')}</label>
              <DecimalInput value={ddLimit} onChange={setDdLimit} placeholder="10%" className="neu-input w-full px-4 py-2.5" />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRunAll}
                className="flex w-full items-center justify-center gap-1.5 neu-btn px-4 py-2.5 text-sm font-bold neu-text-gold transition-colors"
              >
                <Play size={16} />
                {t('rm.runAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && <ComparisonTable results={results} />}
      {results.length > 0 && <EquityCurves results={results} />}

      {results.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Table2 size={18} className="neu-text-gold" />
            <h2 className="text-sm font-semibold neu-text-secondary">{t('rm.tradeDetails')}</h2>
          </div>
          {results.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {results.map((r) => (
                <button
                  key={r.systemId}
                  onClick={() => setSelectedSysId(r.systemId)}
                  className={`neu-btn px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedSysId === r.systemId ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'
                  }`}
                  style={{ borderRadius: '0.5rem' }}
                >
                  {r.systemName}
                </button>
              ))}
            </div>
          )}
          <TradeDetailTable result={selectedResult} />
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Dices size={18} className="neu-text-gold" />
            <h2 className="text-sm font-semibold neu-text-secondary">{t('rm.monteCarlo')}</h2>
          </div>
          <MonteCarloPanel trades={trades} system={selectedSystem} startingBalance={startingBalance} />
        </div>
      )}
    </div>
  );
}
