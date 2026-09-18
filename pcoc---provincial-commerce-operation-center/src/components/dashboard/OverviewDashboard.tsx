import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  Database,
  FilterMode,
  DateRange,
  AggregatedSummary,
  GrowthMetric,
  LogisticsData,
  TradeItem,
} from '../../types';
import { StatCard } from '../common/StatCard';
import { FilterBar } from './FilterBar';
import { LogisticsSection } from './LogisticsSection';
import { ProductRankingSection } from './ProductRankingSection';
import { SkeletonCard } from '../common/SkeletonCard';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  formatCommas,
  THEME_COLORS,
  getChartThemeColors,
} from '../../utils/calculations';

interface OverviewDashboardProps {
  db: Database;
  isLoading: boolean;
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
  summary: AggregatedSummary;
  mom: GrowthMetric;
  yoy: GrowthMetric;
  logistics: LogisticsData;
  topExports: TradeItem[];
  topImports: TradeItem[];
  chartData: Array<{
    period: string;
    label: string;
    export: number;
    import: number;
    total: number;
    balance: number;
  }>;
  isDark: boolean;
  onSelectProduct?: (item: TradeItem) => void;
  onOpenPresentation?: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  isLoading,
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
  summary,
  mom,
  yoy,
  logistics,
  topExports,
  topImports,
  chartData,
  isDark,
  onSelectProduct,
  onOpenPresentation,
}) => {
  const { t } = useLanguage();
  const [rankingTab, setRankingTab] = useState<'exports' | 'imports'>('exports');

  const chartColors = getChartThemeColors(isDark);

  return (
    <div className="space-y-6">
      {/* 1. Global Filter Bar */}
      <FilterBar
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        dateRange={dateRange}
        setDateRange={setDateRange}
        periodName={periodName}
        periodSubtext={periodSubtext}
        onOpenPresentation={onOpenPresentation}
      />

      {/* 2. Top Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              id="stat-export"
              title={t('stats.exportValue')}
              value={summary.export}
              color="blue"
              icon={ArrowUpRight}
              mom={filterMode === 'month' ? mom.export : null}
              yoy={yoy.export}
              subtext={t('stats.exportSubtext')}
            />
            <StatCard
              id="stat-import"
              title={t('stats.importValue')}
              value={summary.import}
              color="red"
              icon={ArrowDownRight}
              mom={filterMode === 'month' ? mom.import : null}
              yoy={yoy.import}
              subtext={t('stats.importSubtext')}
            />
            <StatCard
              id="stat-balance"
              title={t('stats.tradeBalance')}
              value={summary.balance}
              color="green"
              icon={Scale}
              mom={filterMode === 'month' ? mom.balance : null}
              yoy={yoy.balance}
              subtext={summary.balance >= 0 ? t('stats.tradeSurplus') : t('stats.tradeDeficit')}
            />
            <StatCard
              id="stat-total"
              title={t('stats.totalTrade')}
              value={summary.total}
              color="slate"
              icon={Activity}
              mom={filterMode === 'month' ? mom.total : null}
              yoy={yoy.total}
              subtext={t('stats.totalSubtext')}
            />
          </>
        )}
      </div>

      {/* 3. Main Trend Chart Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              <span>{t('stats.trendChart')}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {t('stats.trendSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[11px]">
              <Calendar size={12} className="text-slate-400" />
              <span>{t('stats.periodsCount', { count: chartData.length })}</span>
            </span>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fill: chartColors.axis, fontSize: 11 }}
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
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                }}
                formatter={(val: number | string | Array<number | string> | undefined, name: string | number | undefined) => [
                  `${formatCommas(val, 2)} ${t('common.millionBaht')}`,
                  name === 'export' || name === t('stats.exportSeries')
                    ? t('stats.exportSeries')
                    : name === 'import' || name === t('stats.importSeries')
                    ? t('stats.importSeries')
                    : name === 'total' || name === t('stats.totalSeries')
                    ? t('stats.totalSeries')
                    : t('stats.balanceSeries'),
                ]}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingBottom: '10px' }}
              />
              <Bar
                dataKey="export"
                name={t('stats.exportSeries')}
                fill={chartColors.export}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="import"
                name={t('stats.importSeries')}
                fill={chartColors.import}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                type="monotone"
                dataKey="balance"
                name={t('stats.balanceSeries')}
                stroke={chartColors.balance}
                strokeWidth={2.5}
                dot={{ r: 3, fill: chartColors.balance }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Logistics & Transit Section */}
      <LogisticsSection logistics={logistics} />

      {/* 5. Product Ranking & Pie Proportion Section */}
      <ProductRankingSection
        activeTab={rankingTab}
        setActiveTab={setRankingTab}
        exportList={topExports}
        importList={topImports}
        isDark={isDark}
        onSelectProduct={onSelectProduct}
      />
    </div>
  );
};
