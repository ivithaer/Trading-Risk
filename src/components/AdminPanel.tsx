import { useEffect, useState } from 'react';
import { Shield, Download, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';
import { fetchTopPlansGlobal, type SavedPlan } from '@/lib/supabaseClient';
import { formatCurrency, formatNumber, downloadPlanCsv } from '@/lib/riskEngine';
import { WIN_RATES, TRADE_COUNTS } from '@/types';
import { useI18n } from '@/lib/i18n';

const ADMIN_AUTH_KEY = 'risk_sim_admin_authed';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function AdminPanel() {
  const { t } = useI18n();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') setAuthed(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authorized) {
          setAuthed(true);
          sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
        } else {
          setError(t('admin.wrongPassword'));
        }
      } else {
        setError(t('admin.wrongPassword'));
      }
    } catch {
      setError(t('admin.wrongPassword'));
    } finally {
      setAuthenticating(false);
    }
  };

  const loadPlans = async () => {
    setLoading(true);
    const data = await fetchTopPlansGlobal(20);
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => {
    if (authed) loadPlans();
  }, [authed]);

  const downloadAllCsv = () => {
    const headers = [
      'Name', 'Win Rate', 'Trades', 'RRR', 'Risk Mode', 'Risk',
      'Final Balance', 'Net PnL', 'PnL %',
      'Max DD', 'DD %', 'Actual WR', 'PF',
      'Avg/Trade', 'Score', 'Date',
    ];
    const rows = plans.map((p) => [
      p.nickname ?? '',
      `${p.settings.winRate}%`,
      `${p.trade_count}`,
      `${p.settings.rrr}`,
      p.settings.riskMode === 'fixed' ? 'Fixed' : 'Variable',
      p.settings.riskMode === 'fixed' ? `${p.settings.fixedRisk}` : `[${p.settings.riskLevels.join(';')}]`,
      `$${p.final_balance.toFixed(2)}`,
      `$${p.stats.netPnl.toFixed(2)}`,
      `${p.stats.netPnlPercent.toFixed(2)}%`,
      `$${p.stats.maxDrawdown.toFixed(2)}`,
      `${p.stats.maxDrawdownPercent.toFixed(2)}%`,
      `${p.stats.actualWinRate.toFixed(1)}%`,
      p.stats.profitFactor === Infinity ? '∞' : p.stats.profitFactor.toFixed(2),
      `$${p.stats.expectancy.toFixed(2)}`,
      p.score.toFixed(2),
      new Date(p.created_at).toLocaleString('en'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin_best_plans_all.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const grouped = WIN_RATES.flatMap((wr) =>
    TRADE_COUNTS.map((tc) => ({
      winRate: wr,
      tradeCount: tc,
      plans: plans
        .filter((p) => p.win_rate === wr && p.trade_count === tc)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20),
    })),
  ).filter((g) => g.plans.length > 0);

  if (!authed) {
    return (
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-gold" />
          <h2 className="text-base font-semibold text-ink-primary">{t('admin.title')}</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <p className="text-xs text-ink-secondary">{t('admin.desc')}</p>
          <div>
            <label className="label-text">{t('admin.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-loss-light">{error}</p>}
          <button
            type="submit"
            disabled={authenticating}
            className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-base-900 transition-colors hover:bg-gold-light disabled:opacity-50"
          >
            {authenticating ? t('admin.checking') : t('admin.login')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-gold" />
          <h2 className="text-base font-semibold text-ink-primary">{t('admin.title')}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={loadPlans}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg border border-base-500 px-2 py-1 text-xs text-ink-secondary transition-colors hover:text-ink-primary"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={downloadAllCsv}
            disabled={plans.length === 0}
            className="flex items-center gap-1 rounded-lg border border-base-500 px-2 py-1 text-xs text-ink-secondary transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-50"
          >
            <Download size={12} />
            {t('admin.downloadAll')}
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(ADMIN_AUTH_KEY);
              setAuthed(false);
            }}
            className="flex items-center gap-1 rounded-lg border border-base-500 px-2 py-1 text-xs text-ink-secondary transition-colors hover:text-loss"
          >
            <Lock size={12} />
          </button>
        </div>
      </div>

      <div className="mb-3 text-sm text-ink-secondary">{t('admin.best20')}</div>

      {grouped.length === 0 ? (
        <p className="rounded-xl border border-dashed border-base-500 py-4 text-center text-xs text-ink-muted">
          {t('admin.noPlans')}
        </p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {grouped.map((group) => (
            <div key={`${group.winRate}-${group.tradeCount}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
                  {group.winRate}% · {group.tradeCount} {t('plans.trades')}
                </span>
                <span className="text-xs text-ink-muted">({group.plans.length} {t('plans.plans')})</span>
              </div>
              <div className="space-y-1">
                {group.plans.map((plan, i) => (
                  <div
                    key={plan.id}
                    className="flex items-center gap-2 rounded-lg border border-base-500/40 bg-base-800/40 p-2"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-base-600 text-[10px] font-bold text-ink-secondary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-ink-primary">
                        {plan.nickname ?? t('common.untitled')}
                      </div>
                      <div className="text-[10px] text-ink-muted">
                        {formatCurrency(plan.final_balance)} · {formatNumber(plan.stats.netPnlPercent, 1)}% · DD: {formatNumber(plan.stats.maxDrawdownPercent, 1)}% · {formatNumber(plan.score, 1)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadPlanCsv(plan, `admin_${plan.nickname ?? plan.id}.csv`)}
                      className="shrink-0 text-ink-muted transition-colors hover:text-gold"
                      title={t('admin.downloadPlan')}
                    >
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
