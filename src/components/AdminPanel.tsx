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
      <div className="neu-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="neu-text-gold" />
          <h2 className="text-base font-semibold neu-text-primary">{t('admin.title')}</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <p className="text-xs neu-text-secondary">{t('admin.desc')}</p>
          <div>
            <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('admin.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neu-input w-full px-4 py-2.5 pl-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 neu-text-muted hover:neu-text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs neu-text-loss">{error}</p>}
          <button
            type="submit"
            disabled={authenticating}
            className="neu-btn w-full py-2.5 text-sm font-bold neu-text-gold transition-colors disabled:opacity-50"
          >
            {authenticating ? t('admin.checking') : t('admin.login')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} className="neu-text-gold" />
          <h2 className="text-base font-semibold neu-text-primary">{t('admin.title')}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={loadPlans}
            disabled={loading}
            className="flex items-center gap-1 neu-btn px-2 py-1 text-xs neu-text-secondary transition-colors hover:neu-text-primary"
            style={{ borderRadius: '0.5rem' }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={downloadAllCsv}
            disabled={plans.length === 0}
            className="flex items-center gap-1 neu-btn px-2 py-1 text-xs neu-text-secondary transition-colors hover:neu-text-gold disabled:opacity-50"
            style={{ borderRadius: '0.5rem' }}
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
            className="flex items-center gap-1 neu-btn px-2 py-1 text-xs neu-text-secondary transition-colors hover:neu-text-loss"
            style={{ borderRadius: '0.5rem' }}
          >
            <Lock size={12} />
          </button>
        </div>
      </div>

      <div className="mb-3 text-sm neu-text-secondary">{t('admin.best20')}</div>

      {grouped.length === 0 ? (
        <p className="neu-card-inset py-4 text-center text-xs neu-text-muted" style={{ borderRadius: '0.75rem' }}>
          {t('admin.noPlans')}
        </p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {grouped.map((group) => (
            <div key={`${group.winRate}-${group.tradeCount}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="neu-pill px-2 py-0.5 text-xs font-bold neu-text-gold">
                  {group.winRate}% · {group.tradeCount} {t('plans.trades')}
                </span>
                <span className="text-xs neu-text-muted">({group.plans.length} {t('plans.plans')})</span>
              </div>
              <div className="space-y-1">
                {group.plans.map((plan, i) => (
                  <div
                    key={plan.id}
                    className="flex items-center gap-2 neu-card-inset p-2"
                    style={{ borderRadius: '0.75rem' }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center neu-pill text-[10px] font-bold neu-text-secondary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium neu-text-primary">
                        {plan.nickname ?? t('common.untitled')}
                      </div>
                      <div className="text-[10px] neu-text-muted">
                        {formatCurrency(plan.final_balance)} · {formatNumber(plan.stats.netPnlPercent, 1)}% · DD: {formatNumber(plan.stats.maxDrawdownPercent, 1)}% · {formatNumber(plan.score, 1)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadPlanCsv(plan, `admin_${plan.nickname ?? plan.id}.csv`)}
                      className="shrink-0 neu-text-muted transition-colors hover:neu-text-gold"
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
