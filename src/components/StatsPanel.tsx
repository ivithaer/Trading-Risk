import {
  BarChart3,
  Target,
  TrendingDown,
  Flame,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Scale,
  Percent,
} from 'lucide-react';
import type { Stats } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/riskEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  stats: Stats;
  hasTrades: boolean;
}

function StatCard({
  icon,
  label,
  value,
  valueClass = 'neu-text-primary',
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
      <div className="mb-1.5 flex items-center gap-1.5 neu-text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`font-mono text-lg font-semibold ${valueClass}`}>{value}</div>
      {sub && <div className="text-xs neu-text-muted">{sub}</div>}
    </div>
  );
}

export default function StatsPanel({ stats, hasTrades }: Props) {
  const { t } = useI18n();

  if (!hasTrades) {
    return (
      <div className="neu-card flex flex-col items-center justify-center p-8 text-center">
        <BarChart3 size={32} className="mb-2 neu-text-muted" />
        <p className="text-sm neu-text-secondary">{t('stats.startTrading')}</p>
      </div>
    );
  }

  const profitFactorText =
    stats.profitFactor === Infinity ? '∞' : formatNumber(stats.profitFactor, 2);

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('stats.title')}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          icon={<Target size={13} />}
          label={t('stats.actualWinRate')}
          value={`${formatNumber(stats.actualWinRate, 1)}%`}
          sub={`${stats.wins} ${t('stats.wins')} / ${stats.losses} ${t('stats.losses')}`}
        />
        <StatCard
          icon={<Activity size={13} />}
          label={t('stats.netPnl')}
          value={formatCurrency(stats.netPnl)}
          valueClass={stats.netPnl >= 0 ? 'neu-text-profit' : 'neu-text-loss'}
          sub={formatPercent(stats.netPnlPercent)}
        />
        <StatCard
          icon={<TrendingDown size={13} />}
          label={t('stats.maxDrawdown')}
          value={formatCurrency(stats.maxDrawdown)}
          valueClass="neu-text-loss"
          sub={`${formatNumber(stats.maxDrawdownPercent, 1)}%`}
        />
        <StatCard
          icon={<Scale size={13} />}
          label={t('stats.profitFactor')}
          value={profitFactorText}
          valueClass={stats.profitFactor >= 1 ? 'neu-text-profit' : 'neu-text-loss'}
        />
        <StatCard
          icon={<ArrowUpCircle size={13} />}
          label={t('stats.largestWin')}
          value={formatCurrency(stats.largestWin)}
          valueClass="neu-text-profit"
        />
        <StatCard
          icon={<ArrowDownCircle size={13} />}
          label={t('stats.largestLoss')}
          value={formatCurrency(stats.largestLoss)}
          valueClass="neu-text-loss"
        />
        <StatCard
          icon={<Flame size={13} />}
          label={t('stats.longestWinStreak')}
          value={`${stats.longestWinStreak}`}
          valueClass="neu-text-profit"
          sub={t('stats.consecutiveTrades')}
        />
        <StatCard
          icon={<Flame size={13} />}
          label={t('stats.longestLossStreak')}
          value={`${stats.longestLossStreak}`}
          valueClass="neu-text-loss"
          sub={t('stats.consecutiveTrades')}
        />
        <StatCard
          icon={<Percent size={13} />}
          label={t('stats.avgReturn')}
          value={formatCurrency(stats.expectancy)}
          valueClass={stats.expectancy >= 0 ? 'neu-text-profit' : 'neu-text-loss'}
        />
        <StatCard
          icon={<Activity size={13} />}
          label={t('stats.totalRisked')}
          value={formatCurrency(stats.totalRisked)}
        />
      </div>
      {stats.currentStreak > 1 && (
        <div
          className={`mt-3 flex items-center justify-center gap-2 neu-pill py-2 text-sm font-semibold ${
            stats.currentStreakType === 'win'
              ? 'neu-text-profit'
              : 'neu-text-loss'
          }`}
        >
          <Flame size={15} />
          {stats.currentStreakType === 'win' ? t('stats.winStreak') : t('stats.lossStreak')}: {stats.currentStreak}
        </div>
      )}
    </div>
  );
}
