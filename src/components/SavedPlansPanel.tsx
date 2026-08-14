import { useEffect, useState, useCallback } from 'react';
import { Trophy, Trash2, Star, Download, RefreshCw, Info, Lock } from 'lucide-react';
import type { Stats, Settings, Trade } from '@/types';
import { WIN_RATES, TRADE_COUNTS } from '@/types';
import { formatCurrency, formatNumber, downloadPlanCsv } from '@/lib/riskEngine';
import { fetchTopPlansGlobal, checkPremium, type SavedPlan } from '@/lib/supabaseClient';
import { useI18n } from '@/lib/i18n';

interface LocalPlan {
  id: string;
  nickname: string;
  settings: Settings;
  stats: Stats;
  finalBalance: number;
  tradeCount: number;
  winRate: number;
  score: number;
  createdAt: number;
}

interface Props {
  trades: Trade[];
  settings: Settings;
  balance: number;
  isComplete: boolean;
  onReset: () => void;
}

const STORAGE_KEY = 'saved_risk_plans_v4';

export default function SavedPlansPanel({ trades, settings, balance, isComplete, onReset }: Props) {
  const { t } = useI18n();
  const [localPlans, setLocalPlans] = useState<LocalPlan[]>([]);
  const [dbPlans, setDbPlans] = useState<SavedPlan[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [premiumEmail, setPremiumEmail] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [premiumChecking, setPremiumChecking] = useState(false);
  const [premiumError, setPremiumError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLocalPlans(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persistLocal = useCallback((plans: LocalPlan[]) => {
    setLocalPlans(plans);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, []);

  const loadDbPlans = useCallback(async () => {
    setLoadingDb(true);
    const plans = await fetchTopPlansGlobal(20);
    setDbPlans(plans);
    setLoadingDb(false);
  }, []);

  useEffect(() => {
    loadDbPlans();
  }, [loadDbPlans]);

  // Listen for new plans saved by the 5× test button (via custom event)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as LocalPlan;
      setLocalPlans((prev) => {
        const sameGroup = [
          ...prev.filter(
            (p) => p.winRate === detail.winRate && p.tradeCount === detail.tradeCount,
          ),
          detail,
        ];
        sameGroup.sort((a, b) => b.score - a.score);
        const top5 = sameGroup.slice(0, 5);
        const others = prev.filter(
          (p) => !(p.winRate === detail.winRate && p.tradeCount === detail.tradeCount),
        );
        const next = [...others, ...top5];
        persistLocal(next);
        return next;
      });
      loadDbPlans();
    };
    window.addEventListener('plan-saved-5x', handler);
    return () => window.removeEventListener('plan-saved-5x', handler);
  }, [persistLocal, loadDbPlans]);

  const handleDeleteLocal = (id: string) => {
    persistLocal(localPlans.filter((p) => p.id !== id));
  };


  const handleDownloadLocal = (plan: LocalPlan) => {
    downloadPlanCsv({
      nickname: plan.nickname,
      settings: plan.settings,
      stats: plan.stats,
      final_balance: plan.finalBalance,
      trade_count: plan.tradeCount,
      win_rate: plan.winRate,
      score: plan.score,
      created_at: new Date(plan.createdAt).toISOString(),
    });
  };

  const handleDownloadDb = (plan: SavedPlan) => {
    downloadPlanCsv(plan, `plan_${plan.nickname ?? plan.id}.csv`);
  };

  const handlePremiumCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premiumEmail.trim()) return;
    setPremiumChecking(true);
    setPremiumError('');
    const result = await checkPremium(premiumEmail);
    setIsPremium(result);
    setPremiumChecking(false);
    if (!result) setPremiumError(t('plans.premiumError'));
  };

  const localGroups = WIN_RATES.flatMap((wr) =>
    TRADE_COUNTS.map((tc) => ({
      winRate: wr,
      tradeCount: tc,
      plans: localPlans
        .filter((p) => p.winRate === wr && p.tradeCount === tc)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    })),
  ).filter((g) => g.plans.length > 0);

  const dbGroups = WIN_RATES.flatMap((wr) =>
    TRADE_COUNTS.map((tc) => ({
      winRate: wr,
      tradeCount: tc,
      plans: dbPlans
        .filter((p) => p.win_rate === wr && p.trade_count === tc)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20),
    })),
  ).filter((g) => g.plans.length > 0);

  const renderPlanRow = (plan: LocalPlan | SavedPlan, i: number, isDb: boolean) => {
    const stats = plan.stats;
    const finalBalance = isDb ? (plan as SavedPlan).final_balance : (plan as LocalPlan).finalBalance;
    const name = plan.nickname ?? t('common.untitled');
    const id = (plan as any).id as string;
    return (
      <div key={id} className="flex items-center gap-2 rounded-lg border border-base-500/40 bg-base-800/40 p-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-base-600 text-[10px] font-bold text-ink-secondary">
          {i + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-ink-primary">{name}</div>
          <div className="text-[10px] text-ink-muted">
            {formatCurrency(finalBalance)} · {formatNumber(stats.netPnlPercent, 1)}% · DD: {formatNumber(stats.maxDrawdownPercent, 1)}% · {formatNumber(plan.score, 1)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => (isDb ? handleDownloadDb(plan as SavedPlan) : handleDownloadLocal(plan as LocalPlan))}
          className="shrink-0 text-ink-muted transition-colors hover:text-gold"
          title={t('plans.download')}
        >
          <Download size={13} />
        </button>
        {!isDb && (
          <button
            type="button"
            onClick={() => handleDeleteLocal(id)}
            className="shrink-0 text-ink-muted transition-colors hover:text-loss"
            title={t('plans.delete')}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Trophy size={18} className="text-gold" />
        <h2 className="text-base font-semibold text-ink-primary">{t('plans.title')}</h2>
      </div>

      <div className="mb-3 flex items-start gap-1.5 rounded-xl border border-base-500/40 bg-base-800/40 px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
        <Info size={13} className="mt-0.5 shrink-0 text-gold/70" />
        <span>{t('plans.info')}</span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-secondary">
          <Star size={14} className="text-gold" />
          {t('plans.best5')}
        </div>
        {localGroups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-base-500 py-4 text-center text-xs text-ink-muted">
            {t('plans.noPlans')}
          </p>
        ) : (
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {localGroups.map((group) => (
              <div key={`${group.winRate}-${group.tradeCount}`}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
                    {group.winRate}% · {group.tradeCount} {t('plans.trades')}
                  </span>
                  <span className="text-xs text-ink-muted">({group.plans.length} {t('plans.plans')})</span>
                </div>
                <div className="space-y-1">
                  {group.plans.map((plan, i) => renderPlanRow(plan, i, false))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-medium text-ink-secondary">
            <Download size={14} className="text-gold" />
            {t('plans.best20')}
          </div>
          <button
            type="button"
            onClick={loadDbPlans}
            disabled={loadingDb}
            className="text-ink-muted transition-colors hover:text-ink-primary"
          >
            <RefreshCw size={14} className={loadingDb ? 'animate-spin' : ''} />
          </button>
        </div>

        {!isPremium ? (
          <div className="rounded-xl border border-base-500/50 bg-base-800/60 p-4">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-ink-primary">
              <Lock size={14} className="text-gold" />
              {t('plans.locked')}
            </div>
            <p className="mb-3 text-xs text-ink-secondary">{t('plans.lockedDesc')}</p>
            <form onSubmit={handlePremiumCheck} className="space-y-2">
              <input
                type="email"
                value={premiumEmail}
                onChange={(e) => setPremiumEmail(e.target.value)}
                placeholder={t('plans.emailPlaceholder')}
                className="input-field text-sm"
              />
              <button
                type="submit"
                disabled={premiumChecking}
                className="w-full rounded-xl bg-gold py-2 text-sm font-bold text-base-900 transition-colors hover:bg-gold-light disabled:opacity-50"
              >
                {premiumChecking ? t('plans.checking') : t('plans.checkPremium')}
              </button>
            </form>
            {premiumError && <p className="mt-2 text-xs text-loss-light">{premiumError}</p>}
            <p className="mt-3 text-center text-[10px] text-ink-muted">{t('plans.subscribeNote')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dbGroups.length === 0 ? (
              <p className="rounded-xl border border-dashed border-base-500 py-4 text-center text-xs text-ink-muted">
                {t('admin.noPlans')}
              </p>
            ) : (
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {dbGroups.map((group) => (
                  <div key={`${group.winRate}-${group.tradeCount}`}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
                        {group.winRate}% · {group.tradeCount} {t('plans.trades')}
                      </span>
                      <span className="text-xs text-ink-muted">({group.plans.length} {t('plans.plans')})</span>
                    </div>
                    <div className="space-y-1">
                      {group.plans.map((plan, i) => renderPlanRow(plan, i, true))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
