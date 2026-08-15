import { useState } from 'react';
import { LineChart, TrendingDown, Eye, EyeOff } from 'lucide-react';
import type { SimResult } from '@/lib/rmTypes';
import { useI18n } from '@/lib/i18n';

interface Props {
  results: SimResult[];
}

const COLORS = ['#F0B90B', '#16C784', '#EA3943', '#3B82F6', '#A855F7', '#F97316', '#06B6D4', '#EC4899'];

export default function EquityCurves({ results }: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState<Set<string>>(new Set(results.map((r) => r.systemId)));
  const [hover, setHover] = useState<{ x: number; y: number; data: { sysName: string; trade: number; result: string; r: number; riskPct: number; riskAmount: number; pnl: number; balance: number; drawdown: number; drawdownPct: number } } | null>(null);

  if (results.length === 0) return null;

  const width = 100;
  const height = 100;
  const padding = 4;

  const allBalances: number[] = [];
  const maxTrades = Math.max(...results.map((r) => r.trades.length));
  results.forEach((r) => {
    allBalances.push(r.startingBalance);
    r.trades.forEach((tr) => allBalances.push(tr.balanceAfter));
  });
  const minBal = Math.min(...allBalances);
  const maxBal = Math.max(...allBalances);
  const range = maxBal - minBal || 1;

  const toggle = (id: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const xFor = (i: number) => padding + (i / (maxTrades || 1)) * (width - padding * 2);
  const yFor = (bal: number) => height - padding - ((bal - minBal) / range) * (height - padding * 2);

  return (
    <div className="neu-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <LineChart size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('rm.equityCurves')}</h2>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {results.map((r, i) => {
          const color = COLORS[i % COLORS.length];
          const isVisible = visible.has(r.systemId);
          return (
            <button
              key={r.systemId}
              onClick={() => toggle(r.systemId)}
              className="flex items-center gap-1.5 neu-btn px-2.5 py-1 text-xs font-medium transition-colors"
              style={{ opacity: isVisible ? 1 : 0.4, borderRadius: '0.5rem' }}
            >
              {isVisible ? <Eye size={12} style={{ color }} /> : <EyeOff size={12} className="neu-text-muted" />}
              <span className="neu-text-secondary">{r.systemName}</span>
            </button>
          );
        })}
      </div>

      <div className="relative" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-56 w-full">
          <line x1={padding} y1={yFor(results[0].startingBalance)} x2={width - padding} y2={yFor(results[0].startingBalance)} stroke="var(--neu-shadow-dark)" strokeWidth="0.3" strokeDasharray="2 2" />
          {results.map((r, i) => {
            if (!visible.has(r.systemId)) return null;
            const color = COLORS[i % COLORS.length];
            const points = [r.startingBalance, ...r.trades.map((tr) => tr.balanceAfter)];
            const pathD = points.map((bal, j) => `${j === 0 ? 'M' : 'L'} ${xFor(j).toFixed(2)} ${yFor(bal).toFixed(2)}`).join(' ');
            return (
              <path
                key={r.systemId}
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="0.8"
                strokeLinejoin="round"
                onMouseMove={(e) => {
                  const svg = e.currentTarget.ownerSVGElement;
                  if (!svg) return;
                  const rect = svg.getBoundingClientRect();
                  const px = ((e.clientX - rect.left) / rect.width) * 100;
                  const tradeIdx = Math.round(((px - padding) / (width - padding * 2)) * maxTrades);
                  if (tradeIdx >= 0 && tradeIdx < r.trades.length) {
                    const tr = r.trades[tradeIdx];
                    setHover({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      data: { sysName: r.systemName, trade: tr.index, result: tr.result, r: tr.r, riskPct: tr.riskPct, riskAmount: tr.riskAmount, pnl: tr.pnl, balance: tr.balanceAfter, drawdown: tr.drawdown, drawdownPct: tr.drawdownPct },
                    });
                  }
                }}
              />
            );
          })}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 neu-card p-3 text-xs"
            style={{ left: Math.min(hover.x + 8, 300), top: Math.max(hover.y - 80, 0), borderRadius: '0.75rem' }}
          >
            <p className="mb-1 font-semibold neu-text-gold">{hover.data.sysName}</p>
            <p className="neu-text-secondary">#{hover.data.trade} | {hover.data.result} | R: {hover.data.r > 0 ? '+' : ''}{hover.data.r}</p>
            <p className="neu-text-secondary">{t('rm.riskApplied')}: {hover.data.riskPct.toFixed(2)}% | ${hover.data.riskAmount.toFixed(0)}</p>
            <p className={hover.data.pnl >= 0 ? 'neu-text-profit' : 'neu-text-loss'}>{t('rm.pnl')}: {hover.data.pnl >= 0 ? '+' : ''}${hover.data.pnl.toFixed(0)}</p>
            <p className="neu-text-primary">{t('rm.balAfter')}: ${hover.data.balance.toFixed(0)}</p>
            <p className="neu-text-loss">{t('rm.ddPct')}: {hover.data.drawdownPct.toFixed(1)}%</p>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingDown size={16} className="neu-text-loss" />
          <h3 className="text-sm font-semibold neu-text-secondary">{t('rm.drawdownCurve')}</h3>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-32 w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--neu-shadow-dark)" strokeWidth="0.3" />
          {results.map((r, i) => {
            if (!visible.has(r.systemId)) return null;
            const color = COLORS[i % COLORS.length];
            const points = r.trades.map((tr) => tr.drawdownPct);
            const maxDD = Math.max(...points, 0.1);
            const yDD = (dd: number) => height - padding - (dd / maxDD) * (height - padding * 2);
            const pathD = points.map((dd, j) => `${j === 0 ? 'M' : 'L'} ${xFor(j + 1).toFixed(2)} ${yDD(dd).toFixed(2)}`).join(' ');
            return <path key={r.systemId} d={pathD} fill="none" stroke={color} strokeWidth="0.6" opacity="0.7" strokeLinejoin="round" />;
          })}
        </svg>
      </div>
    </div>
  );
}
