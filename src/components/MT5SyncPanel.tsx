import { useState, useEffect, useCallback, useRef } from 'react';
import { Link2, Plus, Trash2, Loader2, Shield, AlertTriangle, RefreshCw, Wallet, TrendingUp, DollarSign, Activity, X } from 'lucide-react';
import { supabase, type SavedPlan } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface MT5Account {
  id: string;
  risk_plan_id: string;
  metaapi_account_id: string;
  mt5_login: string;
  mt5_server: string;
  account_name: string | null;
  created_at: string;
}

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  openPositions: number;
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MT5SyncPanel() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ planId: '', login: '', password: '', server: '', name: '' });
  const [infoMap, setInfoMap] = useState<Record<string, AccountInfo | null>>({});
  const [infoLoading, setInfoLoading] = useState<Set<string>>(new Set());
  const [infoError, setInfoError] = useState<Record<string, string>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('mt5_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setAccounts((data ?? []) as MT5Account[]);
  }, [user]);

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase.from('risk_plans').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setPlans(data as unknown as SavedPlan[]);
  }, []);

  useEffect(() => {
    if (user) { fetchAccounts(); fetchPlans(); }
  }, [user, fetchAccounts, fetchPlans]);

  const fetchAccountInfo = useCallback(async (accountId: string) => {
    setInfoLoading((prev) => new Set(prev).add(accountId));
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mt5-account-info`;
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionData.session?.access_token) headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      const res = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify({ accountId }) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setInfoMap((prev) => ({ ...prev, [accountId]: data }));
      setInfoError((prev) => { const n = { ...prev }; delete n[accountId]; return n; });
    } catch (e) {
      setInfoError((prev) => ({ ...prev, [accountId]: (e as Error).message }));
    } finally {
      setInfoLoading((prev) => { const n = new Set(prev); n.delete(accountId); return n; });
    }
  }, []);

  useEffect(() => {
    if (accounts.length === 0) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    accounts.forEach((a) => fetchAccountInfo(a.metaapi_account_id));
    intervalRef.current = setInterval(() => { accounts.forEach((a) => fetchAccountInfo(a.metaapi_account_id)); }, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [accounts, fetchAccountInfo]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.planId || !form.login || !form.password || !form.server) { setError(t('mt5.fillAllFields')); return; }
    setConnecting(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mt5-connect`;
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionData.session?.access_token) headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      const res = await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify({ login: form.login, password: form.password, server: form.server, name: form.name || undefined, riskPlanId: form.planId }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setForm({ planId: '', login: '', password: '', server: '', name: '' });
      setShowForm(false);
      await fetchAccounts();
    } catch (e) { setError((e as Error).message); }
    finally { setConnecting(false); }
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('mt5_accounts').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  if (!user) {
    return (
      <div className="neu-card flex flex-col items-center justify-center p-8 text-center">
        <Shield size={32} className="mb-2 neu-text-muted" />
        <p className="text-sm neu-text-secondary">{t('mt5.signInRequired')}</p>
      </div>
    );
  }

  const planName = (planId: string) => plans.find((p) => p.id === planId)?.nickname || t('common.untitled');

  return (
    <div className="space-y-5">
      <div className="neu-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="neu-text-gold" />
            <h2 className="text-base font-semibold neu-text-primary">{t('mt5.title')}</h2>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 neu-btn neu-bg-gold-soft px-3 py-2 text-sm font-bold neu-text-gold transition-colors" style={{ borderRadius: '0.75rem' }}>
              <Plus size={16} />{t('mt5.connectNew')}
            </button>
          )}
        </div>
        <p className="mt-2 text-sm neu-text-secondary">{t('mt5.subtitle')}</p>
      </div>

      {showForm && (
        <div className="neu-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold neu-text-primary">{t('mt5.connectNew')}</h3>
            <button onClick={() => setShowForm(false)} className="neu-text-muted hover:neu-text-primary"><X size={18} /></button>
          </div>
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('mt5.selectPlan')}</label>
              <select value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))} required className="neu-input w-full px-4 py-2.5">
                <option value="">{t('mt5.choosePlan')}</option>
                {plans.map((p) => (<option key={p.id} value={p.id}>{p.nickname || t('common.untitled')}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('mt5.login')}</label>
                <input type="text" inputMode="numeric" value={form.login} onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))} placeholder="12345678" required className="neu-input w-full px-4 py-2.5 font-mono" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('mt5.server')}</label>
                <input type="text" value={form.server} onChange={(e) => setForm((f) => ({ ...f, server: e.target.value }))} placeholder="Exness-MT5Real" required className="neu-input w-full px-4 py-2.5" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('mt5.investorPassword')}</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" required className="neu-input w-full px-4 py-2.5" />
              <div className="mt-1.5 flex items-start gap-1.5 neu-card-inset neu-bg-loss-soft px-3 py-2" style={{ borderRadius: '0.75rem' }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0 neu-text-loss" />
                <p className="text-xs neu-text-loss">{t('mt5.passwordWarning')}</p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('mt5.accountName')}</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('mt5.accountNamePlaceholder')} className="neu-input w-full px-4 py-2.5" />
            </div>
            {error && (<div className="neu-card-inset neu-bg-loss-soft px-3 py-2 text-sm neu-text-loss" style={{ borderRadius: '0.75rem' }}>{error}</div>)}
            <button type="submit" disabled={connecting} className="flex w-full items-center justify-center gap-1.5 neu-btn px-4 py-2.5 text-sm font-bold neu-text-gold transition-colors disabled:opacity-50" style={{ borderRadius: '0.75rem' }}>
              {connecting ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              {connecting ? t('mt5.connecting') : t('mt5.connect')}
            </button>
          </form>
        </div>
      )}

      {loading && (<div className="neu-card flex items-center justify-center p-8"><Loader2 size={24} className="animate-spin neu-text-gold" /></div>)}

      {!loading && accounts.length === 0 && !showForm && (
        <div className="neu-card flex flex-col items-center justify-center p-8 text-center">
          <Link2 size={32} className="mb-2 neu-text-muted" />
          <p className="text-sm neu-text-secondary">{t('mt5.noAccounts')}</p>
        </div>
      )}

      {!loading && accounts.map((acc) => {
        const info = infoMap[acc.metaapi_account_id];
        const isLoading = infoLoading.has(acc.metaapi_account_id);
        const err = infoError[acc.metaapi_account_id];
        return (
          <div key={acc.id} className="neu-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs neu-text-muted">{t('mt5.linkedPlan')}</p>
                <p className="text-sm font-bold neu-text-gold">{planName(acc.risk_plan_id)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => fetchAccountInfo(acc.metaapi_account_id)} className="neu-text-muted hover:neu-text-primary" title={t('mt5.refresh')}>
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => handleDelete(acc.id)} className="neu-text-muted hover:neu-text-loss"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-3 text-xs neu-text-muted">
              <span>{t('mt5.login')}: <span className="font-mono neu-text-secondary">{acc.mt5_login}</span></span>
              <span>{t('mt5.server')}: <span className="neu-text-secondary">{acc.mt5_server}</span></span>
              {acc.account_name && <span>{t('mt5.accountName')}: <span className="neu-text-secondary">{acc.account_name}</span></span>}
            </div>
            {isLoading && !info && (<div className="flex items-center justify-center py-6"><Loader2 size={20} className="animate-spin neu-text-gold" /></div>)}
            {err && !info && (<div className="neu-card-inset neu-bg-loss-soft px-3 py-2 text-sm neu-text-loss" style={{ borderRadius: '0.75rem' }}>{err}</div>)}
            {info && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
                  <div className="mb-1.5 flex items-center gap-1.5 neu-text-muted"><Wallet size={13} /><span className="text-xs">{t('mt5.balance')}</span></div>
                  <div className="font-mono text-lg font-semibold neu-text-primary">{fmtMoney(info.balance)}</div>
                </div>
                <div className="neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
                  <div className="mb-1.5 flex items-center gap-1.5 neu-text-muted"><TrendingUp size={13} /><span className="text-xs">{t('mt5.equity')}</span></div>
                  <div className="font-mono text-lg font-semibold neu-text-primary">{fmtMoney(info.equity)}</div>
                </div>
                <div className="neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
                  <div className="mb-1.5 flex items-center gap-1.5 neu-text-muted"><DollarSign size={13} /><span className="text-xs">{t('mt5.freeMargin')}</span></div>
                  <div className="font-mono text-lg font-semibold neu-text-primary">{fmtMoney(info.freeMargin)}</div>
                </div>
                <div className="neu-card-inset p-3" style={{ borderRadius: '1rem' }}>
                  <div className="mb-1.5 flex items-center gap-1.5 neu-text-muted"><Activity size={13} /><span className="text-xs">{t('mt5.openPositions')}</span></div>
                  <div className="font-mono text-lg font-semibold neu-text-primary">{info.openPositions}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
