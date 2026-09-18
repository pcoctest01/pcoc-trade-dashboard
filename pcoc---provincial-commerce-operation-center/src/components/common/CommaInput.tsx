import React, { useState, useEffect, useRef } from 'react';
import { formatCommas, safeNum } from '../../utils/calculations';

interface CommaInputProps {
  value: number | string | undefined | null;
  onChange: (value: number | string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxDecimals?: number;
}

export const CommaInput: React.FC<CommaInputProps> = ({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  className = '',
  maxDecimals = 6,
}) => {
  const [localValue, setLocalValue] = useState<string>(
    value || value === 0 ? formatCommas(value, maxDecimals) : ''
  );
  const inputIdRef = useRef(`comma-input-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (document.activeElement?.id !== inputIdRef.current) {
      setLocalValue(value || value === 0 ? formatCommas(value, maxDecimals) : '');
    }
  }, [value, maxDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9.-]/g, '');
    setLocalValue(e.target.value);
    onChange(rawVal);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const rawVal = safeNum(e.target.value);
    setLocalValue(rawVal || rawVal === 0 ? formatCommas(rawVal, maxDecimals) : '');
    onChange(rawVal);
  };

  return (
    <input
      id={inputIdRef.current}
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
};
