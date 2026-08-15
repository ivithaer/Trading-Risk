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
      color: aggregate.netPnl >= 0 ? 'neu-text-profit' : 'neu-text-loss',
    },
    { label: t('test5x.winRate'), value: `${formatNumber(aggregate.actualWinRate, 1)}%` },
    {
      label: t('test5x.maxDrawdown'),
      value: `${formatCurrency(aggregate.maxDrawdown)} (${formatNumber(aggregate.maxDrawdownPercent, 1)}%)`,
      color: 'neu-text-loss',
    },
    { label: t('test5x.profitFactor'), value: pfText, color: aggregate.profitFactor >= 1 ? 'neu-text-profit' : 'neu-text-loss' },
    { label: t('test5x.score'), value: formatNumber(score, 1), color: 'neu-text-gold' },
  ];

  return (
    <div className="neu-card overflow-hidden p-5">
      <div className="mb-4 flex items-center gap-2">
        <FlaskConical size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('test5x.resultsTitle')}</h2>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="neu-card-inset px-3 py-2" style={{ borderRadius: '0.75rem' }}>
          <span className="neu-text-muted">{t('test5x.startingBalance')}</span>
          <span className="mt-0.5 block font-mono font-semibold neu-text-primary">
            {formatCurrency(settings.startingBalance)}
          </span>
        </div>
        <div className="neu-card-inset px-3 py-2" style={{ borderRadius: '0.75rem' }}>
          <span className="neu-text-muted">{t('test5x.tradesPerRun')}</span>
          <span className="mt-0.5 block font-mono font-semibold neu-text-primary">
            {settings.maxTrades}
          </span>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="neu-text-muted">
              <th className="px-2 py-1.5 text-left font-medium">{t('test5x.run')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.netPnl')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.winRate')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.maxDrawdown')}</th>
              <th className="px-2 py-1.5 text-right font-mono font-medium">{t('test5x.profitFactor')}</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, i) => {
              const runPf = run.profitFactor === Infinity ? '∞' : formatNumber(run.profitFactor, 2);
              return (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                  <td className="px-2 py-1.5 neu-text-secondary">
                    {t('test5x.run')} {i + 1}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono ${run.netPnl >= 0 ? 'neu-text-profit' : 'neu-text-loss'}`}>
                    {run.netPnl >= 0 ? '+' : ''}{formatCurrency(run.netPnl)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono neu-text-secondary">
                    {formatNumber(run.actualWinRate, 1)}%
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono neu-text-loss">
                    {formatCurrency(run.maxDrawdown)}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-mono ${run.profitFactor >= 1 ? 'neu-text-profit' : 'neu-text-loss'}`}>
                    {runPf}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2" style={{ borderColor: 'var(--neu-gold)' }}>
              <td className="px-2 py-2 font-bold neu-text-gold">{t('test5x.average')}</td>
              <td className={`px-2 py-2 text-right font-mono font-bold ${isPositive ? 'neu-text-profit' : 'neu-text-loss'}`}>
                {aggregate.netPnl >= 0 ? '+' : ''}{formatCurrency(aggregate.netPnl)}
              </td>
              <td className="px-2 py-2 text-right font-mono font-bold neu-text-gold">
                {formatNumber(aggregate.actualWinRate, 1)}%
              </td>
              <td className="px-2 py-2 text-right font-mono font-bold neu-text-loss">
                {formatCurrency(aggregate.maxDrawdown)}
              </td>
              <td className={`px-2 py-2 text-right font-mono font-bold ${aggregate.profitFactor >= 1 ? 'neu-text-profit' : 'neu-text-loss'}`}>
                {pfText}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
            <div className="mb-1 text-xs neu-text-muted">{m.label}</div>
            <div className={`font-mono text-base font-semibold ${m.color || 'neu-text-primary'}`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 neu-card-inset px-3 py-2 text-xs neu-text-muted" style={{ borderRadius: '0.75rem' }}>
        {isPositive ? (
          <TrendingUp size={14} className="neu-text-profit" />
        ) : (
          <TrendingDown size={14} className="neu-text-loss" />
        )}
        <span>
          {t('test5x.totalTrades')}: {runs.length * settings.maxTrades} ({runs.length} × {settings.maxTrades})
        </span>
      </div>
    </div>
  );
}
