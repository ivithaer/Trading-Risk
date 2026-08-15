import { useState, useRef } from 'react';
import { Trash2, Upload, FileText, Zap, Table, TrendingUp, TrendingDown, Minus, SlidersHorizontal } from 'lucide-react';
import type { BacktestTrade, BacktestResult } from '@/lib/rmTypes';
import { parseCsv, quickEntryToTrades } from '@/lib/rmEngine';
import { useI18n } from '@/lib/i18n';

interface Props {
  trades: BacktestTrade[];
  onChange: (trades: BacktestTrade[]) => void;
}

type Tab = 'manual' | 'quick' | 'csv';

export default function BacktestInput({ trades, onChange }: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('manual');
  const [tpR, setTpR] = useState('2');
  const [slR, setSlR] = useState('-1');
  const [beR, setBeR] = useState('0');
  const [customR, setCustomR] = useState('');
  const [customResult, setCustomResult] = useState<BacktestResult>('custom');
  const [newDate, setNewDate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [quickSeq, setQuickSeq] = useState('');
  const [winR, setWinR] = useState('2');
  const [lossR, setLossR] = useState('-1');
  const [quickBeR, setQuickBeR] = useState('0');
  const [csvPreview, setCsvPreview] = useState<BacktestTrade[] | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addTradeByType = (result: BacktestResult, rStr: string) => {
    const r = parseFloat(rStr);
    if (isNaN(r)) return;
    const trade: BacktestTrade = {
      id: crypto.randomUUID(),
      index: trades.length + 1,
      date: newDate || undefined,
      result,
      r,
      note: newNote || undefined,
    };
    onChange([...trades, trade]);
    setNewDate('');
    setNewNote('');
  };

  const deleteTrade = (id: string) => {
    onChange(trades.filter((tr) => tr.id !== id).map((tr, i) => ({ ...tr, index: i + 1 })));
  };

  const clearAll = () => onChange([]);

  const handleQuickConvert = () => {
    const converted = quickEntryToTrades(quickSeq, parseFloat(winR) || 2, parseFloat(lossR) || -1, parseFloat(quickBeR) || 0);
    onChange([...trades, ...converted]);
    setQuickSeq('');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const { trades: parsed, errors } = parseCsv(text);
      setCsvPreview(parsed);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const confirmCsvImport = () => {
    if (csvPreview && csvErrors.length === 0) {
      onChange([...trades, ...csvPreview]);
      setCsvPreview(null);
      setCsvErrors([]);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const resultColor = (r: number) => (r > 0 ? 'neu-text-profit' : r < 0 ? 'neu-text-loss' : 'neu-text-muted');

  return (
    <div className="neu-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Table size={18} className="neu-text-gold" />
        <h2 className="text-base font-semibold neu-text-primary">{t('rm.backtestResults')}</h2>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab('manual')}
          className={`neu-btn flex-1 px-3 py-2 text-sm font-medium transition-all ${tab === 'manual' ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'}`}
          style={{ borderRadius: '0.75rem' }}
        >
          {t('rm.manualEntry')}
        </button>
        <button
          onClick={() => setTab('quick')}
          className={`neu-btn flex-1 px-3 py-2 text-sm font-medium transition-all ${tab === 'quick' ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'}`}
          style={{ borderRadius: '0.75rem' }}
        >
          {t('rm.quickEntry')}
        </button>
        <button
          onClick={() => setTab('csv')}
          className={`neu-btn flex-1 px-3 py-2 text-sm font-medium transition-all ${tab === 'csv' ? 'neu-pressed neu-text-gold' : 'neu-text-secondary'}`}
          style={{ borderRadius: '0.75rem' }}
        >
          {t('rm.csvImport')}
        </button>
      </div>

      {tab === 'manual' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="neu-input w-full px-4 py-2.5"
            />
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t('rm.notes')}
              className="neu-input w-full px-4 py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => addTradeByType('TP', tpR)}
                className="flex items-center justify-center gap-1.5 neu-btn neu-bg-profit-soft px-3 py-2.5 text-sm font-bold neu-text-profit transition-all active:scale-95"
                style={{ borderRadius: '0.75rem' }}
              >
                <TrendingUp size={16} />
                {t('rm.tp')}
              </button>
              <input
                type="number"
                step="0.01"
                value={tpR}
                onChange={(e) => setTpR(e.target.value)}
                placeholder="R"
                className="neu-input w-full px-3 py-2 text-center font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => addTradeByType('SL', slR)}
                className="flex items-center justify-center gap-1.5 neu-btn neu-bg-loss-soft px-3 py-2.5 text-sm font-bold neu-text-loss transition-all active:scale-95"
                style={{ borderRadius: '0.75rem' }}
              >
                <TrendingDown size={16} />
                {t('rm.sl')}
              </button>
              <input
                type="number"
                step="0.01"
                value={slR}
                onChange={(e) => setSlR(e.target.value)}
                placeholder="R"
                className="neu-input w-full px-3 py-2 text-center font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => addTradeByType('BE', beR)}
                className="flex items-center justify-center gap-1.5 neu-btn px-3 py-2.5 text-sm font-bold neu-text-secondary transition-all active:scale-95"
                style={{ borderRadius: '0.75rem' }}
              >
                <Minus size={16} />
                {t('rm.be')}
              </button>
              <input
                type="number"
                step="0.01"
                value={beR}
                onChange={(e) => setBeR(e.target.value)}
                placeholder="R"
                className="neu-input w-full px-3 py-2 text-center font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => addTradeByType('custom', customR)}
                className="flex items-center justify-center gap-1.5 neu-btn neu-bg-gold-soft px-3 py-2.5 text-sm font-bold neu-text-gold transition-all active:scale-95"
                style={{ borderRadius: '0.75rem' }}
              >
                <SlidersHorizontal size={16} />
                {t('rm.custom')}
              </button>
              <input
                type="number"
                step="0.01"
                value={customR}
                onChange={(e) => setCustomR(e.target.value)}
                placeholder="R"
                className="neu-input w-full px-3 py-2 text-center font-mono"
              />
            </div>
          </div>

          {trades.length > 0 && (
            <div className="flex justify-start">
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 neu-btn px-4 py-2 text-sm font-medium neu-text-loss transition-colors"
                style={{ borderRadius: '0.75rem' }}
              >
                <Trash2 size={16} />
                {t('rm.clearAll')}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'quick' && (
        <div className="space-y-3">
          <textarea
            value={quickSeq}
            onChange={(e) => setQuickSeq(e.target.value)}
            placeholder={t('rm.quickSequence')}
            className="neu-input h-20 w-full resize-none px-4 py-2.5"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.winDefault')}</label>
              <input type="number" step="0.01" value={winR} onChange={(e) => setWinR(e.target.value)} className="neu-input w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.lossDefault')}</label>
              <input type="number" step="0.01" value={lossR} onChange={(e) => setLossR(e.target.value)} className="neu-input w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium neu-text-secondary">{t('rm.beDefault')}</label>
              <input type="number" step="0.01" value={quickBeR} onChange={(e) => setQuickBeR(e.target.value)} className="neu-input w-full px-4 py-2.5" />
            </div>
          </div>
          <button
            onClick={handleQuickConvert}
            className="flex items-center gap-1.5 neu-btn px-4 py-2 text-sm font-bold neu-text-gold transition-colors"
            style={{ borderRadius: '0.75rem' }}
          >
            <Zap size={16} />
            {t('rm.convert')}
          </button>
        </div>
      )}

      {tab === 'csv' && (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 neu-btn px-4 py-3 text-sm font-medium neu-text-secondary transition-colors hover:neu-text-primary"
            style={{ borderRadius: '0.75rem' }}
          >
            <Upload size={18} />
            {t('rm.csvFile')}
          </button>
          {csvPreview && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm neu-text-secondary">
                <FileText size={14} />
                {t('rm.csvPreview')} ({csvPreview.length})
              </div>
              {csvErrors.length > 0 ? (
                <div className="neu-card-inset neu-bg-loss-soft p-3" style={{ borderRadius: '0.75rem' }}>
                  <p className="mb-1 text-sm font-medium neu-text-loss">{t('rm.csvErrors')}:</p>
                  <ul className="text-xs neu-text-loss">
                    {csvErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="max-h-40 overflow-y-auto neu-card-inset" style={{ borderRadius: '0.75rem' }}>
                    <table className="w-full text-xs">
                      <thead className="neu-text-muted" style={{ background: 'var(--neu-bg)' }}>
                        <tr>
                          <th className="p-2 text-start">#</th>
                          <th className="p-2 text-start">{t('rm.date')}</th>
                          <th className="p-2 text-start">{t('rm.result')}</th>
                          <th className="p-2 text-end">R</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 20).map((tr) => (
                          <tr key={tr.id} className="border-t" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                            <td className="p-2 neu-text-muted">{tr.index}</td>
                            <td className="p-2 neu-text-secondary">{tr.date ?? '-'}</td>
                            <td className="p-2 neu-text-secondary">{tr.result}</td>
                            <td className={`p-2 text-end font-mono ${resultColor(tr.r)}`}>{tr.r > 0 ? '+' : ''}{tr.r}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={confirmCsvImport}
                    className="neu-btn px-4 py-2 text-sm font-bold neu-text-profit transition-colors"
                    style={{ borderRadius: '0.75rem' }}
                  >
                    {t('rm.confirmImport')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {trades.length > 0 && (
        <div className="mt-4">
          <div className="max-h-60 overflow-y-auto neu-card-inset" style={{ borderRadius: '0.75rem' }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 neu-text-muted" style={{ background: 'var(--neu-bg)' }}>
                <tr>
                  <th className="p-2 text-start">#</th>
                  <th className="p-2 text-start">{t('rm.date')}</th>
                  <th className="p-2 text-start">{t('rm.result')}</th>
                  <th className="p-2 text-end">R</th>
                  <th className="p-2 text-start">{t('rm.notes')}</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {trades.map((tr) => (
                  <tr key={tr.id} className="border-t" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
                    <td className="p-2 neu-text-muted">{tr.index}</td>
                    <td className="p-2 neu-text-secondary">{tr.date ?? '-'}</td>
                    <td className="p-2 neu-text-secondary">{tr.result}</td>
                    <td className={`p-2 text-end font-mono ${resultColor(tr.r)}`}>{tr.r > 0 ? '+' : ''}{tr.r}</td>
                    <td className="p-2 neu-text-muted">{tr.note ?? '-'}</td>
                    <td className="p-2">
                      <button onClick={() => deleteTrade(tr.id)} className="neu-text-muted hover:neu-text-loss">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {trades.length === 0 && tab === 'manual' && (
        <p className="py-6 text-center text-sm neu-text-muted">{t('rm.noTrades')}</p>
      )}
    </div>
  );
}
