import { useState } from 'react';
import { Plus, Trash2, Copy, Settings2, Zap, Info, X } from 'lucide-react';
import type { RiskSystem, RiskRule, RuleCondition, RuleConditionType, RuleActionType, RiskCalcMethod, Betreatment } from '@/lib/rmTypes';
import { PRESET_SYSTEMS, createDefaultSystem } from '@/lib/rmPresets';
import { useI18n } from '@/lib/i18n';
import DecimalInput from '@/components/DecimalInput';

interface Props {
  systems: RiskSystem[];
  onChange: (systems: RiskSystem[]) => void;
}

const CONDITION_LABELS: Record<RuleConditionType, string> = {
  prevTradeWin: 'rm.prevWin',
  prevTradeLoss: 'rm.prevLoss',
  consecutiveWins: 'rm.conWins',
  consecutiveLosses: 'rm.conLosses',
  drawdownPct: 'rm.ddPercent',
  profitPct: 'rm.profitPercent',
  lossPct: 'rm.lossPercent',
  currentBalance: 'rm.curBalance',
  prevRisk: 'rm.prevRiskPct',
  prevTradeR: 'rm.prevTradeR',
  tradesExecuted: 'rm.tradesExecuted',
};

const ACTION_LABELS: Record<RuleActionType, string> = {
  setRisk: 'rm.setRisk',
  increaseRiskPct: 'rm.increaseRiskPct',
  decreaseRiskPct: 'rm.decreaseRiskPct',
  increaseRiskPoints: 'rm.increaseRiskPoints',
  decreaseRiskPoints: 'rm.decreaseRiskPoints',
  resetRisk: 'rm.resetRisk',
  stopTrading: 'rm.stopTrading',
};

const COLORS = ['#F0B90B', '#16C784', '#EA3943', '#3B82F6', '#A855F7', '#F97316', '#06B6D4', '#EC4899'];

