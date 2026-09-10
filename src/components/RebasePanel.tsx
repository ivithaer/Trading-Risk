import { useState } from 'react';
import { Plus, Minus, TrendingUp, TrendingDown, GitBranch } from 'lucide-react';
import type { RebaseSettings } from '@/types';
import { useI18n } from '@/lib/i18n';
import DecimalInput from '@/components/DecimalInput';

interface Props {
  settings: RebaseSettings;
  onChange: (settings: RebaseSettings) => void;
}

const MAX_MILESTONES = 10;

export default function RebasePanel({ settings, onChange }: Props) {
  const { t } = useI18n();
  const [upwardInput, setUpwardInput] = useState(0);
  const [downwardInput, setDownwardInput] = useState(0);

  const update = (patch: Partial<RebaseSettings>) => onChange({ ...settings, ...patch });

  const addUpward = () => {
    if (upwardInput <= 0 || settings.upwardMilestones.length >= MAX_MILESTONES) return;
    update({ upwardMilestones: [...settings.upwardMilestones, upwardInput] });
    setUpwardInput(0);
  };

  const removeUpward = (index: number) => {
    update({ upwardMilestones: settings.upwardMilestones.filter((_, i) => i !== index) });
  };

  const addDownward = () => {
    if (downwardInput <= 0 || settings.downwardMilestones.length >= MAX_MILESTONES) return;
    update({ downwardMilestones: [...settings.downwardMilestones, downwardInput] });
    setDownwardInput(0);
  };

  const removeDownward = (index: number) => {
    update({ downwardMilestones: settings.downwardMilestones.filter((_, i) => i !== index) });
  };

  const sortedUpward = [...settings.upwardMilestones].sort((a, b) => a - b);
  const sortedDownward = [...settings.downwardMilestones].sort((a, b) => b - a);

  return (
    <div className="neu-card-inset p-4 space-y-3" style={{ borderRadius: '0.75rem' }}>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          onClick={() => update({ enabled: !settings.enabled })}
          className={`flex h-5 w-5 shrink-0 items-center justify-center transition-all ${
            settings.enabled ? 'neu-pressed' : 'neu-btn'
          }`}
          style={{ borderRadius: '0.375rem' }}
        >
          {settings.enabled && <span className="text-xs neu-text-gold font-bold">&#10003;</span>}
        </div>
        <span className="text-sm font-medium neu-text-primary">{t('rebase.enable')}</span>
      </label>

      {settings.enabled && (
        <>
          <div className="flex items-start gap-2 text-xs neu-text-muted">
            <GitBranch size={13} className="mt-0.5 shrink-0 neu-text-gold" />
            <span>{t('rebase.description')}</span>
          </div>

          {/* Upward Milestones */}
          <div className="neu-card-inset p-3 space-y-2.5" style={{ borderRadius: '0.75rem' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="neu-text-profit" />
                <span className="text-sm font-semibold neu-text-primary">{t('rebase.upward')}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs neu-text-secondary">{t('rebase.upwardEnable')}</span>
                <div
                  onClick={() => update({ upwardEnabled: !settings.upwardEnabled })}
                  className={`flex h-5 w-9 shrink-0 items-center px-0.5 transition-all ${
                    settings.upwardEnabled ? 'neu-pressed' : 'neu-btn'
                  }`}
                  style={{ borderRadius: '0.625rem' }}
                >
                  <div
                    className={`h-4 w-4 rounded-full transition-all ${
                      settings.upwardEnabled ? 'bg-[var(--neu-profit)] ml-auto' : 'bg-[var(--neu-muted)]'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <DecimalInput
                value={upwardInput}
                onChange={setUpwardInput}
                className="neu-input flex-1 px-3 py-1.5 font-mono"
                placeholder={t('rebase.milestoneValue')}
              />
              <button
                type="button"
                onClick={addUpward}
                disabled={settings.upwardMilestones.length >= MAX_MILESTONES}
                className="flex h-8 w-8 shrink-0 items-center justify-center neu-btn neu-text-secondary transition-colors hover:neu-text-profit disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderRadius: '0.5rem' }}
              >
                <Plus size={15} />
              </button>
            </div>

            {sortedUpward.length > 0 ? (
              <div className="space-y-1.5">
                {sortedUpward.map((val, i) => {
                  const originalIndex = settings.upwardMilestones.indexOf(val);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center neu-icon-box text-xs font-semibold neu-text-profit" style={{ borderRadius: '0.375rem' }}>
                        {i + 1}
                      </span>
                      <span className="flex-1 font-mono text-sm neu-text-primary">${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <button
                        type="button"
                        onClick={() => removeUpward(originalIndex)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center neu-btn neu-text-secondary transition-colors hover:neu-text-loss"
                        style={{ borderRadius: '0.375rem' }}
                      >
                        <Minus size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs neu-text-muted text-center py-1">{t('rebase.noMilestones')}</p>
            )}
          </div>

          {/* Downward Milestones */}
          <div className="neu-card-inset p-3 space-y-2.5" style={{ borderRadius: '0.75rem' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown size={15} className="neu-text-loss" />
                <span className="text-sm font-semibold neu-text-primary">{t('rebase.downward')}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs neu-text-secondary">{t('rebase.downwardEnable')}</span>
                <div
                  onClick={() => update({ downwardEnabled: !settings.downwardEnabled })}
                  className={`flex h-5 w-9 shrink-0 items-center px-0.5 transition-all ${
                    settings.downwardEnabled ? 'neu-pressed' : 'neu-btn'
                  }`}
                  style={{ borderRadius: '0.625rem' }}
                >
                  <div
                    className={`h-4 w-4 rounded-full transition-all ${
                      settings.downwardEnabled ? 'bg-[var(--neu-loss)] ml-auto' : 'bg-[var(--neu-muted)]'
                    }`}
                  />
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <DecimalInput
                value={downwardInput}
                onChange={setDownwardInput}
                className="neu-input flex-1 px-3 py-1.5 font-mono"
                placeholder={t('rebase.milestoneValue')}
              />
              <button
                type="button"
                onClick={addDownward}
                disabled={settings.downwardMilestones.length >= MAX_MILESTONES}
                className="flex h-8 w-8 shrink-0 items-center justify-center neu-btn neu-text-secondary transition-colors hover:neu-text-loss disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderRadius: '0.5rem' }}
              >
                <Plus size={15} />
              </button>
            </div>

            {sortedDownward.length > 0 ? (
              <div className="space-y-1.5">
                {sortedDownward.map((val, i) => {
                  const originalIndex = settings.downwardMilestones.indexOf(val);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center neu-icon-box text-xs font-semibold neu-text-loss" style={{ borderRadius: '0.375rem' }}>
                        {i + 1}
                      </span>
                      <span className="flex-1 font-mono text-sm neu-text-primary">${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <button
                        type="button"
                        onClick={() => removeDownward(originalIndex)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center neu-btn neu-text-secondary transition-colors hover:neu-text-loss"
                        style={{ borderRadius: '0.375rem' }}
                      >
                        <Minus size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs neu-text-muted text-center py-1">{t('rebase.noMilestones')}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
