import { BarChart3, Target, TrendingDown, Flame, Scale, Activity, Percent, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { StrategyStats } from '@/lib/rmTypes';
import { formatNumber } from '@/lib/riskEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  stats: StrategyStats;
}

function StatCard({ icon, label, value, valueClass = 'text-ink-primary', sub }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-ink-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`font-mono text-lg font-semibold ${valueClass}`}>{value}</div>
      {sub && <div className="text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

export default function StrategyStatsPanel({ stats }: Props) {
  const { t } = useI18n();
  const pfText = stats.profitFactor === Infinity ? '∞' : formatNumber(stats.profitFactor, 2);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-gold" />
        <h2 className="text-base font-semibold text-ink-primary">{t('rm.strategyPerformance')}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <StatCard icon={<Activity size={13} />} label={t('rm.totalTrades')} value={`${stats.totalTrades}`} />
        <StatCard icon={<Target size={13} />} label={t('rm.winRate')} value={`${formatNumber(stats.winRate, 1)}%`} valueClass="text-profit" sub={`${stats.wins} ${t('rm.wins')}`} />
        <StatCard icon={<Target size={13} />} label={t('rm.lossRate')} value={`${formatNumber(stats.lossRate, 1)}%`} valueClass="text-loss-light" sub={`${stats.losses} ${t('rm.losses')}`} />
        <StatCard icon={<Activity size={13} />} label={t('rm.breakEvens')} value={`${stats.breakEvens}`} />
        <StatCard icon={<Percent size={13} />} label={t('rm.avgR')} value={formatNumber(stats.avgR, 2)} valueClass={stats.avgR >= 0 ? 'text-profit' : 'text-loss-light'} />
        <StatCard icon={<Activity size={13} />} label={t('rm.totalR')} value={`${stats.totalR > 0 ? '+' : ''}${formatNumber(stats.totalR, 1)}`} valueClass={stats.totalR >= 0 ? 'text-profit' : 'text-loss-light'} />
        <StatCard icon={<ArrowUpCircle size={13} />} label={t('rm.avgWinR')} value={`+${formatNumber(stats.avgWinR, 2)}`} valueClass="text-profit" />
        <StatCard icon={<ArrowDownCircle size={13} />} label={t('rm.avgLossR')} value={formatNumber(stats.avgLossR, 2)} valueClass="text-loss-light" />
        <StatCard icon={<ArrowUpCircle size={13} />} label={t('rm.largestWinR')} value={`+${formatNumber(stats.largestWinR, 2)}`} valueClass="text-profit" />
        <StatCard icon={<ArrowDownCircle size={13} />} label={t('rm.largestLossR')} value={formatNumber(stats.largestLossR, 2)} valueClass="text-loss-light" />
        <StatCard icon={<Flame size={13} />} label={t('rm.longestWinStreak')} value={`${stats.longestWinStreak}`} valueClass="text-profit" />
        <StatCard icon={<Flame size={13} />} label={t('rm.longestLossStreak')} value={`${stats.longestLossStreak}`} valueClass="text-loss-light" />
        <StatCard icon={<Scale size={13} />} label={t('rm.profitFactor')} value={pfText} valueClass={stats.profitFactor >= 1 ? 'text-profit' : 'text-loss-light'} />
        <StatCard icon={<TrendingDown size={13} />} label={t('rm.expectancy')} value={formatNumber(stats.expectancy, 2)} valueClass={stats.expectancy >= 0 ? 'text-profit' : 'text-loss-light'} />
      </div>
    </div>
  );
}
