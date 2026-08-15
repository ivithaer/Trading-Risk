import { History, ArrowUp, ArrowDown } from 'lucide-react';
import type { Trade } from '@/types';
import { formatCurrency } from '@/lib/riskEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  trades: Trade[];
}

export default function TradeHistory({ trades }: Props) {
  const { t } = useI18n();

  if (trades.length === 0) {
    return (
      <div className="neu-card flex flex-col items-center justify-center p-8 text-center">
        <History size={32} className="mb-2 neu-text-muted" />
        <p className="text-sm neu-text-secondary">{t('history.empty')}</p>
      </div>
    );
  }

  const reversed = [...trades].reverse();

  return (
    <div className="neu-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <History size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('history.title')}</h2>
        <span className="mr-auto neu-pill px-2.5 py-0.5 text-xs font-medium neu-text-secondary">
          {trades.length}
        </span>
      </div>
      <div className="-mr-2 max-h-[480px] flex-1 space-y-1.5 overflow-y-auto pr-2">
        {reversed.map((trade) => (
          <div
            key={trade.index}
            className={`flex items-center gap-3 p-2.5 neu-card-inset ${
              trade.result === 'win' ? 'neu-bg-profit-soft' : 'neu-bg-loss-soft'
            }`}
            style={{ borderRadius: '1rem' }}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center neu-icon-box ${
                trade.result === 'win' ? 'neu-text-profit' : 'neu-text-loss'
              }`}
              style={{ borderRadius: '0.75rem' }}
            >
              {trade.result === 'win' ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold neu-text-primary">#{trade.index}</span>
                <span
                  className={`text-xs font-medium ${
                    trade.result === 'win' ? 'neu-text-profit' : 'neu-text-loss'
                  }`}
                >
                  {trade.result === 'win' ? t('history.win') : t('history.loss')}
                </span>
              </div>
              <div className="text-xs neu-text-muted">
                {t('history.risk')}: {formatCurrency(trade.riskAmount)}
              </div>
            </div>
            <div className="text-left">
              <div
                className={`font-mono text-sm font-semibold ${
                  trade.result === 'win' ? 'neu-text-profit' : 'neu-text-loss'
                }`}
              >
                {trade.result === 'win' ? '+' : ''}
                {formatCurrency(trade.pnl)}
              </div>
              <div className="font-mono text-xs neu-text-muted">
                {formatCurrency(trade.balanceAfter)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
