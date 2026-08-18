import { useState } from 'react';
import { Dices, Loader2, Target, AlertTriangle, Info } from 'lucide-react';
import type { BacktestTrade, RiskSystem, MonteCarloResult } from '@/lib/rmTypes';
import { runMonteCarlo } from '@/lib/rmEngine';
import { useI18n } from '@/lib/i18n';
import DecimalInput from '@/components/DecimalInput';

interface Props {
  trades: BacktestTrade[];
  system: RiskSystem | null;
  startingBalance: number;
}

const RUN_OPTIONS = [100, 500, 1000, 5000, 10000];

function fmt(n: number, dec = 2): string {
  if (n === Infinity) return '∞';
  return n.toFixed(dec);
}

export default function MonteCarloPanel({ trades, system, startingBalance }: Props) {
  const { t } = useI18n();
  const [numRuns, setNumRuns] = useState(1000);
  const [goal, setGoal] = useState(0);
  const [ddLimit, setDdLimit] = useState(10);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MonteCarloResult | null>(null);

  const handleRun = async () => {
    if (!system || trades.length === 0) return;
    setRunning(true);
    setResult(null);
    const goalNum = goal > 0 ? goal : undefined;
    const ddNum = ddLimit > 0 ? ddLimit : undefined;
    await new Promise((r) => setTimeout(r, 50));
    const mc = runMonteCarlo(trades, system, startingBalance, numRuns, goalNum, ddNum);
    setResult(mc);
    setRunning(false);
  };

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Dices size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('rm.monteCarlo')}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.mcRuns')}</label>
          <select value={numRuns} onChange={(e) => setNumRuns(parseInt(e.target.value))} className="neu-input w-full px-4 py-2.5">
            {RUN_OPTIONS.map((n) => (
              <option key={n} value={n}>{n.toLocaleString('en-US')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.goal')}</label>
          <DecimalInput value={goal} onChange={setGoal} placeholder="$12,000" className="neu-input w-full px-4 py-2.5" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.maxDDLimit')}</label>
          <DecimalInput value={ddLimit} onChange={setDdLimit} placeholder="10" className="neu-input w-full px-4 py-2.5" />
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={running || !system || trades.length === 0}
        className="mt-3 flex items-center gap-1.5 neu-btn px-4 py-2 text-sm font-bold neu-text-gold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : <Dices size={16} />}
        {running ? t('rm.mcRunning') : t('rm.mcRun')}
      </button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="neu-card-inset p-3" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <p className="text-xs neu-text-muted">{t('rm.mcAvgFinal')}</p>
              <p className="font-mono text-base font-semibold neu-text-primary sm:text-lg" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>${fmt(result.avgFinalBalance, 0)}</p>
            </div>
            <div className="neu-card-inset p-3" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <p className="text-xs neu-text-muted">{t('rm.mcMedian')}</p>
              <p className="font-mono text-base font-semibold neu-text-primary sm:text-lg" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>${fmt(result.medianFinalBalance, 0)}</p>
            </div>
            <div className="neu-card-inset p-3" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <p className="text-xs neu-text-muted">{t('rm.mcBest')}</p>
              <p className="font-mono text-base font-semibold neu-text-profit sm:text-lg" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>${fmt(result.bestResult, 0)}</p>
            </div>
            <div className="neu-card-inset p-3" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <p className="text-xs neu-text-muted">{t('rm.mcWorst')}</p>
              <p className="font-mono text-base font-semibold neu-text-loss sm:text-lg" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>${fmt(result.worstResult, 0)}</p>
            </div>
            <div className="neu-card-inset p-3" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <p className="text-xs neu-text-muted">{t('rm.mcAvgDD')}</p>
              <p className="font-mono text-base font-semibold neu-text-loss sm:text-lg" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>{fmt(result.avgMaxDrawdown, 1)}%</p>
            </div>
            <div className="neu-card-inset p-3" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <p className="text-xs neu-text-muted">{t('rm.mcWorstDD')}</p>
              <p className="font-mono text-base font-semibold neu-text-loss sm:text-lg" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>{fmt(result.worstMaxDrawdown, 1)}%</p>
            </div>
          </div>

          <div className="neu-card-inset p-3" style={{ borderRadius: '0.75rem' }}>
            <p className="mb-2 text-xs neu-text-muted">Percentiles ({t('rm.finalBal')})</p>
            <div className="grid grid-cols-5 gap-1 text-center sm:gap-2">
              {[
                { label: '5%', val: result.p5 },
                { label: '25%', val: result.p25 },
                { label: '50%', val: result.p50 },
                { label: '75%', val: result.p75 },
                { label: '95%', val: result.p95 },
              ].map((p) => (
                <div key={p.label} style={{ overflow: 'hidden' }}>
                  <p className="text-xs neu-text-muted">{p.label}</p>
                  <p className="font-mono text-xs font-semibold neu-text-primary sm:text-sm" style={{ overflowWrap: 'break-word', wordBreak: 'break-all' }}>${fmt(p.val, 0)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2 neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
              <Target size={16} className="neu-text-profit" />
              <div>
                <p className="text-xs neu-text-muted">{t('rm.mcProbGoal')}</p>
                <p className="font-mono text-sm font-semibold neu-text-profit">{fmt(result.probHitGoal, 1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
              <AlertTriangle size={16} className="neu-text-loss" />
              <div>
                <p className="text-xs neu-text-muted">{t('rm.mcProbDD')}</p>
                <p className="font-mono text-sm font-semibold neu-text-loss">{fmt(result.probExceedDrawdown, 1)}%</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 neu-card-inset px-3 py-2" style={{ borderRadius: '0.75rem' }}>
            <Info size={14} className="mt-0.5 shrink-0 neu-text-muted" />
            <p className="text-xs neu-text-muted">{t('rm.disclaimerMC')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
