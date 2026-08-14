import { useState } from 'react';
import { Dices, Loader2, TrendingUp, AlertTriangle, Shield, BarChart3, Info } from 'lucide-react';
import type { Trade } from '@/types';
import { runSimulatorMonteCarlo, formatCurrency, formatNumber, type SimulatorMonteCarloResult } from '@/lib/riskEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  trades: Trade[];
  startingBalance: number;
}

const MIN_TRADES = 10;

function Gauge({ label, value, max, color, icon, suffix }: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ReactNode;
  suffix: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-ink-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mb-2 font-mono text-2xl font-bold" style={{ color }}>
        {formatNumber(value, 1)}{suffix}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-base-600">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Histogram({ data, bins, color, label, startingBalance }: {
  data: number[];
  bins: number;
  color: string;
  label: string;
  startingBalance: number;
}) {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const binSize = range / bins;
  const counts = new Array(bins).fill(0);

  for (const v of data) {
    let idx = Math.floor((v - min) / binSize);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }

  const maxCount = Math.max(...counts);
  const startBinIdx = Math.floor((startingBalance - min) / binSize);
  const startBin = Math.max(0, Math.min(bins - 1, startBinIdx));

  return (
    <div>
      <div className="mb-2 text-xs text-ink-muted">{label}</div>
      <div className="flex h-24 items-end gap-px">
        {counts.map((c, i) => {
          const h = maxCount > 0 ? (c / maxCount) * 100 : 0;
          const isProfit = i >= startBin;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-500"
              style={{
                height: `${h}%`,
                backgroundColor: isProfit ? '#16C784' : '#EA3943',
                opacity: 0.4 + (h / 100) * 0.6,
                minHeight: c > 0 ? '2px' : '0',
              }}
              title={`${formatCurrency(min + i * binSize)} — ${formatCurrency(min + (i + 1) * binSize)}: ${c}`}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        <span>{formatCurrency(min)}</span>
        <span className="text-gold">{formatCurrency(startingBalance)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}

export default function MonteCarloSimulatorPanel({ trades, startingBalance }: Props) {
  const { t } = useI18n();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulatorMonteCarloResult | null>(null);
  const [numSimulations, setNumSimulations] = useState(1000);

  const canRun = trades.length >= MIN_TRADES;

  const handleRun = async () => {
    if (!canRun) return;
    setRunning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 50));
    const mc = runSimulatorMonteCarlo(trades, startingBalance, numSimulations);
    setResult(mc);
    setRunning(false);
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Dices size={18} className="text-gold" />
        <h2 className="text-base font-semibold text-ink-primary">{t('mc.simulatorTitle')}</h2>
      </div>

      {!canRun ? (
        <div className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm text-ink-secondary">
            {t('mc.minTrades', { min: MIN_TRADES, current: trades.length })}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="label-text">{t('mc.numSimulations')}</label>
              <select
                value={numSimulations}
                onChange={(e) => setNumSimulations(parseInt(e.target.value))}
                className="input-field w-auto"
                disabled={running}
              >
                {[100, 500, 1000, 5000, 10000].map((n) => (
                  <option key={n} value={n}>{n.toLocaleString('en-US')}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-base-900 transition-colors hover:bg-gold-light disabled:opacity-50"
            >
              {running ? <Loader2 size={16} className="animate-spin" /> : <Dices size={16} />}
              {running ? t('mc.running') : t('mc.run')}
            </button>
            <div className="text-xs text-ink-muted">
              {trades.length} {t('mc.tradesUsed')}
            </div>
          </div>

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Gauge
                  label={t('mc.probProfit')}
                  value={result.probProfit}
                  max={100}
                  color="#16C784"
                  icon={<TrendingUp size={14} />}
                  suffix="%"
                />
                <Gauge
                  label={t('mc.worstDrawdown')}
                  value={result.worstDrawdownPct}
                  max={100}
                  color="#EA3943"
                  icon={<AlertTriangle size={14} />}
                  suffix="%"
                />
                <Gauge
                  label={t('mc.probLargeLoss')}
                  value={result.probLargeLoss}
                  max={100}
                  color="#F0B90B"
                  icon={<Shield size={14} />}
                  suffix="%"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
                  <p className="text-xs text-ink-muted">{t('mc.avgFinal')}</p>
                  <p className="font-mono text-base font-semibold text-ink-primary">{formatCurrency(result.avgFinalBalance)}</p>
                </div>
                <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
                  <p className="text-xs text-ink-muted">{t('mc.medianFinal')}</p>
                  <p className="font-mono text-base font-semibold text-ink-primary">{formatCurrency(result.medianFinalBalance)}</p>
                </div>
                <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
                  <p className="text-xs text-ink-muted">{t('mc.bestFinal')}</p>
                  <p className="font-mono text-base font-semibold text-profit">{formatCurrency(result.bestFinalBalance)}</p>
                </div>
                <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
                  <p className="text-xs text-ink-muted">{t('mc.worstFinal')}</p>
                  <p className="font-mono text-base font-semibold text-loss-light">{formatCurrency(result.worstFinalBalance)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-base-500/40 bg-base-800/40 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-gold" />
                  <span className="text-xs font-medium text-ink-secondary">{t('mc.percentiles')}</span>
                </div>
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
                      <p className="font-mono text-sm font-semibold text-ink-primary">{formatCurrency(p.val)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Histogram
                data={result.finalBalances}
                bins={30}
                color="#F0B90B"
                label={t('mc.distribution')}
                startingBalance={startingBalance}
              />

              <div className="flex items-start gap-2 rounded-xl border border-base-500/30 bg-base-900/40 p-3">
                <Info size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                <p className="text-xs text-ink-muted">{t('mc.disclaimer')}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
