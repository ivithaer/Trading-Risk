import { Table2 } from 'lucide-react';
import type { SimResult } from '@/lib/rmTypes';
import { useI18n } from '@/lib/i18n';

interface Props {
  result: SimResult | null;
}

function fmt(n: number, dec = 2): string {
  if (n === Infinity) return '∞';
  return n.toFixed(dec);
}

export default function TradeDetailTable({ result }: Props) {
  const { t } = useI18n();

  if (!result) {
    return (
      <div className="card flex flex-col items-center justify-center p-8 text-center">
        <Table2 size={32} className="mb-2 text-ink-muted" />
        <p className="text-sm text-ink-secondary">{t('rm.selectSystem')}</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Table2 size={18} className="text-gold" />
        <h2 className="text-base font-semibold text-ink-primary">{t('rm.tradeDetails')} — {result.systemName}</h2>
      </div>

      <div className="max-h-96 overflow-auto rounded-xl border border-base-500/40">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-base-800/90 text-ink-muted backdrop-blur-sm">
            <tr>
              <th className="p-2 text-start">#</th>
              <th className="p-2 text-start">{t('rm.result')}</th>
              <th className="p-2 text-end">R</th>
              <th className="p-2 text-end">{t('rm.balBefore')}</th>
              <th className="p-2 text-end">{t('rm.riskApplied')}</th>
              <th className="p-2 text-end">{t('rm.riskAmount')}</th>
              <th className="p-2 text-end">{t('rm.pnl')}</th>
              <th className="p-2 text-end">{t('rm.balAfter')}</th>
              <th className="p-2 text-end">{t('rm.peakBal')}</th>
              <th className="p-2 text-end">{t('rm.ddAmount')}</th>
              <th className="p-2 text-end">{t('rm.ddPct')}</th>
              <th className="p-2 text-end">{t('rm.winStreak')}</th>
              <th className="p-2 text-end">{t('rm.lossStreak')}</th>
              <th className="p-2 text-end">{t('rm.nextRisk')}</th>
            </tr>
          </thead>
          <tbody>
            {result.trades.map((tr) => (
              <tr key={tr.index} className="border-t border-base-500/20 hover:bg-base-700/30">
                <td className="p-2 text-ink-muted">{tr.index}</td>
                <td className="p-2 text-ink-secondary">{tr.result}</td>
                <td className={`p-2 text-end font-mono ${tr.r > 0 ? 'text-profit' : tr.r < 0 ? 'text-loss-light' : 'text-ink-muted'}`}>{tr.r > 0 ? '+' : ''}{tr.r}</td>
                <td className="p-2 text-end font-mono text-ink-secondary">${tr.balanceBefore.toFixed(0)}</td>
                <td className="p-2 text-end font-mono text-ink-secondary">{tr.riskPct.toFixed(2)}%</td>
                <td className="p-2 text-end font-mono text-ink-secondary">${tr.riskAmount.toFixed(0)}</td>
                <td className={`p-2 text-end font-mono ${tr.pnl >= 0 ? 'text-profit' : 'text-loss-light'}`}>{tr.pnl >= 0 ? '+' : ''}${tr.pnl.toFixed(0)}</td>
                <td className="p-2 text-end font-mono text-ink-primary">${tr.balanceAfter.toFixed(0)}</td>
                <td className="p-2 text-end font-mono text-ink-muted">${tr.peakBalance.toFixed(0)}</td>
                <td className="p-2 text-end font-mono text-loss-light">${tr.drawdown.toFixed(0)}</td>
                <td className="p-2 text-end font-mono text-loss-light">{tr.drawdownPct.toFixed(1)}%</td>
                <td className="p-2 text-end font-mono text-profit">{tr.winStreak}</td>
                <td className="p-2 text-end font-mono text-loss-light">{tr.lossStreak}</td>
                <td className="p-2 text-end font-mono text-gold">{tr.nextRiskPct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
