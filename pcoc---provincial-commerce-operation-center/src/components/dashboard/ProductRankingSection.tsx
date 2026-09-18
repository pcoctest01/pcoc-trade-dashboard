import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon, ChevronRight, PackageOpen } from 'lucide-react';
import { TradeItem } from '../../types';
import { formatCommas, PIE_COLORS } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProductRankingSectionProps {
  activeTab: 'exports' | 'imports';
  setActiveTab: (tab: 'exports' | 'imports') => void;
  exportList: TradeItem[];
  importList: TradeItem[];
  isDark: boolean;
  onSelectProduct?: (item: TradeItem) => void;
}

export const ProductRankingSection: React.FC<ProductRankingSectionProps> = ({
  activeTab,
  setActiveTab,
  exportList,
  importList,
  isDark,
  onSelectProduct,
}) => {
  const { t } = useLanguage();
  const currentList = activeTab === 'exports' ? exportList : importList;
  const top10 = currentList.slice(0, 10);
  const pieData = currentList.slice(0, 5).map((item) => ({
    name: item.name,
    value: item.value,
    hsCode: item.hsCode,
  }));

  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden transition-colors">
      {/* Tab Header (Segmented style) */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {t('ranking.title')}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('ranking.subtitle')}
          </p>
        </div>

        {/* Segmented Control */}
        <div
          role="tablist"
          aria-label={t('ranking.title')}
          className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl select-none self-start sm:self-auto"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'exports'}
            onClick={() => setActiveTab('exports')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
              activeTab === 'exports'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t('ranking.exportTab')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'imports'}
            onClick={() => setActiveTab('imports')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
              activeTab === 'imports'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t('ranking.importTab')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Table Section */}
        <div className="lg:col-span-2 overflow-x-auto border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 text-center font-bold w-12">{t('ranking.rank')}</th>
                <th scope="col" className="py-3 px-3 font-bold w-24">{t('ranking.hsCode')}</th>
                <th scope="col" className="py-3 px-4 font-bold min-w-[220px]">{t('ranking.productName')}</th>
                <th scope="col" className="py-3 px-4 font-bold text-right w-36">{t('ranking.valueMillionBaht')}</th>
                <th scope="col" className="py-3 px-4 font-bold w-32">
                  {activeTab === 'exports' ? t('ranking.destination') : t('ranking.origin')}
                </th>
                <th scope="col" className="py-3 px-2 w-8"><span className="sr-only">view</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {top10.length > 0 ? (
                top10.map((item, idx) => (
                  <tr
                    key={`${item.hsCode}-${item.name}-${idx}`}
                    onClick={() => onSelectProduct?.(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 dark:text-slate-500">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {item.hsCode || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-normal leading-relaxed">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-right text-slate-900 dark:text-slate-50 tabular-nums">
                      {formatCommas(item.value, 2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                      {item.country || (activeTab === 'exports' ? item.dest : item.origin) || '-'}
                    </td>
                    <td className="py-3.5 px-2 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                      <PackageOpen size={32} strokeWidth={1.5} className="mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">{t('ranking.noData')}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t('ranking.noDataSubtext')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie / Donut Chart */}
        <div className="p-6 flex flex-col justify-between items-center bg-slate-50/40 dark:bg-slate-900/40 min-h-[360px]">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <PieChartIcon size={15} className="text-blue-500" />
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('ranking.pieTitle')}
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{t('ranking.pieSubtitle')}</span>
          </div>

          {pieData.length > 0 ? (
            <div className="w-full h-64 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        stroke={isDark ? '#0f172a' : '#ffffff'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      color: tooltipText,
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.12)',
                    }}
                    formatter={(val: number | string | Array<number | string> | undefined) => [
                      `${formatCommas(val, 2)} ${t('common.millionBaht')}`,
                      t('ranking.value'),
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: '11px',
                      paddingTop: '8px',
                      maxHeight: '70px',
                      overflowY: 'auto',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto text-slate-400 text-xs text-center">
              <PackageOpen size={28} strokeWidth={1.5} className="mb-2 text-slate-300 dark:text-slate-600" />
              <p>{t('ranking.noPieData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
