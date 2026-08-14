import { Dices, RotateCcw, Zap, Square, FlaskConical, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Props {
  onExecute: () => void;
  onReset: () => void;
  disabled: boolean;
  isComplete: boolean;
  tradeCount: number;
  maxTrades: number;
  autoRun: boolean;
  onToggleAutoRun: () => void;
  onTest5x: () => void;
  test5xRunning: boolean;
  test5xProgress: number;
}

export default function TradeButton({
  onExecute,
  onReset,
  disabled,
  isComplete,
  tradeCount,
  maxTrades,
  autoRun,
  onToggleAutoRun,
  onTest5x,
  test5xRunning,
  test5xProgress,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={onExecute}
        disabled={disabled || isComplete || autoRun || test5xRunning}
        className={`group relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-300 ${
          disabled || isComplete || autoRun || test5xRunning
            ? 'cursor-not-allowed bg-base-600 opacity-50'
            : 'bg-gradient-to-br from-gold to-gold-dark shadow-[0_0_30px_-5px_rgba(240,185,11,0.5)] hover:scale-105 hover:shadow-[0_0_40px_-5px_rgba(240,185,11,0.7)] active:scale-95'
        }`}
      >
        {!disabled && !isComplete && !autoRun && !test5xRunning && (
          <span className="absolute inset-0 rounded-full animate-pulse-ring" />
        )}
        <div className="flex flex-col items-center gap-1">
          <Dices
            size={36}
            className={`transition-transform duration-300 ${disabled || isComplete || autoRun || test5xRunning ? 'text-ink-muted' : 'text-base-900 group-hover:rotate-12'}`}
          />
          <span className={`text-sm font-bold ${disabled || isComplete || autoRun || test5xRunning ? 'text-ink-muted' : 'text-base-900'}`}>
            {isComplete ? t('trade.complete') : t('trade.execute')}
          </span>
        </div>
      </button>

      {/* Auto-run toggle */}
      <button
        type="button"
        onClick={onToggleAutoRun}
        disabled={disabled || isComplete || test5xRunning}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
          autoRun
            ? 'border-profit/50 bg-profit/10 text-profit'
            : 'border-base-500 bg-base-800 text-ink-secondary hover:border-base-400 hover:text-ink-primary'
        }`}
      >
        {autoRun ? <Square size={15} /> : <Zap size={15} />}
        {autoRun ? t('trade.stopAuto') : t('trade.autoRun')}
      </button>

      {/* 5× Test button */}
      <button
        type="button"
        onClick={onTest5x}
        disabled={disabled || autoRun || test5xRunning}
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
          test5xRunning
            ? 'border-gold/50 bg-gold/10 text-gold'
            : 'border-base-500 bg-base-800 text-ink-secondary hover:border-gold/50 hover:text-gold'
        }`}
      >
        {test5xRunning ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
        {test5xRunning
          ? t('trade.testing', { cur: test5xProgress, total: 5 })
          : t('trade.test5x')}
      </button>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-xl border border-base-500 bg-base-800 px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-base-400 hover:text-ink-primary"
      >
        <RotateCcw size={15} />
        {t('trade.reset')}
      </button>

      <p className="text-center text-xs text-ink-muted">
        {autoRun
          ? t('trade.autoRunning')
          : `${t('trade.pressToTrade', { cur: tradeCount, max: maxTrades })}`}
      </p>
    </div>
  );
}
