import React from 'react';
import { Calendar, ChevronDown, AlertCircle, Presentation } from 'lucide-react';
import { FilterMode, DateRange } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface FilterBarProps {
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  periodName: string;
  periodSubtext?: string;
  onOpenPresentation?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterMode,
  setFilterMode,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  dateRange,
  setDateRange,
  periodName,
  periodSubtext,
  onOpenPresentation,
}) => {
  const { t, getMonthOptions, getYearOptions } = useLanguage();

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  const modes: Array<{ id: FilterMode; label: string }> = [
    { id: 'month', label: t('filter.month') },
    { id: 'calendar_year', label: t('filter.calendarYear') },
    { id: 'year', label: t('filter.fiscalYear') },
    { id: 'range', label: t('filter.range') },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none print:hidden transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Active Filter Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {t('filter.title')}
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full">
              <Calendar size={13} className="text-blue-500 shrink-0" />
              <span>{periodName}</span>
            </div>

            {periodSubtext && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200/60 dark:border-amber-900/40">
                <AlertCircle size={13} className="text-amber-500 shrink-0" />
                <span>{periodSubtext}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls (Segmented Bar + Value Picker) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* iOS / macOS Style Segmented Control */}
          <div
            role="tablist"
            aria-label={t('filter.timeMode')}
            className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto select-none"
          >
            {modes.map((m) => {
              const isActive = filterMode === m.id;
              return (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilterMode(m.id)}
                  className={`relative flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap min-h-[34px] flex items-center justify-center ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Contextual Value Picker Pill */}
          {filterMode === 'month' && (
            <div className="relative inline-flex items-center">
              <select
                aria-label={t('filter.selectMonth')}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-semibold text-xs py-2 pl-3.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700/80 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-colors min-h-[38px] [&>option]:dark:bg-slate-800"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 pointer-events-none text-slate-400"
              />
            </div>
          )}

          {(filterMode === 'calendar_year' || filterMode === 'year') && (
            <div className="relative inline-flex items-center">
              <select
                aria-label={t('filter.selectYear')}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-semibold text-xs py-2 pl-3.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700/80 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-colors min-h-[38px] [&>option]:dark:bg-slate-800"
              >
                {yearOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 pointer-events-none text-slate-400"
              />
            </div>
          )}

          {filterMode === 'range' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-1 border border-slate-200 dark:border-slate-700/80 text-xs">
              <select
                aria-label={t('filter.startMonth')}
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer py-1 [&>option]:dark:bg-slate-800"
              >
                {monthOptions.map((o) => (
                  <option key={`start-${o.value}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-slate-400 font-medium">→</span>
              <select
                aria-label={t('filter.endMonth')}
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer py-1 [&>option]:dark:bg-slate-800"
              >
                {monthOptions.map((o) => (
                  <option key={`end-${o.value}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Executive Presentation Button */}
          {onOpenPresentation && (
            <button
              onClick={onOpenPresentation}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-xs transition-all whitespace-nowrap min-h-[38px]"
              title={t('filter.openPresentationTooltip')}
            >
              <Presentation size={14} />
              <span>{t('filter.openPresentation')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
