import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { ThemeMode } from '../../types';

interface ThemeSwitcherProps {
  variant?: 'segmented' | 'dropdown' | 'toggle' | 'menu';
  className?: string;
  showLabels?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
  showLabels = false,
}) => {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
    {
      value: 'light',
      label: t('nav.themeLight'),
      icon: <Sun size={14} className={theme === 'light' ? 'text-amber-500' : 'text-slate-400'} />,
    },
    {
      value: 'dark',
      label: t('nav.themeDark'),
      icon: <Moon size={14} className={theme === 'dark' ? 'text-blue-400' : 'text-slate-400'} />,
    },
    {
      value: 'system',
      label: t('nav.themeSystem'),
      icon: <Monitor size={14} className={theme === 'system' ? 'text-blue-500' : 'text-slate-400'} />,
    },
  ];

  // 1. Direct Toggle Button (Sun/Moon quick switch)
  if (variant === 'toggle') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? t('nav.themeLight') : t('nav.themeDark')}
        title={isDark ? t('nav.themeLight') : t('nav.themeDark')}
        className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/50 ${className}`}
      >
        <span className="sr-only">{isDark ? t('nav.themeLight') : t('nav.themeDark')}</span>
        {isDark ? (
          <Moon size={18} className="text-blue-400 transition-transform duration-200 rotate-0" />
        ) : (
          <Sun size={18} className="text-amber-500 transition-transform duration-200 rotate-0" />
        )}
      </button>
    );
  }

  // 2. Apple Segmented Control [ Light | Dark | System ]
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label={t('nav.theme')}
        className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 select-none ${className}`}
      >
        {options.map((opt) => {
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={isSelected}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={opt.label}
            >
              {opt.icon}
              {showLabels && <span>{opt.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // 3. Mobile / Full Drawer Menu
  if (variant === 'menu') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          {isDark ? <Moon size={13} /> : <Sun size={13} />}
          <span>{t('nav.theme')}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.icon}
                <span className="text-[11px] truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Default: Dropdown Menu Button
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('nav.theme')}
        title={`${t('nav.theme')} (${theme === 'light' ? t('nav.themeLight') : theme === 'dark' ? t('nav.themeDark') : t('nav.themeSystem')})`}
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer"
      >
        {theme === 'light' ? (
          <Sun size={17} className="text-amber-500" />
        ) : theme === 'dark' ? (
          <Moon size={17} className="text-blue-400" />
        ) : (
          <Monitor size={17} className="text-slate-500 dark:text-slate-300" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitem"
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
