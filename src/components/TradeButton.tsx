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
            ? 'neu-card-inset cursor-not-allowed opacity-50'
            : 'neu-card hover:scale-105 active:scale-95'
        }`}
      >
        {!disabled && !isComplete && !autoRun && !test5xRunning && (
          <span className="absolute inset-0 rounded-full animate-pulse-ring" />
        )}
        <div className="flex flex-col items-center gap-1">
          <Dices
            size={36}
            className={`transition-transform duration-300 ${
              disabled || isComplete || autoRun || test5xRunning
                ? 'neu-text-muted'
                : 'neu-text-gold group-hover:rotate-12'
            }`}
          />
          <span className={`text-sm font-bold ${
            disabled || isComplete || autoRun || test5xRunning ? 'neu-text-muted' : 'neu-text-gold'
          }`}>
            {isComplete ? t('trade.complete') : t('trade.execute')}
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={onToggleAutoRun}
        disabled={disabled || isComplete || test5xRunning}
        className={`flex items-center gap-2 neu-btn px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
          autoRun ? 'neu-pressed neu-text-profit' : 'neu-text-secondary'
        }`}
      >
        {autoRun ? <Square size={15} /> : <Zap size={15} />}
        {autoRun ? t('trade.stopAuto') : t('trade.autoRun')}
      </button>

      <button
        type="button"
        onClick={onTest5x}
        disabled={disabled || autoRun || test5xRunning}
        className={`flex items-center gap-2 neu-btn px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
          test5xRunning ? 'neu-pressed neu-text-gold' : 'neu-text-secondary hover:neu-text-gold'
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
        className="flex items-center gap-1.5 neu-btn px-4 py-2 text-sm font-medium neu-text-secondary transition-colors hover:neu-text-primary"
      >
        <RotateCcw size={15} />
        {t('trade.reset')}
      </button>

      <p className="text-center text-xs neu-text-muted">
        {autoRun
          ? t('trade.autoRunning')
          : `${t('trade.pressToTrade', { cur: tradeCount, max: maxTrades })}`}
      </p>
    </div>
  );
}
