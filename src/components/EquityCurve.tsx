import { LineChart } from 'lucide-react';
import type { Trade } from '@/types';
import { useI18n } from '@/lib/i18n';

interface Props {
  trades: Trade[];
  startingBalance: number;
}

export default function EquityCurve({ trades, startingBalance }: Props) {
  const { t } = useI18n();

  if (trades.length === 0) {
    return (
      <div className="neu-card flex flex-col items-center justify-center p-8 text-center">
        <LineChart size={32} className="mb-2 neu-text-muted" />
        <p className="text-sm neu-text-secondary">{t('equity.empty')}</p>
      </div>
    );
  }

  const width = 100;
  const height = 100;
  const padding = 4;
  const balances = [startingBalance, ...trades.map((tr) => tr.balanceAfter)];
  const minBal = Math.min(...balances);
  const maxBal = Math.max(...balances);
  const range = maxBal - minBal || 1;

  const points = balances.map((bal, i) => {
    const x = padding + (i / (balances.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((bal - minBal) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${points[0].x.toFixed(2)} ${height - padding} Z`;
  const isUp = trades[trades.length - 1].balanceAfter >= startingBalance;
  const lineColor = isUp ? 'var(--neu-profit)' : 'var(--neu-loss)';

  return (
    <div className="neu-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <LineChart size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('equity.title')}</h2>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-40 w-full">
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const startY =
              height - padding - ((startingBalance - minBal) / range) * (height - padding * 2);
            return (
              <line
                x1={padding}
                y1={startY}
                x2={width - padding}
                y2={startY}
                stroke="var(--neu-shadow-dark)"
                strokeWidth="0.4"
                strokeDasharray="2 2"
              />
            );
          })()}
          <path d={areaD} fill="url(#equityGrad)" />
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.2" strokeLinejoin="round" />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="1.5"
            fill={lineColor}
          />
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-xs neu-text-muted">
        <span>{t('equity.start')}: ${startingBalance.toLocaleString('en-US')}</span>
        <span>{t('equity.high')}: ${Math.round(maxBal).toLocaleString('en-US')}</span>
        <span>{t('equity.low')}: ${Math.round(minBal).toLocaleString('en-US')}</span>
      </div>
    </div>
  );
}
