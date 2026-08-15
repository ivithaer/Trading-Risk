import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES, useI18n, type Lang } from '@/lib/i18n';

export default function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="neu-btn flex items-center gap-2 px-3 py-2 text-sm font-medium neu-text-secondary"
      >
        <Globe size={16} className="neu-text-gold" />
        <span className="hidden sm:inline">{current.name}</span>
        <span className="text-base">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-44 overflow-y-auto neu-card p-1" style={{ borderRadius: '1rem' }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code as Lang);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:neu-bg-gold-soft ${
                lang === l.code ? 'neu-text-gold' : 'neu-text-secondary'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="flex-1 text-left">{l.name}</span>
              {lang === l.code && <Check size={14} className="neu-text-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
