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
    <div className="card relative overflow-hidden p-6">
      <div
        className={`pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full opacity-20 blur-3xl transition-colors duration-500 ${
          lastResult === 'win' ? 'bg-profit' : lastResult === 'loss' ? 'bg-loss' : 'bg-gold'
        }`}
      />
      <div className="relative">
        <div className="mb-1 flex items-center justify-center gap-2 text-ink-secondary">
          <Wallet size={15} />
          <span className="text-sm font-medium">{t('balance.accountBalance')}</span>
        </div>
        <div className="text-center">
          <div
            key={balance}
            className={`animate-count-up font-mono text-5xl font-bold tracking-tight ${
              isPositive ? 'text-ink-primary' : 'text-loss-light'
            }`}
          >
            ${formatCurrency(balance).replace('$', '')}
          </div>
          <div
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
              isPositive ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss-light'
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
              lastResult === 'win' ? 'text-profit' : 'text-loss-light'
            }`}
          >
            {lastResult === 'win' ? '+' : ''}
            {formatCurrency(lastPnl)}
          </div>
        )}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-secondary">{t('balance.nextRisk')}</span>
            <span className="font-mono font-semibold text-gold">{formatCurrency(currentRiskAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-secondary">{t('balance.tradesExecuted')}</span>
            <span className="font-mono font-semibold text-ink-primary">
              {tradeCount} / {maxTrades}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-base-600">
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold to-gold-dark transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
