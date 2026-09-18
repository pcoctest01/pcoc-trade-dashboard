import React, { useState, useMemo } from 'react';
import {
  Search,
  BarChart2,
  TrendingUp,
  Globe,
  Package,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { Database, FilterMode, TradeItem } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  formatCommas,
  safeNum,
  round6,
  mergeCountries,
  isFiscalYear,
  THEME_COLORS,
  getChartThemeColors,
} from '../../utils/calculations';

interface ProductAnalyticsProps {
  db: Database;
  isDark: boolean;
}

interface AnalyzedProduct extends TradeItem {
  totalExport: number;
  totalImport: number;
  history: Record<string, { export: number; import: number }>;
}

export const ProductAnalytics: React.FC<ProductAnalyticsProps> = ({ db, isDark }) => {
  const { t, getMonthOptions, getYearOptions, formatMonthYear } = useLanguage();
  const monthOptions = useMemo(() => getMonthOptions(), [getMonthOptions]);
  const yearOptions = useMemo(() => getYearOptions(), [getYearOptions]);

  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const keys = Object.keys(db).sort().reverse();
    return keys[0] || '';
  });
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [activeTab, setActiveTab] = useState<'exports' | 'imports'>('exports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<AnalyzedProduct | null>(null);

  // Compute Active Processing Periods
  const processPeriods = useMemo(() => {
    const allPeriods = Object.keys(db || {}).filter((p) => /^\d{4}-\d{2}$/.test(p));
    if (filterMode === 'month') {
      return selectedMonth ? [selectedMonth] : [];
    }
    if (filterMode === 'calendar_year') {
      return allPeriods.filter((p) => p.startsWith(selectedYear));
    }
    if (filterMode === 'year') {
      const targetYear = parseInt(selectedYear, 10);
      return allPeriods.filter((p) => isFiscalYear(p, targetYear));
    }
    return allPeriods;
  }, [db, filterMode, selectedMonth, selectedYear]);

  // Aggregate Product Analytics Data
  const analyzedProducts = useMemo(() => {
    const map: Record<string, AnalyzedProduct> = {};

    Object.keys(db).forEach((period) => {
      const isSelectedPeriod = processPeriods.includes(period);

      (['exports', 'imports'] as const).forEach((type) => {
        const list = db[period]?.[type] || [];
        list.forEach((item) => {
          const key = item.hsCode?.trim() || item.name?.trim() || 'unknown';
          if (!map[key]) {
            map[key] = {
              ...item,
              totalExport: 0,
              totalImport: 0,
              history: {},
              country: '',
            };
          }
          if (!map[key].history[period]) {
            map[key].history[period] = { export: 0, import: 0 };
          }

          const val = safeNum(item.value);
          if (type === 'exports') {
            map[key].history[period].export += val;
            if (isSelectedPeriod) {
              map[key].totalExport = round6(map[key].totalExport + val);
            }
          } else {
            map[key].history[period].import += val;
            if (isSelectedPeriod) {
              map[key].totalImport = round6(map[key].totalImport + val);
            }
          }

          if (isSelectedPeriod) {
            map[key].country = mergeCountries(
              map[key].country,
              type === 'exports' ? item.dest : item.origin
            );
          }
        });
      });
    });

    let list = Object.values(map).filter((i) =>
      activeTab === 'exports' ? i.totalExport > 0 : i.totalImport > 0
    );

    list.sort((a, b) =>
      activeTab === 'exports'
        ? b.totalExport - a.totalExport
        : b.totalImport - a.totalImport
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.hsCode?.toLowerCase().includes(q) ||
          i.country?.toLowerCase().includes(q)
      );
    }

    return list.map((item, idx) => ({ ...item, id: idx + 1 }));
  }, [db, processPeriods, activeTab, searchQuery]);

  // Product Trend Over Time Chart Data
  const trendData = useMemo(() => {
    if (!selectedProduct) return [];
    const periods = Object.keys(db).filter((p) => /^\d{4}-\d{2}$/.test(p)).sort();

    return periods.map((period) => {
      const hist = selectedProduct.history[period] || { export: 0, import: 0 };
      const label = formatMonthYear(period, 'short');

      return {
        period,
        monthLabel: label,
        exportVal: round6(hist.export),
        importVal: round6(hist.import),
      };
    });
  }, [selectedProduct, db, formatMonthYear]);

  const chartColors = getChartThemeColors(isDark);

  return (
    <div className="space-y-6">
      {/* Top Header Card (Apple Style) */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BarChart2 size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {t('analytics.title')}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t('analytics.subtitle')}
            </p>
          </div>
        </div>

        {/* Analytics Filter Selector (Apple Segmented Style) */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          <div
            role="tablist"
            aria-label="รูปแบบช่วงเวลาข้อมูลสินค้า"
            className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl select-none"
          >
            {(['month', 'calendar_year', 'year'] as FilterMode[]).map((mode) => {
              const label =
                mode === 'month'
                  ? t('filter.month')
                  : mode === 'calendar_year'
                  ? t('filter.calendarYear')
                  : t('filter.fiscalYear');
              const isActive = filterMode === mode;
              return (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {filterMode === 'month' && (
            <div className="relative inline-flex items-center">
              <select
                aria-label={t('filter.selectMonth')}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-semibold text-xs py-2 pl-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700/80 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer min-h-[36px] [&>option]:dark:bg-slate-800"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 pointer-events-none text-slate-400" />
            </div>
          )}

          {(filterMode === 'year' || filterMode === 'calendar_year') && (
            <div className="relative inline-flex items-center">
              <select
                aria-label={t('filter.selectYear')}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-semibold text-xs py-2 pl-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700/80 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer min-h-[36px] [&>option]:dark:bg-slate-800"
              >
                {yearOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 pointer-events-none text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left List + Right Detail Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Product List Table with Search & Tabs */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col h-[650px] sm:h-[700px] overflow-hidden transition-colors">
          {/* Controls Bar (Spotlight search + Segmented switch) */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row gap-2.5">
            {/* Tab switch */}
            <div
              role="tablist"
              aria-label={t('analytics.filterType')}
              className="flex bg-slate-200/70 dark:bg-slate-800 rounded-xl p-1 shrink-0 select-none self-start sm:self-auto"
            >
              <button
                role="tab"
                aria-selected={activeTab === 'exports'}
                onClick={() => {
                  setActiveTab('exports');
                  setSelectedProduct(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                  activeTab === 'exports'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {t('analytics.exportTab')}
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'imports'}
                onClick={() => {
                  setActiveTab('imports');
                  setSelectedProduct(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
                  activeTab === 'imports'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {t('analytics.importTab')}
              </button>
            </div>

            {/* Instant Apple Spotlight Search Box */}
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('analytics.searchPlaceholder')}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9.5 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all min-h-[36px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label={t('analytics.clearSearch')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider backdrop-blur-xs">
                <tr>
                  <th scope="col" className="py-2.5 px-3 font-bold text-center w-20">{t('ranking.hsCode')}</th>
                  <th scope="col" className="py-2.5 px-4 font-bold min-w-[200px]">{t('ranking.productName')}</th>
                  <th scope="col" className="py-2.5 px-4 font-bold text-right w-28">{t('analytics.totalVal')}</th>
                  <th scope="col" className="py-2.5 px-2 w-8"><span className="sr-only">{t('common.viewDetails')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {analyzedProducts.length > 0 ? (
                  analyzedProducts.map((item) => {
                    const isSelected =
                      selectedProduct?.hsCode === item.hsCode &&
                      selectedProduct?.name === item.name;

                    return (
                      <tr
                        key={`${item.hsCode}-${item.name}`}
                        onClick={() => setSelectedProduct(item)}
                        className={`cursor-pointer transition-colors group ${
                          isSelected
                            ? 'bg-blue-500/10 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border ${
                              isSelected
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'
                            }`}
                          >
                            {item.hsCode || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-normal font-medium leading-relaxed">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </div>
                          {item.country && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {activeTab === 'exports' ? t('ranking.destination') + ': ' : t('ranking.origin') + ': '}
                              {item.country}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-right text-slate-900 dark:text-slate-50 tabular-nums">
                          {formatCommas(
                            activeTab === 'exports' ? item.totalExport : item.totalImport,
                            2
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                          <ChevronRight size={14} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <Package size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-medium text-xs">{t('analytics.noResults')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="py-2 px-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium">
            {t('analytics.foundItems', { count: analyzedProducts.length })}
          </div>
        </div>

        {/* Right Side: Product Detail & Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none p-5 sm:p-6 h-[650px] sm:h-[700px] flex flex-col transition-colors">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              <span>{t('analytics.trendTitle')}</span>
            </h3>
          </div>

          {selectedProduct ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Product Info Card (Apple refined style) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900/40">
                    {selectedProduct.hsCode ? t('analytics.hsCodePrefix', { code: selectedProduct.hsCode }) : t('common.unspecified')}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedProduct.name}
                </h4>

                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <Globe size={13} className="text-slate-400 shrink-0" />
                  <span>
                    {activeTab === 'exports' ? t('ranking.destination') + ': ' : t('ranking.origin') + ': '}
                    <strong className="text-slate-700 dark:text-slate-300 font-semibold ml-1">
                      {selectedProduct.country || t('common.unspecified')}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fill: chartColors.axis, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      tick={{ fill: chartColors.axis, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        color: chartColors.tooltipText,
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12)',
                      }}
                      formatter={(val: number | string | Array<number | string> | undefined, name: string | number | undefined) => [
                        `${formatCommas(val, 2)} ${t('common.millionBaht')}`,
                        name === 'exportVal' ? t('analytics.exportValueShort') : t('analytics.importValueShort'),
                      ]}
                      labelFormatter={(label) => `${t('filter.selectMonth')}: ${label}`}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="exportVal"
                      name={t('analytics.exportValueShort')}
                      fill={chartColors.export}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="importVal"
                      name={t('analytics.importValueShort')}
                      fill={chartColors.import}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 shadow-xs">
                <Package size={24} strokeWidth={1.8} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('analytics.selectProductPrompt')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                {t('analytics.selectProductSubtext')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
