import { FlaskConical, TrendingUp, TrendingDown } from 'lucide-react';
import type { Stats, Settings } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/riskEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  runs: Stats[];
  aggregate: Stats;
  settings: Settings;
  score: number;
}

export default function TestResultsPanel({ runs, aggregate, settings, score }: Props) {
  const { t } = useI18n();
  const avgBalance = settings.startingBalance + aggregate.netPnl;
  const isPositive = aggregate.netPnl >= 0;

  const pfText = aggregate.profitFactor === Infinity ? '∞' : formatNumber(aggregate.profitFactor, 2);

  const metrics: { label: string; value: string; color?: string }[] = [
    { label: t('test5x.finalBalance'), value: formatCurrency(avgBalance) },
    {
      label: t('test5x.netPnl'),
      value: `${aggregate.netPnl >= 0 ? '+' : ''}${formatCurrency(aggregate.netPnl)} (${formatNumber(aggregate.netPnlPercent, 1)}%)`,
      color: aggregate.netPnl >= 0 ? 'text-profit' : 'text-loss-light',
    },
    { label: t('test5x.winRate'), value: `${formatNumber(aggregate.actualWinRate, 1)}%` },
    {
      label: t('test5x.maxDrawdown'),
      value: `${formatCurrency(aggregate.maxDrawdown)} (${formatNumber(aggregate.maxDrawdownPercent, 1)}%)`,
      color: 'text-loss-light',
    },
    { label: t('test5x.profitFactor'), value: pfText, color: aggregate.profitFactor >= 1 ? 'text-profit' : 'text-loss-light' },
    { label: t('test5x.score'), value: formatNumber(score, 1), color: 'text-gold' },
  ];

  return (
    <div className="card overflow-hidden p-5">
      <div className="mb-4 flex items-center gap-2">
        <FlaskConical size={18} className="text-gold" />
        <h2 className="text-base font-semibold text-ink-primary">{t('test5x.resultsTitle')}</h2>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-base-500/40 bg-base-800/40 px-3 py-2">
          <span className="text-ink-muted">{t('test5x.startingBalance')}</span>
          <span className="mt-0.5 block font-mono font-semibold text-ink-primary">
            {formatCurrency(settings.startingBalance)}
          </span>
        </div>
        <div className="rounded-lg border border-base-500/40 bg-base-800/40 px-3 py-2">
          <span className="text-ink-muted">{t('test5x.tradesPerRun')}</span>
          <span className="mt-0.5 block font-mono font-semibold text-ink-primary">
            {settings.maxTrades}
          </span>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-base-500/40 text-ink-muted">
              <th className="px-2 py-1.5 text-left font-medium">{t('test5x.run')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.netPnl')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.winRate')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.maxDrawdown')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.profitFactor')}</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, i) => {
              const runBalance = settings.startingBalance + run.netPnl;
              const runPf = run.profitFactor === Infinity ? '∞' : formatNumber(run.profitFactor, 2);
              return (
                <tr key={i} className="border-b border-base-500/20">
                  <td className="px-2 py-1.5 text-ink-secondary">
                    {t('test5x.run')} {i + 1}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono ${run.netPnl >= 0 ? 'text-profit' : 'text-loss-light'}`}>
                    {run.netPnl >= 0 ? '+' : ''}{formatCurrency(run.netPnl)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-ink-secondary">
                    {formatNumber(run.actualWinRate, 1)}%
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-loss-light">
                    {formatCurrency(run.maxDrawdown)}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono ${run.profitFactor >= 1 ? 'text-profit' : 'text-loss-light'}`}>
                    {runPf}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gold/40 bg-gold/5">
              <td className="px-2 py-2 font-bold text-gold">{t('test5x.average')}</td>
              <td className={`px-2 py-2 text-right font-mono font-bold ${isPositive ? 'text-profit' : 'text-loss-light'}`}>
                {aggregate.netPnl >= 0 ? '+' : ''}{formatCurrency(aggregate.netPnl)}
              </td>
              <td className="px-2 py-2 text-right font-mono font-bold text-gold">
                {formatNumber(aggregate.actualWinRate, 1)}%
              </td>
              <td className="px-2 py-2 text-right font-mono font-bold text-loss-light">
                {formatCurrency(aggregate.maxDrawdown)}
              </td>
              <td className={`px-2 py-2 text-right font-mono font-bold ${aggregate.profitFactor >= 1 ? 'text-profit' : 'text-loss-light'}`}>
                {pfText}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
            <div className="mb-1 text-xs text-ink-muted">{m.label}</div>
            <div className={`font-mono text-base font-semibold ${m.color || 'text-ink-primary'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-base-500/40 bg-base-800/40 px-3 py-2 text-xs text-ink-muted">
        {isPositive ? (
          <TrendingUp size={14} className="text-profit" />
        ) : (
          <TrendingDown size={14} className="text-loss-light" />
        )}
        <span>
          {t('test5x.totalTrades')}: {runs.length * settings.maxTrades} ({runs.length} × {settings.maxTrades})
        </span>
      </div>
    </div>
  );
}
