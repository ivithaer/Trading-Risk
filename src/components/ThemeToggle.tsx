import { Sun, Moon } from 'lucide-react';

interface Props {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="neu-btn flex h-9 w-9 items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon size={16} className="neu-text-secondary" />
      ) : (
        <Sun size={16} className="neu-text-gold" />
      )}
    </button>
  );
}
