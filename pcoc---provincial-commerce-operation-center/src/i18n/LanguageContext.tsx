import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, FilterMode, DateRange } from '../types';
import { th } from './translations/th';
import { en } from './translations/en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatMonthYear: (period: string, format?: 'long' | 'short' | boolean) => string;
  formatYear: (year: string | number) => string;
  getMonthName: (monthIndexZeroBased: number, short?: boolean) => string;
  getMonthOptions: () => Array<{ value: string; label: string }>;
  getYearOptions: () => Array<{ value: string; label: string }>;
  formatPeriodDisplayName: (
    mode: FilterMode,
    selectedMonth: string,
    selectedYear: string,
    dateRange: DateRange,
    allPeriods?: string[]
  ) => { name: string; subtext?: string };
}

const STORAGE_KEY = 'ncr_language';

const translations: Record<Language, typeof th> = {
  th,
  en,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Helper to get initial language:
 * 1. Saved User Preference in localStorage
 * 2. Browser Language
 * 3. Default: 'th'
 */
const getInitialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'th' || saved === 'en') {
      return saved;
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        return 'en';
      }
    }
  } catch {
    // ignore
  }
  return 'th';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'th' ? 'en' : 'th');
  }, [language, setLanguage]);

  // Keep document html lang attribute in sync
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute('data-lang', language);
  }, [language]);

  /**
   * Safe Translation function with nested key support and parameter interpolation
   * Example: t('nav.overview')
   * Example: t('filter.monthsAccumulated', { count: 3, months: 'ม.ค., ก.พ., มี.ค.' })
   */
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let current: any = translations[language];
      let found = true;

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          found = false;
          break;
        }
      }

      // Fallback to Thai if not found in current language
      if (!found || current === undefined) {
        let fallback: any = translations.th;
        for (const k of keys) {
          if (fallback && typeof fallback === 'object' && k in fallback) {
            fallback = fallback[k];
          } else {
            fallback = undefined;
            break;
          }
        }
        current = fallback;
      }

      if (typeof current !== 'string') {
        return path;
      }

      // Interpolate params: e.g. {count}, {percent}
      if (params) {
        return current.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
          return params[paramKey] !== undefined ? String(params[paramKey]) : match;
        });
      }

      return current;
    },
    [language]
  );

  /**
   * Format Month Year based on active language:
   * e.g., "2024-09" -> "กันยายน 2567" (TH) or "September 2024" (EN)
   */
  const formatMonthYear = useCallback(
    (period: string, format: 'long' | 'short' | boolean = 'long'): string => {
      if (!period) return language === 'th' ? 'ไม่มีข้อมูล' : 'No data';
      if (!period.includes('-')) return period;
      const parts = period.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return period;

      const isShort = format === 'short' || format === true;
      const monthName = isShort
        ? translations[language].monthsShort[m - 1]
        : translations[language].months[m - 1];

      if (language === 'th') {
        const thYear = y + 543;
        return isShort ? `${monthName} ${String(thYear).slice(-2)}` : `${monthName} ${thYear}`;
      }
      return `${monthName} ${y}`;
    },
    [language]
  );

  /**
   * Format Year based on active language:
   * e.g., 2024 -> "พ.ศ. 2567" (TH) or "2024" (EN)
   */
  const formatYear = useCallback(
    (year: string | number): string => {
      const y = typeof year === 'number' ? year : parseInt(year, 10);
      if (isNaN(y)) return String(year);
      if (language === 'th') {
        return `พ.ศ. ${y + 543}`;
      }
      return String(y);
    },
    [language]
  );

  const getMonthName = useCallback(
    (monthIndexZeroBased: number, short = false): string => {
      const list = short ? translations[language].monthsShort : translations[language].months;
      return list[monthIndexZeroBased] || '';
    },
    [language]
  );

  /**
   * Generate Month Options localized
   */
  const getMonthOptions = useCallback(() => {
    const options: { value: string; label: string }[] = [];
    const currentYear = new Date().getFullYear();
    const startYear = 2023;
    const endYear = currentYear + 2;

    for (let y = endYear; y >= startYear; y--) {
      for (let m = 12; m >= 1; m--) {
        const monthStr = m.toString().padStart(2, '0');
        const monthName = translations[language].months[m - 1];
        const yearLabel = language === 'th' ? y + 543 : y;
        options.push({
          value: `${y}-${monthStr}`,
          label: `${monthName} ${yearLabel}`,
        });
      }
    }
    return options;
  }, [language]);

  /**
   * Generate Year Options localized
   */
  const getYearOptions = useCallback(() => {
    const options: { value: string; label: string }[] = [];
    const currentYear = new Date().getFullYear();
    const startYear = 2023;
    const endYear = currentYear + 2;

    for (let y = endYear; y >= startYear; y--) {
      const yearLabel = language === 'th' ? `พ.ศ. ${y + 543}` : String(y);
      options.push({
        value: y.toString(),
        label: yearLabel,
      });
    }
    return options;
  }, [language]);

  /**
   * Localized period display title and subtext
   */
  const formatPeriodDisplayName = useCallback(
    (
      mode: FilterMode,
      selectedMonth: string,
      selectedYear: string,
      dateRange: DateRange,
      allPeriods: string[] = []
    ) => {
      let name = '';
      let subtext: string | undefined = undefined;

      if (mode === 'month') {
        name = formatMonthYear(selectedMonth);
      } else if (mode === 'calendar_year') {
        const yNum = parseInt(selectedYear, 10);
        const yearLabel = language === 'th' ? yNum + 543 : yNum;
        name = t('filter.calendarYearFormat', { year: yearLabel });

        const currentPeriodList = allPeriods.filter((p) => p.startsWith(selectedYear));
        if (currentPeriodList.length < 12 && currentPeriodList.length > 0) {
          const monthNames = currentPeriodList.map((p) => {
            const m = parseInt(p.split('-')[1], 10) - 1;
            return translations[language].monthsShort[m] || p;
          });
          subtext = t('filter.monthsAccumulated', {
            count: currentPeriodList.length,
            months: monthNames.join(', '),
          });
        }
      } else if (mode === 'year') {
        const targetYear = parseInt(selectedYear, 10);
        const yearLabel = language === 'th' ? targetYear + 543 : targetYear;
        name = t('filter.fiscalYearFormat', { year: yearLabel });

        // Thai Fiscal Year: Oct (targetYear-1) to Sep (targetYear)
        const currentPeriodList = allPeriods.filter((p) => {
          if (!p.includes('-')) return false;
          const [y, m] = p.split('-').map(Number);
          return (y === targetYear - 1 && m >= 10) || (y === targetYear && m <= 9);
        });

        if (currentPeriodList.length < 12) {
          subtext = t('filter.fiscalPending', { count: currentPeriodList.length });
        }
      } else if (mode === 'range') {
        name = t('filter.rangeFromTo', {
          from: formatMonthYear(dateRange.start),
          to: formatMonthYear(dateRange.end),
        });
      }

      return { name, subtext };
    },
    [language, formatMonthYear, t]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatMonthYear,
      formatYear,
      getMonthName,
      getMonthOptions,
      getYearOptions,
      formatPeriodDisplayName,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatMonthYear,
      formatYear,
      getMonthName,
      getMonthOptions,
      getYearOptions,
      formatPeriodDisplayName,
    ]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
