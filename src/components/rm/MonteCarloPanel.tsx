import { useState } from 'react';
import { Dices, Loader2, Target, AlertTriangle, Info } from 'lucide-react';
import type { BacktestTrade, RiskSystem, MonteCarloResult } from '@/lib/rmTypes';
import { runMonteCarlo } from '@/lib/rmEngine';
import { useI18n } from '@/lib/i18n';

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
  const [goal, setGoal] = useState('');
  const [ddLimit, setDdLimit] = useState('10');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MonteCarloResult | null>(null);

  const handleRun = async () => {
    if (!system || trades.length === 0) return;
    setRunning(true);
    setResult(null);
    const goalNum = goal ? parseFloat(goal) : undefined;
    const ddNum = parseFloat(ddLimit) || undefined;
    await new Promise((r) => setTimeout(r, 50));
    const mc = runMonteCarlo(trades, system, startingBalance, numRuns, goalNum, ddNum);
    setResult(mc);
    setRunning(false);
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Dices size={18} className="text-gold" />
        <h2 className="text-base font-semibold text-ink-primary">{t('rm.monteCarlo')}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label-text">{t('rm.mcRuns')}</label>
          <select value={numRuns} onChange={(e) => setNumRuns(parseInt(e.target.value))} className="input-field">
            {RUN_OPTIONS.map((n) => (
              <option key={n} value={n}>{n.toLocaleString('en-US')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-text">{t('rm.goal')}</label>
          <input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="$12,000" className="input-field" />
        </div>
        <div>
          <label className="label-text">{t('rm.maxDDLimit')}</label>
          <input type="number" step="0.5" value={ddLimit} onChange={(e) => setDdLimit(e.target.value)} placeholder="10" className="input-field" />
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={running || !system || trades.length === 0}
        className="mt-3 flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-base-900 transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? <Loader2 size={16} className="animate-spin" /> : <Dices size={16} />}
        {running ? t('rm.mcRunning') : t('rm.mcRun')}
      </button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <p className="text-xs text-ink-muted">{t('rm.mcAvgFinal')}</p>
              <p className="font-mono text-lg font-semibold text-ink-primary">${fmt(result.avgFinalBalance, 0)}</p>
            </div>
            <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <p className="text-xs text-ink-muted">{t('rm.mcMedian')}</p>
              <p className="font-mono text-lg font-semibold text-ink-primary">${fmt(result.medianFinalBalance, 0)}</p>
            </div>
            <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <p className="text-xs text-ink-muted">{t('rm.mcBest')}</p>
              <p className="font-mono text-lg font-semibold text-profit">${fmt(result.bestResult, 0)}</p>
            </div>
            <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <p className="text-xs text-ink-muted">{t('rm.mcWorst')}</p>
              <p className="font-mono text-lg font-semibold text-loss-light">${fmt(result.worstResult, 0)}</p>
            </div>
            <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <p className="text-xs text-ink-muted">{t('rm.mcAvgDD')}</p>
              <p className="font-mono text-lg font-semibold text-loss-light">{fmt(result.avgMaxDrawdown, 1)}%</p>
            </div>
            <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <p className="text-xs text-ink-muted">{t('rm.mcWorstDD')}</p>
              <p className="font-mono text-lg font-semibold text-loss-light">{fmt(result.worstMaxDrawdown, 1)}%</p>
            </div>
          </div>

          {/* Percentiles */}
          <div className="rounded-xl border border-base-500/50 bg-base-800/40 p-3">
            <p className="mb-2 text-xs text-ink-muted">Percentiles ({t('rm.finalBal')})</p>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: '5%', val: result.p5 },
                { label: '25%', val: result.p25 },
                { label: '50%', val: result.p50 },
                { label: '75%', val: result.p75 },
                { label: '95%', val: result.p95 },
              ].map((p) => (
                <div key={p.label}>
                  <p className="text-xs text-ink-muted">{p.label}</p>
                  <p className="font-mono text-sm font-semibold text-ink-primary">${fmt(p.val, 0)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Probabilities */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <Target size={16} className="text-profit" />
              <div>
                <p className="text-xs text-ink-muted">{t('rm.mcProbGoal')}</p>
                <p className="font-mono text-sm font-semibold text-profit">{fmt(result.probHitGoal, 1)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-base-500/50 bg-base-800/60 p-3">
              <AlertTriangle size={16} className="text-loss-light" />
              <div>
                <p className="text-xs text-ink-muted">{t('rm.mcProbDD')}</p>
                <p className="font-mono text-sm font-semibold text-loss-light">{fmt(result.probExceedDrawdown, 1)}%</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-base-500/30 bg-base-900/40 p-3">
            <Info size={14} className="mt-0.5 shrink-0 text-ink-muted" />
            <p className="text-xs text-ink-muted">{t('rm.disclaimerMC')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
