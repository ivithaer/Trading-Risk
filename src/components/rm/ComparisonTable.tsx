import { useState } from 'react';
import { GitCompare, ArrowUpDown } from 'lucide-react';
import type { SimResult } from '@/lib/rmTypes';
import { useI18n } from '@/lib/i18n';

interface Props {
  results: SimResult[];
}

type SortKey = 'netPnlPct' | 'finalBalance' | 'maxDrawdownPct' | 'profitFactor' | 'recoveryFactor' | 'avgRiskPct';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'netPnlPct', label: 'rm.sortReturn' },
  { key: 'finalBalance', label: 'rm.sortFinal' },
  { key: 'maxDrawdownPct', label: 'rm.sortDD' },
  { key: 'profitFactor', label: 'rm.sortPF' },
  { key: 'recoveryFactor', label: 'rm.sortReturnDD' },
  { key: 'avgRiskPct', label: 'rm.sortRisk' },
];

function fmt(n: number, dec = 2): string {
  if (n === Infinity) return '∞';
  if (isNaN(n)) return '-';
  return n.toFixed(dec);
}

function fmtMoney(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ComparisonTable({ results }: Props) {
  const { t } = useI18n();
  const [sortKey, setSortKey] = useState<SortKey>('netPnlPct');

  if (results.length === 0) return null;

  const sorted = [...results].sort((a, b) => {
    if (sortKey === 'maxDrawdownPct' || sortKey === 'avgRiskPct') return a[sortKey] - b[sortKey];
    return b[sortKey] - a[sortKey];
  });

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitCompare size={18} className="neu-text-gold" />
          <h2 className="text-base font-semibold neu-text-primary">{t('rm.comparison')}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="neu-text-muted" />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="neu-input w-auto px-2 py-1.5 text-xs">
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{t(o.label)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="neu-text-muted">
            <tr className="border-b" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
              <th className="p-2 text-start">{t('rm.sysName')}</th>
              <th className="p-2 text-end">{t('rm.startBal')}</th>
              <th className="p-2 text-end">{t('rm.finalBal')}</th>
              <th className="p-2 text-end">{t('rm.netPnl')}</th>
              <th className="p-2 text-end">{t('rm.return')}</th>
              <th className="p-2 text-end">{t('rm.maxDD')}</th>
              <th className="p-2 text-end">{t('rm.maxDDPct')}</th>
              <th className="p-2 text-end">{t('rm.pf')}</th>
              <th className="p-2 text-end">{t('rm.totalTrades')}</th>
              <th className="p-2 text-end">{t('rm.wins')}</th>
              <th className="p-2 text-end">{t('rm.losses')}</th>
              <th className="p-2 text-end">{t('rm.breakEvens')}</th>
              <th className="p-2 text-end">{t('rm.winRate')}</th>
              <th className="p-2 text-end">{t('rm.avgR')}</th>
              <th className="p-2 text-end">{t('rm.totalR')}</th>
              <th className="p-2 text-end">{t('rm.avgRiskPct')}</th>
              <th className="p-2 text-end">{t('rm.maxRiskPct')}</th>
              <th className="p-2 text-end">{t('rm.minRiskPct')}</th>
              <th className="p-2 text-end">{t('rm.longestLossStreak')}</th>
              <th className="p-2 text-end">{t('rm.longestWinStreak')}</th>
              <th className="p-2 text-end">{t('rm.recoveryFactor')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.systemId} className="border-b" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                <td className="p-2 font-medium neu-text-primary">{r.systemName}</td>
                <td className="p-2 text-end font-mono neu-text-secondary">${r.startingBalance.toLocaleString('en-US')}</td>
                <td className="p-2 text-end font-mono neu-text-primary">${r.finalBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className={`p-2 text-end font-mono ${r.netPnl >= 0 ? 'neu-text-profit' : 'neu-text-loss'}`}>{fmtMoney(r.netPnl)}</td>
                <td className={`p-2 text-end font-mono ${r.netPnlPct >= 0 ? 'neu-text-profit' : 'neu-text-loss'}`}>{r.netPnlPct >= 0 ? '+' : ''}{fmt(r.netPnlPct, 1)}%</td>
                <td className="p-2 text-end font-mono neu-text-loss">${fmt(r.maxDrawdown, 0)}</td>
                <td className="p-2 text-end font-mono neu-text-loss">{fmt(r.maxDrawdownPct, 1)}%</td>
                <td className={`p-2 text-end font-mono ${r.profitFactor >= 1 ? 'neu-text-profit' : 'neu-text-loss'}`}>{fmt(r.profitFactor)}</td>
                <td className="p-2 text-end font-mono neu-text-secondary">{r.totalTrades}</td>
                <td className="p-2 text-end font-mono neu-text-profit">{r.wins}</td>
                <td className="p-2 text-end font-mono neu-text-loss">{r.losses}</td>
                <td className="p-2 text-end font-mono neu-text-muted">{r.breakEvens}</td>
                <td className="p-2 text-end font-mono neu-text-secondary">{fmt(r.winRate, 1)}%</td>
                <td className="p-2 text-end font-mono neu-text-secondary">{fmt(r.avgR)}</td>
                <td className={`p-2 text-end font-mono ${r.totalR >= 0 ? 'neu-text-profit' : 'neu-text-loss'}`}>{r.totalR >= 0 ? '+' : ''}{fmt(r.totalR, 1)}</td>
                <td className="p-2 text-end font-mono neu-text-secondary">{fmt(r.avgRiskPct, 2)}%</td>
                <td className="p-2 text-end font-mono neu-text-secondary">{fmt(r.maxRiskPct, 2)}%</td>
                <td className="p-2 text-end font-mono neu-text-secondary">{fmt(r.minRiskPct, 2)}%</td>
                <td className="p-2 text-end font-mono neu-text-loss">{r.longestLossStreak}</td>
                <td className="p-2 text-end font-mono neu-text-profit">{r.longestWinStreak}</td>
                <td className="p-2 text-end font-mono neu-text-secondary">{fmt(r.recoveryFactor, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
