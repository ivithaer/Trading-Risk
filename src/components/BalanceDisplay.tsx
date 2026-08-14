import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { TradeResult } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/riskEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  balance: number;
  startingBalance: number;
  lastResult: TradeResult | null;
  lastPnl: number | null;
  currentRiskAmount: number;
  tradeCount: number;
  maxTrades: number;
}

export default function BalanceDisplay({
  balance,
  startingBalance,
  lastResult,
  lastPnl,
  currentRiskAmount,
  tradeCount,
  maxTrades,
}: Props) {
  const { t } = useI18n();
  const netPnl = balance - startingBalance;
  const netPnlPercent = startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;
  const isPositive = netPnl >= 0;
  const progress = maxTrades > 0 ? (tradeCount / maxTrades) * 100 : 0;

  return (
    <div className="neu-card relative overflow-hidden p-6">
      <div
        className={`pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full opacity-10 blur-3xl transition-colors duration-500 ${
          lastResult === 'win' ? 'neu-bg-profit-soft' : lastResult === 'loss' ? 'neu-bg-loss-soft' : 'neu-bg-gold-soft'
        }`}
      />
      <div className="relative">
        <div className="mb-2 flex items-center justify-center gap-2 neu-text-secondary">
          <div className="neu-icon-box flex h-7 w-7 items-center justify-center">
            <Wallet size={14} />
          </div>
          <span className="text-sm font-medium">{t('balance.accountBalance')}</span>
        </div>
        <div className="text-center">
          <div
            key={balance}
            className={`animate-count-up font-mono text-5xl font-bold tracking-tight ${
              isPositive ? 'neu-text-primary' : 'neu-text-loss'
            }`}
          >
            ${formatCurrency(balance).replace('$', '')}
          </div>
          <div
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold neu-pill ${
              isPositive ? 'neu-text-profit' : 'neu-text-loss'
            }`}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-mono">
              {isPositive ? '+' : ''}
              {formatCurrency(netPnl)} ({formatPercent(netPnlPercent)})
            </span>
          </div>
        </div>
        {lastPnl !== null && lastResult !== null && (
          <div
            key={tradeCount}
            className={`animate-float-up pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 text-lg font-bold ${
              lastResult === 'win' ? 'neu-text-profit' : 'neu-text-loss'
            }`}
          >
            {lastResult === 'win' ? '+' : ''}
            {formatCurrency(lastPnl)}
          </div>
        )}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="neu-text-secondary">{t('balance.nextRisk')}</span>
            <span className="font-mono font-semibold neu-text-gold">{formatCurrency(currentRiskAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="neu-text-secondary">{t('balance.tradesExecuted')}</span>
            <span className="font-mono font-semibold neu-text-primary">
              {tradeCount} / {maxTrades}
            </span>
          </div>
          <div className="neu-track h-2 overflow-hidden p-px">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'var(--neu-gold)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
