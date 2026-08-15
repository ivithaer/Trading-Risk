import { Plus, Minus, Settings2, Info, ChevronDown } from 'lucide-react';
import type { Settings, RiskMode, RiskType } from '@/types';
import { WIN_RATES, TRADE_COUNTS } from '@/types';
import { useI18n } from '@/lib/i18n';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-all duration-200 neu-btn ${
            value === opt.value ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'
          }`}
          style={{ borderRadius: '0.75rem' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RiskLevelEditor({
  levels,
  onChange,
}: {
  levels: number[];
  onChange: (levels: number[]) => void;
}) {
  const { t } = useI18n();
  const update = (index: number, value: number) => {
    const next = [...levels];
    next[index] = isNaN(value) ? 0 : value;
    onChange(next);
  };

  const add = () => {
    if (levels.length >= 10) return;
    onChange([...levels, 10]);
  };
  const remove = (index: number) => {
    if (levels.length <= 2) return;
    onChange(levels.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs neu-text-secondary">
        <Info size={13} className="neu-text-gold" />
        <span>{t('settings.levelInfo')}</span>
      </div>
      <div className="space-y-2">
        {levels.map((level, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center neu-icon-box text-xs font-semibold neu-text-secondary" style={{ borderRadius: '0.5rem' }}>
              {i + 1}
            </span>
            <div className="relative flex-1">
              <input
                type="number"
                value={level}
                onChange={(e) => update(i, parseFloat(e.target.value))}
                className="neu-input w-full px-3 py-1.5 pl-10 text-left font-mono"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm neu-text-muted">
                $ / %
              </span>
            </div>
            {levels.length > 2 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center neu-btn neu-text-secondary transition-colors hover:neu-text-loss"
                style={{ borderRadius: '0.5rem' }}
              >
                <Minus size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={levels.length >= 10}
        className="flex w-full items-center justify-center gap-1.5 neu-btn py-2 text-sm neu-text-secondary transition-colors hover:neu-text-gold disabled:cursor-not-allowed disabled:opacity-40"
        style={{ borderRadius: '0.75rem' }}
      >
        <Plus size={15} /> {levels.length >= 10 ? t('settings.maxLevels') : t('settings.addLevel')}
      </button>
    </div>
  );
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const { t } = useI18n();
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('settings.title')}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('settings.startingBalance')}</label>
          <input
            type="number"
            value={settings.startingBalance}
            onChange={(e) => update({ startingBalance: parseFloat(e.target.value) || 0 })}
            className="neu-input w-full px-4 py-2.5 font-mono"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('settings.winRate')}</label>
          <div className="relative">
            <select
              value={settings.winRate}
              onChange={(e) => update({ winRate: parseFloat(e.target.value) })}
              className="neu-input w-full appearance-none px-4 py-2.5 pl-9 font-mono"
            >
              {WIN_RATES.map((wr) => (
                <option key={wr} value={wr}>{wr}%</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 neu-text-muted" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('settings.rrr')}</label>
          <div className="relative">
            <input
              type="number"
              value={settings.rrr}
              onChange={(e) => update({ rrr: parseFloat(e.target.value) || 0 })}
              className="neu-input w-full px-4 py-2.5 pl-16 font-mono"
              step={0.1}
              min={0}
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm neu-text-muted">: 1</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('settings.maxTrades')}</label>
          <div className="relative">
            <select
              value={settings.maxTrades}
              onChange={(e) => update({ maxTrades: parseInt(e.target.value, 10) })}
              className="neu-input w-full appearance-none px-4 py-2.5 pl-9 font-mono"
            >
              {TRADE_COUNTS.map((tc) => (
                <option key={tc} value={tc}>{tc} {t('settings.trades')}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 neu-text-muted" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('settings.riskMode')}</label>
          <ToggleGroup<RiskMode>
            options={[
              { value: 'variable', label: t('settings.variable') },
              { value: 'fixed', label: t('settings.fixed') },
            ]}
            value={settings.riskMode}
            onChange={(v) => update({ riskMode: v })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('settings.riskType')}</label>
          <ToggleGroup<RiskType>
            options={[
              { value: 'dollar', label: t('settings.dollar') },
              { value: 'percentage', label: t('settings.percentage') },
            ]}
            value={settings.riskType}
            onChange={(v) => update({ riskType: v })}
          />
        </div>

        {settings.riskMode === 'variable' ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('settings.riskLevels')}</label>
            <RiskLevelEditor
              levels={settings.riskLevels}
              onChange={(levels) => update({ riskLevels: levels })}
            />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium neu-text-secondary">
              {t('settings.fixedRisk')} {settings.riskType === 'percentage' ? '(%)' : '($)'}
            </label>
            <input
              type="number"
              value={settings.fixedRisk}
              onChange={(e) => update({ fixedRisk: parseFloat(e.target.value) || 0 })}
              className="neu-input w-full px-4 py-2.5 font-mono"
              min={0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
