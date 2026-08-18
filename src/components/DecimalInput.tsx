import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  step?: string;
  min?: number;
  placeholder?: string;
  style?: React.CSSProperties;
  inputMode?: 'decimal' | 'numeric';
}

const DECIMAL_REGEX = /^-?\d*\.?\d*$/;

export default function DecimalInput({
  value,
  onChange,
  className = '',
  step,
  min,
  placeholder,
  style,
  inputMode = 'decimal',
}: Props) {
  const [text, setText] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (!isFocused && value !== lastValueRef.current) {
      setText(String(value));
      lastValueRef.current = value;
    }
  }, [value, isFocused]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setText(String(value));
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || DECIMAL_REGEX.test(raw)) {
      setText(raw);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = parseFloat(text);
    if (isNaN(parsed)) {
      onChange(0);
      setText('0');
    } else {
      if (min !== undefined && parsed < min) {
        onChange(min);
        setText(String(min));
      } else {
        onChange(parsed);
        setText(String(parsed));
      }
      lastValueRef.current = parsed;
    }
  }, [text, onChange, min]);

  return (
    <input
      type="text"
      inputMode={inputMode}
      value={isFocused ? text : String(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      style={style}
    />
  );
}