export default function RiskSystemBuilder({ systems, onChange }: Props) {
  const { t } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [infoPreset, setInfoPreset] = useState<string | null>(null);

  const addSystem = (preset?: () => RiskSystem) => {
    const sys = preset ? preset() : createDefaultSystem(`${t('rm.systemName')} ${systems.length + 1}`, 1);
    onChange([...systems, sys]);
    setExpandedId(sys.id);
  };

  const updateSystem = (id: string, patch: Partial<RiskSystem>) => {
    onChange(systems.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const deleteSystem = (id: string) => {
    onChange(systems.filter((s) => s.id !== id));
  };

  const copySystem = (id: string) => {
    const sys = systems.find((s) => s.id === id);
    if (!sys) return;
    const copy: RiskSystem = { ...sys, id: crypto.randomUUID(), name: `${sys.name} (${t('rm.copy')})`, rules: sys.rules.map((r) => ({ ...r, id: crypto.randomUUID() })) };
    onChange([...systems, copy]);
  };

  const addRule = (sysId: string) => {
    const sys = systems.find((s) => s.id === sysId);
    if (!sys) return;
    const rule: RiskRule = {
      id: crypto.randomUUID(),
      enabled: true,
      conditions: [{ type: 'consecutiveLosses', operator: '>=', value: 2 }],
      action: { type: 'setRisk', value: 1 },
    };
    updateSystem(sysId, { rules: [...sys.rules, rule] });
  };

  const updateRule = (sysId: string, ruleId: string, patch: Partial<RiskRule>) => {
    const sys = systems.find((s) => s.id === sysId);
    if (!sys) return;
    updateSystem(sysId, { rules: sys.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)) });
  };

  const deleteRule = (sysId: string, ruleId: string) => {
    const sys = systems.find((s) => s.id === sysId);
    if (!sys) return;
    updateSystem(sysId, { rules: sys.rules.filter((r) => r.id !== ruleId) });
  };

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('rm.riskSystems')}</h2>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm neu-text-secondary">{t('rm.presetSystems')}</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SYSTEMS.map((preset) => (
            <div key={preset.label} className="relative flex items-center">
              <button
                onClick={() => addSystem(preset.build)}
                className="flex items-center gap-1.5 neu-btn ps-3 pe-1.5 py-1.5 text-xs font-medium neu-text-secondary transition-colors hover:neu-text-primary"
                style={{ borderRadius: '0.75rem' }}
              >
                <Zap size={12} />
                {preset.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoPreset(infoPreset === preset.label ? null : preset.label);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      setInfoPreset(infoPreset === preset.label ? null : preset.label);
                    }
                  }}
                  className="ms-0.5 inline-flex h-4 w-4 items-center justify-center neu-pill neu-text-muted transition-colors hover:neu-text-gold"
                  title="معلومات النموذج"
                >
                  <Info size={10} />
                </span>
              </button>
              {infoPreset === preset.label && (
                <div className="absolute start-0 top-full z-20 mt-1 w-72 neu-card p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold neu-text-gold">{preset.label}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setInfoPreset(null); }}
                      className="neu-text-muted hover:neu-text-primary"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed neu-text-secondary">{preset.detailedInfo}</p>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => addSystem()}
            className="flex items-center gap-1.5 neu-btn neu-bg-gold-soft px-3 py-1.5 text-xs font-medium neu-text-gold transition-colors"
            style={{ borderRadius: '0.75rem' }}
          >
            <Plus size={12} />
            {t('rm.addSystem')}
          </button>
        </div>
      </div>

      {systems.length === 0 && (
        <p className="py-6 text-center text-sm neu-text-muted">{t('rm.noSystems')}</p>
      )}

      <div className="space-y-3">
        {systems.map((sys, sysIdx) => {
          const color = COLORS[sysIdx % COLORS.length];
          const isExpanded = expandedId === sys.id;
          return (
            <div key={sys.id} className="neu-card-inset" style={{ borderRadius: '0.75rem' }}>
              <div className="flex items-center gap-2 p-3">
                <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <input
                  type="text"
                  value={sys.name}
                  onChange={(e) => updateSystem(sys.id, { name: e.target.value })}
                  className="flex-1 rounded-lg bg-transparent px-2 py-1 text-sm font-medium neu-text-primary outline-none"
                />
                <button onClick={() => setExpandedId(isExpanded ? null : sys.id)} className="neu-text-muted hover:neu-text-primary">
                  <Settings2 size={14} />
                </button>
                <button onClick={() => copySystem(sys.id)} className="neu-text-muted hover:neu-text-gold">
                  <Copy size={14} />
                </button>
                <button onClick={() => deleteSystem(sys.id)} className="neu-text-muted hover:neu-text-loss">
                  <Trash2 size={14} />
                </button>
              </div>

              {!isExpanded && (
                <div className="px-3 pb-3 text-xs neu-text-muted">
                  {t('rm.baseRisk')}: {sys.baseRiskPct}% | {t('rm.rules')}: {sys.rules.length} | {t('rm.minRisk')}: {sys.minRiskPct}% | {t('rm.maxRisk')}: {sys.maxRiskPct}%
                </div>
              )}

              {isExpanded && (
                <div className="space-y-3 border-t p-3" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                  <input
                    type="text"
                    value={sys.description}
                    onChange={(e) => updateSystem(sys.id, { description: e.target.value })}
                    placeholder={t('rm.description')}
                    className="neu-input w-full px-4 py-2.5"
                  />

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.baseRisk')}</label>
                      <DecimalInput value={sys.baseRiskPct} onChange={(v) => updateSystem(sys.id, { baseRiskPct: v })} className="neu-input w-full px-4 py-2.5" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.minRisk')}</label>
                      <DecimalInput value={sys.minRiskPct} onChange={(v) => updateSystem(sys.id, { minRiskPct: v })} className="neu-input w-full px-4 py-2.5" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.maxRisk')}</label>
                      <DecimalInput value={sys.maxRiskPct} onChange={(v) => updateSystem(sys.id, { maxRiskPct: v })} className="neu-input w-full px-4 py-2.5" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.calcMethod')}</label>
                      <select value={sys.calcMethod} onChange={(e) => updateSystem(sys.id, { calcMethod: e.target.value as RiskCalcMethod })} className="neu-input w-full px-4 py-2.5">
                        <option value="currentBalance">{t('rm.currentBalance')}</option>
                        <option value="initialBalance">{t('rm.initialBal')}</option>
                        <option value="fixedAmount">{t('rm.fixedAmount')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.beTreatment')}</label>
                    <div className="flex gap-2">
                      {(['neutral', 'win', 'loss'] as Betreatment[]).map((be) => (
                        <button
                          key={be}
                          onClick={() => updateSystem(sys.id, { beTreatment: be })}
                          className={`neu-btn flex-1 px-3 py-2 text-sm font-medium transition-all ${sys.beTreatment === be ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'}`}
                          style={{ borderRadius: '0.75rem' }}
                        >
                          {t(`rm.${be === 'neutral' ? 'neutral' : be === 'win' ? 'asWin' : 'asLoss'}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-sm font-medium neu-text-secondary">{t('rm.costs')}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.commission')}</label>
                        <DecimalInput value={sys.costs.commission} onChange={(v) => updateSystem(sys.id, { costs: { ...sys.costs, commission: v } })} className="neu-input w-full px-4 py-2.5" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.spread')}</label>
                        <DecimalInput value={sys.costs.spread} onChange={(v) => updateSystem(sys.id, { costs: { ...sys.costs, spread: v } })} className="neu-input w-full px-4 py-2.5" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.slippage')}</label>
                        <DecimalInput value={sys.costs.slippage} onChange={(v) => updateSystem(sys.id, { costs: { ...sys.costs, slippage: v } })} className="neu-input w-full px-4 py-2.5" />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.fixedCost')}</label>
                        <DecimalInput value={sys.costs.fixedCost} onChange={(v) => updateSystem(sys.id, { costs: { ...sys.costs, fixedCost: v } })} className="neu-input w-full px-4 py-2.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium neu-text-secondary">{t('rm.rules')}</p>
                      <button onClick={() => addRule(sys.id)} className="flex items-center gap-1 neu-btn neu-bg-gold-soft px-2 py-1 text-xs font-medium neu-text-gold" style={{ borderRadius: '0.5rem' }}>
                        <Plus size={12} /> {t('rm.addRule')}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {sys.rules.map((rule) => (
                        <div key={rule.id} className="neu-card-inset p-2" style={{ borderRadius: '0.5rem' }}>
                          <div className="mb-2 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={(e) => updateRule(sys.id, rule.id, { enabled: e.target.checked })}
                              className="h-4 w-4"
                              style={{ accentColor: 'var(--neu-gold)' }}
                            />
                            <span className="text-xs neu-text-muted">{t('rm.enabled')}</span>
                            <button onClick={() => deleteRule(sys.id, rule.id)} className="ms-auto neu-text-muted hover:neu-text-loss">
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            <div className="space-y-1">
                              <span className="text-xs neu-text-muted">{t('rm.condition')}</span>
                              {rule.conditions.map((cond, ci) => (
                                <div key={ci} className="flex gap-1">
                                  <select
                                    value={cond.type}
                                    onChange={(e) => {
                                      const newConds = [...rule.conditions];
                                      newConds[ci] = { ...cond, type: e.target.value as RuleConditionType };
                                      updateRule(sys.id, rule.id, { conditions: newConds });
                                    }}
                                    className="neu-input flex-1 px-2 py-1 text-xs"
                                  >
                                    {(Object.keys(CONDITION_LABELS) as RuleConditionType[]).map((ct) => (
                                      <option key={ct} value={ct}>{t(CONDITION_LABELS[ct])}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={cond.operator}
                                    onChange={(e) => {
                                      const newConds = [...rule.conditions];
                                      newConds[ci] = { ...cond, operator: e.target.value as RuleCondition['operator'] };
                                      updateRule(sys.id, rule.id, { conditions: newConds });
                                    }}
                                    className="neu-input w-16 px-1 py-1 text-xs"
                                  >
                                    <option value=">=">&gt;=</option>
                                    <option value=">">&gt;</option>
                                    <option value="<=">&lt;=</option>
                                    <option value="<">&lt;</option>
                                    <option value="==">==</option>
                                    <option value="!=">!=</option>
                                  </select>
                                  <DecimalInput
                                    value={cond.value}
                                    onChange={(v) => {
                                      const newConds = [...rule.conditions];
                                      newConds[ci] = { ...cond, value: v };
                                      updateRule(sys.id, rule.id, { conditions: newConds });
                                    }}
                                    className="neu-input w-20 px-2 py-1 text-xs"
                                  />
                                  <button
                                    onClick={() => {
                                      const newConds = rule.conditions.filter((_, j) => j !== ci);
                                      updateRule(sys.id, rule.id, { conditions: newConds });
                                    }}
                                    className="neu-text-muted hover:neu-text-loss"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => updateRule(sys.id, rule.id, { conditions: [...rule.conditions, { type: 'consecutiveLosses', operator: '>=', value: 1 }] })}
                                className="text-xs neu-text-gold hover:opacity-80"
                              >
                                + {t('rm.condition')}
                              </button>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs neu-text-muted">{t('rm.action')}</span>
                              <div className="flex gap-1">
                                <select
                                  value={rule.action.type}
                                  onChange={(e) => updateRule(sys.id, rule.id, { action: { ...rule.action, type: e.target.value as RuleActionType } })}
                                  className="neu-input flex-1 px-2 py-1 text-xs"
                                >
                                  {(Object.keys(ACTION_LABELS) as RuleActionType[]).map((at) => (
                                    <option key={at} value={at}>{t(ACTION_LABELS[at])}</option>
                                  ))}
                                </select>
                                {rule.action.type !== 'resetRisk' && rule.action.type !== 'stopTrading' && (
                                  <DecimalInput
                                    value={rule.action.value}
                                    onChange={(v) => updateRule(sys.id, rule.id, { action: { ...rule.action, value: v } })}
                                    className="neu-input w-20 px-2 py-1 text-xs"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
