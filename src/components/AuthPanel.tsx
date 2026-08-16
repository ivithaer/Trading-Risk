import { useState, useCallback } from 'react';
import { Lock, Mail, Loader2, LogIn, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function AuthPanel() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
  }, [mode, email, password, signIn, signUp]);

  if (loading) {
    return (
      <div className="neu-card flex items-center justify-center p-8">
        <Loader2 size={24} className="animate-spin neu-text-gold" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="neu-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <LogIn size={18} className="neu-text-gold" />
          <h2 className="text-base font-semibold neu-text-primary">{t('auth.signedIn')}</h2>
        </div>
        <p className="mb-4 text-sm neu-text-secondary">{user.email}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 neu-btn px-4 py-2 text-sm font-bold neu-text-loss transition-colors"
          style={{ borderRadius: '0.75rem' }}
        >
          <LogOut size={16} />
          {t('auth.signOut')}
        </button>
      </div>
    );
  }

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Lock size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('auth.title')}</h2>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('signin')}
          className={`neu-btn flex-1 px-3 py-2 text-sm font-medium transition-all ${mode === 'signin' ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'}`}
          style={{ borderRadius: '0.75rem' }}
        >
          {t('auth.signIn')}
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`neu-btn flex-1 px-3 py-2 text-sm font-medium transition-all ${mode === 'signup' ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'}`}
          style={{ borderRadius: '0.75rem' }}
        >
          {t('auth.signUp')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('auth.email')}</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute top-1/2 -translate-y-1/2 neu-text-muted" style={{ insetInlineStart: '0.75rem' }} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="neu-input w-full py-2.5 ps-10 pe-4"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('auth.password')}</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute top-1/2 -translate-y-1/2 neu-text-muted" style={{ insetInlineStart: '0.75rem' }} />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="neu-input w-full py-2.5 ps-10 pe-4"
            />
          </div>
        </div>

        {error && (
          <div className="neu-card-inset neu-bg-loss-soft px-3 py-2 text-sm neu-text-loss" style={{ borderRadius: '0.75rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-1.5 neu-btn px-4 py-2.5 text-sm font-bold neu-text-gold transition-colors disabled:opacity-50"
          style={{ borderRadius: '0.75rem' }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'signin' ? <LogIn size={16} /> : <UserPlus size={16} />}
          {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        </button>
      </form>
    </div>
  );
}
