import { Shield, Award, TrendingUp, Activity, Gauge } from 'lucide-react';
import type { RobustnessResult } from '@/lib/riskEngine';
import { formatNumber } from '@/lib/riskEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  result: RobustnessResult;
  isRecommended?: boolean;
  recommendationReason?: string;
  compact?: boolean;
}

export default function RobustnessBadge({ result, isRecommended, recommendationReason, compact }: Props) {
  const { t } = useI18n();

  const confidenceLabel = result.confidenceWeight >= 0.9 ? t('robust.high') : result.confidenceWeight >= 0.55 ? t('robust.medium') : t('robust.low');
  const confidenceColor = result.confidenceWeight >= 0.9 ? 'text-profit' : result.confidenceWeight >= 0.55 ? 'text-gold' : 'text-loss-light';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px]">
        <Shield size={11} className="text-gold" />
        <span className="neu-text-muted">{t('robust.score')}:</span>
        <span className="font-mono font-semibold neu-text-primary">{formatNumber(result.totalScore, 1)}</span>
        {isRecommended && (
          <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
            {t('robust.recommended')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isRecommended && (
        <div className="flex items-start gap-1.5 rounded-lg bg-gold/10 px-2.5 py-2">
          <Award size={13} className="mt-0.5 shrink-0 text-gold" />
          <div>
            <span className="text-[10px] font-bold text-gold">{t('robust.recommended')}</span>
            {recommendationReason && (
              <p className="text-[10px] leading-relaxed neu-text-secondary">{recommendationReason}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="flex items-center gap-1">
          <Shield size={10} className="text-gold" />
          <span className="neu-text-muted">{t('robust.score')}</span>
          <span className="font-mono font-semibold neu-text-primary ml-auto">{formatNumber(result.totalScore, 1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={10} className="text-gold" />
          <span className="neu-text-muted">{t('robust.performance')}</span>
          <span className="font-mono font-semibold neu-text-primary ml-auto">{formatNumber(result.performanceScore, 1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity size={10} className="text-gold" />
          <span className="neu-text-muted">{t('robust.confidence')}</span>
          <span className={`font-semibold ml-auto ${confidenceColor}`}>{confidenceLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge size={10} className="text-gold" />
          <span className="neu-text-muted">{t('robust.recovery')}</span>
          <span className="font-mono font-semibold neu-text-primary ml-auto">{formatNumber(result.recoveryFactor, 1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="neu-text-muted">{t('robust.effectiveDD')}</span>
          <span className="font-mono font-semibold neu-text-primary ml-auto">{formatNumber(result.effectiveDrawdown, 1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="neu-text-muted">{t('robust.lossStreak')}</span>
          <span className="font-mono font-semibold neu-text-primary ml-auto">{result.effectiveMaxLossStreak}</span>
        </div>
      </div>

      {result.explanation && (
        <div className="rounded-lg bg-base-800/40 px-2.5 py-1.5 text-[10px] leading-relaxed neu-text-muted">
          {result.explanation}
        </div>
      )}
    </div>
  );
}
