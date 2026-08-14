import type { RiskSystem } from './rmTypes';

export function createDefaultSystem(name: string, baseRisk: number): RiskSystem {
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    baseRiskPct: baseRisk,
    calcMethod: 'currentBalance',
    minRiskPct: 0.25,
    maxRiskPct: 3,
    beTreatment: 'neutral',
    rules: [],
    costs: { commission: 0, spread: 0, slippage: 0, fixedCost: 0 },
  };
}

export const PRESET_SYSTEMS: { label: string; description: string; detailedInfo: string; build: () => RiskSystem }[] = [
  {
    label: 'مخاطرة ثابتة 1%',
    description: '1% في كل صفقة',
    detailedInfo: 'نظام بسيط ومحافظ: يخاطر بنسبة 1% من رصيدك الحالي في كل صفقة دون أي تغيير. مناسب للمتداولين المبتدئين أو من يفضل نمواً بطيئاً ومستقراً مع تراجع محدود. المخاطرة تتغير تلقائياً مع الرصيد (إذا ربحت يزيد مبلغ المخاطرة، إذا خسرت يقل).',
    build: () => createDefaultSystem('مخاطرة ثابتة 1%', 1),
  },
  {
    label: 'مخاطرة ثابتة 2%',
    description: '2% في كل صفقة',
    detailedInfo: 'نظام ثابت أعلى مخاطرة: يخاطر بنسبة 2% من رصيدك الحالي في كل صفقة. نمو أسرع من نظام 1% لكن مع تراجع أكبر. مناسب للمتداولين ذوي الخبرة الذين يتحملون مخاطرة أعلى. الحد الأقصى للتراجع قد يكون ضعف نظام 1% تقريباً.',
    build: () => createDefaultSystem('مخاطرة ثابتة 2%', 2),
  },
  {
    label: 'زيادة بعد الربح',
    description: '1% ابتدائي → 2% بعد الربح → 1% بعد الخسارة',
    detailedInfo: 'نظام هجومي بعد الربح: يبدأ بمخاطرة 1%، وبعد كل صفقة رابحة يرفع المخاطرة إلى 2% للصفقة التالية. إذا خسرت الصفقة التالية، يعود إلى 1%. الفكرة: استغلال سلسلة الأرباح بمخاطرة أعلى، والعودة للحذر عند الخسارة. مناسب للأنماط التي تظهر فيها سلاسل أرباح متتالية.',
    build: () => ({
      ...createDefaultSystem('زيادة بعد الربح', 1),
      rules: [
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'prevTradeWin', operator: '==', value: 1 }],
          action: { type: 'setRisk', value: 2 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'prevTradeLoss', operator: '==', value: 1 }],
          action: { type: 'setRisk', value: 1 },
        },
      ],
    }),
  },
  {
    label: 'تخفيض بعد الخسارة',
    description: '2% ابتدائي → 1% بعد الخسارة → 2% بعد الربح',
    detailedInfo: 'نظام دفاعي بعد الخسارة: يبدأ بمخاطرة 2%، وبعد كل صفقة خاسرة يخفض المخاطرة إلى 1% للصفقة التالية. إذا ربحت الصفقة التالية، يعود إلى 2%. الفكرة: تقليل الخسائر بعد الخسارة وحماية رأس المال، ثم العودة للمخاطرة الطبيعية عند التعافي. مناسب لتقليل تأثير سلاسل الخسائر.',
    build: () => ({
      ...createDefaultSystem('تخفيض بعد الخسارة', 2),
      rules: [
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'prevTradeLoss', operator: '==', value: 1 }],
          action: { type: 'setRisk', value: 1 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'prevTradeWin', operator: '==', value: 1 }],
          action: { type: 'setRisk', value: 2 },
        },
      ],
    }),
  },
  {
    label: 'نظام الأرباح المتتالية',
    description: '1% → 1.5% بعد ربح → 2% بعد ربحين → 2.5% بعد 3 أرباح',
    detailedInfo: 'نظام تصاعدي مع الأرباح المتتالية: يبدأ بمخاطرة 1%، ويرفعها تدريجياً مع كل ربح متتالي: 1.5% بعد ربح واحد، 2% بعد ربحين، 2.5% بعد 3 أرباح. عند أي خسارة، يعود فوراً إلى 1%. الفكرة: تكبير الأرباح أثناء سلاسل الفوز، والحذر عند انقطاع السلسلة. الحد الأقصى للمخاطرة 2.5%.',
    build: () => ({
      ...createDefaultSystem('الأرباح المتتالية', 1),
      maxRiskPct: 2.5,
      rules: [
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'consecutiveWins', operator: '>=', value: 1 }],
          action: { type: 'setRisk', value: 1.5 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'consecutiveWins', operator: '>=', value: 2 }],
          action: { type: 'setRisk', value: 2 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'consecutiveWins', operator: '>=', value: 3 }],
          action: { type: 'setRisk', value: 2.5 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'prevTradeLoss', operator: '==', value: 1 }],
          action: { type: 'resetRisk', value: 0 },
        },
      ],
    }),
  },
  {
    label: 'نظام الخسائر المتتالية',
    description: '2% → 1.5% بعد خسارة → 1% بعد خسارتين → 0.5% بعد 3 خسائر',
    detailedInfo: 'نظام تنازلي مع الخسائر المتتالية: يبدأ بمخاطرة 2%، ويخفضها تدريجياً مع كل خسارة متتالية: 1.5% بعد خسارة واحدة، 1% بعد خسارتين، 0.5% بعد 3 خسائر. عند أي ربح، يعود فوراً إلى 2%. الفكرة: حماية رأس المال أثناء سلاسل الخسائر بتقليل المخاطرة، ثم العودة للمخاطرة الطبيعية عند التعافي. الحد الأدنى للمخاطرة 0.25%.',
    build: () => ({
      ...createDefaultSystem('الخسائر المتتالية', 2),
      minRiskPct: 0.25,
      rules: [
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'consecutiveLosses', operator: '>=', value: 1 }],
          action: { type: 'setRisk', value: 1.5 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'consecutiveLosses', operator: '>=', value: 2 }],
          action: { type: 'setRisk', value: 1 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'consecutiveLosses', operator: '>=', value: 3 }],
          action: { type: 'setRisk', value: 0.5 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'prevTradeWin', operator: '==', value: 1 }],
          action: { type: 'resetRisk', value: 0 },
        },
      ],
    }),
  },
  {
    label: 'حماية من التراجع',
    description: '2% عادي → 1% عند DD 5% → 0.5% عند DD 8%',
    detailedInfo: 'نظام حماية من التراجع: يخاطر بنسبة 2% في الظروف العادية، لكن عندما يصل التراجع (Drawdown) من أعلى رصيد سابق إلى 5%، يخفض المخاطرة إلى 1%. وإذا وصل التراجع إلى 8%، يخفضها إلى 0.5%. الفكرة: الحفاظ على رأس المال عند تراجع الحساب، وتقليل المخاطرة كلما زاد التراجع. مناسب للحسابات التي تريد حماية قوية من الخسائر الكبيرة.',
    build: () => ({
      ...createDefaultSystem('حماية من التراجع', 2),
      rules: [
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'drawdownPct', operator: '>=', value: 5 }],
          action: { type: 'setRisk', value: 1 },
        },
        {
          id: crypto.randomUUID(),
          enabled: true,
          conditions: [{ type: 'drawdownPct', operator: '>=', value: 8 }],
          action: { type: 'setRisk', value: 0.5 },
        },
      ],
    }),
  },
];
