import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Language } from '../../types';

interface LanguageSwitcherProps {
  variant?: 'segmented' | 'compact' | 'menu';
  className?: string;
  showIcon?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'segmented',
  className = '',
  showIcon = true,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = (lang: Language) => {
    if (language !== lang) {
      setLanguage(lang);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
        aria-label={t('nav.changeLanguage')}
        title={language === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 transition-all active:scale-95 ${className}`}
      >
        <Globe size={14} className="text-blue-600 dark:text-blue-400" />
        <span className="uppercase tracking-wider">{language === 'th' ? 'TH' : 'EN'}</span>
      </button>
    );
  }

  if (variant === 'menu') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Globe size={13} />
          <span>{t('nav.language')}</span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
          <button
            onClick={() => handleSelect('th')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              language === 'th'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🇹🇭</span>
            <span>ไทย</span>
          </button>
          <button
            onClick={() => handleSelect('en')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              language === 'en'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
        </div>
      </div>
    );
  }

  // Default: Apple-inspired segmented control (TH | EN)
  return (
    <div
      role="group"
      aria-label={t('nav.changeLanguage')}
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-150/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md shadow-2xs ${className}`}
    >
      {showIcon && (
        <span className="pl-2 pr-1 text-slate-400 dark:text-slate-500" aria-hidden="true">
          <Globe size={13} />
        </span>
      )}
      <button
        type="button"
        onClick={() => handleSelect('th')}
        aria-pressed={language === 'th'}
        aria-label="เปลี่ยนเป็นภาษาไทย (Thai)"
        className={`relative px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          language === 'th'
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        TH
      </button>
      <span className="text-slate-300 dark:text-slate-600 text-xs select-none">|</span>
      <button
        type="button"
        onClick={() => handleSelect('en')}
        aria-pressed={language === 'en'}
        aria-label="Switch to English"
        className={`relative px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        EN
      </button>
    </div>
  );
};
