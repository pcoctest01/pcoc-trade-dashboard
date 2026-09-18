import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Printer,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Truck,
  Users,
  Package,
  Layers,
  Sparkles,
  Calendar,
  Building2,
  Globe,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Database,
  FilterMode,
  AggregatedSummary,
  GrowthMetric,
  LogisticsData,
  TradeItem,
} from '../../types';
import {
  formatCommas,
  THEME_COLORS,
  PIE_COLORS,
  getChartThemeColors,
} from '../../utils/calculations';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../context/ThemeContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { Sun, Moon } from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
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
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  db,
  filterMode,
  setFilterMode,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
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
}) => {
  const { t, language, getMonthOptions, getYearOptions } = useLanguage();
  const { setTheme, isDark: contextIsDark } = useTheme();
  const effectiveIsDark = contextIsDark ?? isDark;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TOTAL_SLIDES = 5;

  const slidesMetadata = useMemo(
    () => [
      { title: t('presentation.slide1Title'), subtitle: t('presentation.slide1Subtitle'), icon: TrendingUp },
      { title: t('presentation.slide2Title'), subtitle: t('presentation.slide2Subtitle'), icon: ArrowUpRight },
      { title: t('presentation.slide3Title'), subtitle: t('presentation.slide3Subtitle'), icon: ArrowDownRight },
      { title: t('presentation.slide4Title'), subtitle: t('presentation.slide4Subtitle'), icon: Truck },
      { title: t('presentation.slide5Title'), subtitle: t('presentation.slide5Subtitle'), icon: Compass },
    ],
    [t]
  );

  // Auto-play feature
  useEffect(() => {
    if (isPlaying && isOpen) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
      }, 9000);
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlaying, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'p') {
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Compute calculated metrics
  const isSurplus = summary.balance >= 0;
  const exportShare = summary.total > 0 ? (summary.export / summary.total) * 100 : 0;
  const importShare = summary.total > 0 ? (summary.import / summary.total) * 100 : 0;

  // Export & Import Pie Data
  const exportPieData = useMemo(() => {
    const items = topExports.slice(0, 5).map((item) => ({
      name: item.name,
      value: item.value,
    }));
    const top5Total = items.reduce((acc, curr) => acc + curr.value, 0);
    const otherVal = Math.max(0, summary.export - top5Total);
    if (otherVal > 0) {
      items.push({ name: t('products.otherProducts'), value: otherVal });
    }
    return items;
  }, [topExports, summary.export, t]);

  const importPieData = useMemo(() => {
    const items = topImports.slice(0, 5).map((item) => ({
      name: item.name,
      value: item.value,
    }));
    const top5Total = items.reduce((acc, curr) => acc + curr.value, 0);
    const otherVal = Math.max(0, summary.import - top5Total);
    if (otherVal > 0) {
      items.push({ name: t('products.otherProducts'), value: otherVal });
    }
    return items;
  }, [topImports, summary.import, t]);

  const presChartColors = getChartThemeColors(effectiveIsDark);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('filter.openPresentationTooltip')}
      className="fixed inset-0 z-[100] bg-slate-100/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden backdrop-blur-2xl transition-colors duration-200 select-none print:p-0 print:bg-white print:text-slate-900"
    >
      {/* Presentation Top App Bar */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 flex items-center justify-between shrink-0 backdrop-blur-xl transition-colors print:hidden">
        {/* Left: Branding & Current Slide Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <TrendingUp size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                {t('presentation.headerTitle')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/25 dark:border-blue-500/30">
                {t('presentation.badge')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {t('presentation.slideCounter', {
                current: currentSlide + 1,
                total: TOTAL_SLIDES,
                title: slidesMetadata[currentSlide].title,
              })}
            </p>
          </div>
        </div>

        {/* Center: Period Quick Controls */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors">
          <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{periodName}</span>
          {periodSubtext && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">({periodSubtext})</span>
          )}

          {/* Quick Period Selector */}
          <select
            value={filterMode === 'month' ? selectedMonth : selectedYear}
            onChange={(e) => {
              if (filterMode === 'month') {
                setSelectedMonth(e.target.value);
              } else {
                setSelectedYear(e.target.value);
              }
            }}
            aria-label={t('filter.period')}
            className="ml-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-800 dark:text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 outline-none cursor-pointer transition-colors"
          >
            {filterMode === 'month'
              ? getMonthOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {o.label}
                  </option>
                ))
              : getYearOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {o.label}
                  </option>
                ))}
          </select>
        </div>

        {/* Right: Presentation Tools */}
        <div className="flex items-center gap-2">
          {/* Quick 1-Click Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(effectiveIsDark ? 'light' : 'dark')}
            title={effectiveIsDark ? (language === 'th' ? 'เปลี่ยนเป็นธีมสว่าง (Light Mode)' : 'Switch to Light Mode') : (language === 'th' ? 'เปลี่ยนเป็นธีมมืด (Dark Mode)' : 'Switch to Dark Mode')}
            aria-label={effectiveIsDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {effectiveIsDark ? (
              <Sun size={15} className="text-amber-500 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon size={15} className="text-blue-500 animate-in spin-in-180 duration-200" />
            )}
            <span className="hidden sm:inline text-[11px] font-medium">
              {effectiveIsDark ? (language === 'th' ? 'โหมดสว่าง' : 'Light') : (language === 'th' ? 'โหมดมืด' : 'Dark')}
            </span>
          </button>

          {/* Theme Switcher Dropdown (Supports Light / Dark / System) */}
          <ThemeSwitcher variant="dropdown" />

          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Speaker Notes Toggle */}
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            title={t('presentation.speakerNotes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showSpeakerNotes
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <FileText size={14} />
            <span className="hidden sm:inline">{t('presentation.speakerNotes')}</span>
          </button>

          {/* Auto Play */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? t('presentation.pause') : t('presentation.play')}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? t('presentation.exitFullscreen') : t('presentation.fullscreen')}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            title={t('presentation.printSlide')}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
          >
            <Printer size={15} />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            title={t('presentation.close')}
            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Main Slide Presentation Stage */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-6 sm:py-8 flex flex-col justify-between max-w-7xl w-full mx-auto">
        {/* Slide Header Info */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>{slidesMetadata[currentSlide].subtitle}</span>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400">{periodName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {slidesMetadata[currentSlide].title}
            </h1>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {currentSlide + 1} / {TOTAL_SLIDES}
          </div>
        </div>

        {/* Dynamic Slide Content */}
        <div className="flex-1 flex flex-col justify-center">
          {/* SLIDE 1: Executive Macro Overview */}
          {currentSlide === 0 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 Big Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Trade */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 rounded-2xl transition-colors">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">{t('metrics.totalTrade')}</span>
                    <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                    {formatCommas(summary.total, 2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('metrics.unitMillionBaht')}</div>
                  {yoy.total !== null && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <span>YoY:</span>
                      <span>{yoy.total > 0 ? `+${yoy.total}%` : `${yoy.total}%`}</span>
                    </div>
                  )}
                </div>

                {/* Export */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 rounded-2xl transition-colors">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">{t('metrics.exportValue')}</span>
                    <ArrowUpRight size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatCommas(summary.export, 2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('metrics.unitMillionBaht')} ({t('metrics.share')} {exportShare.toFixed(1)}%)
                  </div>
                  {yoy.export !== null && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span>YoY:</span>
                      <span>{yoy.export > 0 ? `+${yoy.export}%` : `${yoy.export}%`}</span>
                    </div>
                  )}
                </div>

                {/* Import */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 rounded-2xl transition-colors">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">{t('metrics.importValue')}</span>
                    <ArrowDownRight size={16} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatCommas(summary.import, 2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('metrics.unitMillionBaht')} ({t('metrics.share')} {importShare.toFixed(1)}%)
                  </div>
                  {yoy.import !== null && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      <span>YoY:</span>
                      <span>{yoy.import > 0 ? `+${yoy.import}%` : `${yoy.import}%`}</span>
                    </div>
                  )}
                </div>

                {/* Trade Balance */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 rounded-2xl transition-colors">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">{t('metrics.tradeBalance')}</span>
                    <Scale size={16} className={isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} />
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                      isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCommas(summary.balance, 2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('metrics.unitMillionBaht')} ({isSurplus ? t('presentation.surplus') : t('presentation.deficit')})
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {isSurplus ? t('metrics.surplusBadge') : t('metrics.deficitBadge')}
                  </div>
                </div>
              </div>

              {/* Executive Analytical Takeaways */}
              <div className="bg-slate-50/90 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl transition-colors">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900 dark:text-white">
                  <Sparkles size={16} className="text-amber-500 dark:text-amber-400" />
                  <span>{t('presentation.highlights')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-xs">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">{t('presentation.h1Title')}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === 'th' ? (
                        <>
                          ในรอบ {periodName} การค้าชายแดนอยู่ในภาวะ
                          <strong className={isSurplus ? ' text-emerald-600 dark:text-emerald-400' : ' text-rose-600 dark:text-rose-400'}>
                            {isSurplus ? ' เกินดุลการค้า ' : ' ขาดดุลการค้า '}
                            {formatCommas(Math.abs(summary.balance), 2)} ล้านบาท
                          </strong>{' '}
                          โดยมีสัดส่วนการส่งออกคิดเป็น {exportShare.toFixed(1)}% ของมูลค่าการค้ารวม
                        </>
                      ) : (
                        <>
                          During {periodName}, bilateral border trade registered a{' '}
                          <strong className={isSurplus ? ' text-emerald-600 dark:text-emerald-400' : ' text-rose-600 dark:text-rose-400'}>
                            {isSurplus ? 'trade surplus' : 'trade deficit'} of{' '}
                            {formatCommas(Math.abs(summary.balance), 2)} M THB
                          </strong>
                          . Export accounted for {exportShare.toFixed(1)}% of total bilateral trade volume.
                        </>
                      )}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-xs">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">{t('presentation.h2Title')}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === 'th' ? (
                        <>
                          มูลค่าส่งออกรวม {formatCommas(summary.export, 2)} ล้านบาท{' '}
                          {yoy.export !== null
                            ? `เทียบกับช่วงเดียวกันของปีก่อน (${yoy.export > 0 ? `+${yoy.export}%` : `${yoy.export}%`})`
                            : 'มีเสถียรภาพในการกระจายสินค้าสู่ประเทศเพื่อนบ้าน'}
                        </>
                      ) : (
                        <>
                          Total export value reached {formatCommas(summary.export, 2)} M THB{' '}
                          {yoy.export !== null
                            ? `compared to the same period last year (${yoy.export > 0 ? `+${yoy.export}%` : `${yoy.export}%`})`
                            : 'with stable distribution networks across neighboring trading partners.'}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-xs">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">{t('presentation.h3Title')}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === 'th'
                        ? `มูลค่านำเข้ารวม ${formatCommas(summary.import, 2)} ล้านบาท ส่วนใหญ่เป็นวัตถุดิบและสินค้าจำเป็น สะท้อนบทบาทของด่านพรมแดนในการเป็นจุดเชื่อมโยงห่วงโซ่อุปทาน`
                        : `Total import value stood at ${formatCommas(summary.import, 2)} M THB, consisting mostly of industrial materials and essentials, highlighting the border checkpoint as an integral regional supply chain artery.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Top Exports Analysis */}
          {currentSlide === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              {/* Left Column: Top 5 Items */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <ArrowUpRight size={18} className="text-blue-600 dark:text-blue-400" />
                    <span>{t('products.top5Exports')}</span>
                  </h3>
                  <div className="space-y-3">
                    {topExports.slice(0, 5).map((item, idx) => {
                      const share = summary.export > 0 ? (item.value / summary.export) * 100 : 0;
                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-slate-500 dark:text-slate-400">HS: {item.hsCode}</span>
                                {item.dest && (
                                  <>
                                    <span>•</span>
                                    <span>{t('products.destination')}: {item.dest}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 tabular-nums">
                              {formatCommas(item.value, 2)}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{share.toFixed(1)}% {t('products.ofExport')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('presentation.top5Share', {
                    percent: (
                      (topExports.slice(0, 5).reduce((acc, c) => acc + c.value, 0) /
                        (summary.export || 1)) *
                      100
                    ).toFixed(1),
                  })}
                </div>
              </div>

              {/* Right Column: Donut Breakdown */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('presentation.exportShareTitle')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('presentation.exportShareSub')}</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={exportPieData}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {exportPieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(val: number | string | Array<number | string> | undefined) => [
                            `${formatCommas(val, 2)} ${t('metrics.unitMillionBaht')}`,
                            t('metrics.value'),
                          ]}
                          contentStyle={{
                            backgroundColor: presChartColors.tooltipBg,
                            borderColor: presChartColors.tooltipBorder,
                            borderRadius: '12px',
                            color: presChartColors.tooltipText,
                            fontSize: '11px',
                            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {exportPieData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Top Imports Analysis */}
          {currentSlide === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              {/* Left Column: Top 5 Items */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <ArrowDownRight size={18} className="text-rose-600 dark:text-rose-400" />
                    <span>{t('products.top5Imports')}</span>
                  </h3>
                  <div className="space-y-3">
                    {topImports.slice(0, 5).map((item, idx) => {
                      const share = summary.import > 0 ? (item.value / summary.import) * 100 : 0;
                      return (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-slate-500 dark:text-slate-400">HS: {item.hsCode}</span>
                                {item.origin && (
                                  <>
                                    <span>•</span>
                                    <span>{t('products.origin')}: {item.origin}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                              {formatCommas(item.value, 2)}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{share.toFixed(1)}% {t('products.ofImport')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('presentation.top5ImportShare', {
                    percent: (
                      (topImports.slice(0, 5).reduce((acc, c) => acc + c.value, 0) /
                        (summary.import || 1)) *
                      100
                    ).toFixed(1),
                  })}
                </div>
              </div>

              {/* Right Column: Donut Breakdown */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{t('presentation.importShareTitle')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('presentation.importShareSub')}</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={importPieData}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {importPieData.map((_, index) => (
                            <Cell key={`cell-import-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(val: number | string | Array<number | string> | undefined) => [
                            `${formatCommas(val, 2)} ${t('metrics.unitMillionBaht')}`,
                            t('metrics.value'),
                          ]}
                          contentStyle={{
                            backgroundColor: presChartColors.tooltipBg,
                            borderColor: presChartColors.tooltipBorder,
                            borderRadius: '12px',
                            color: presChartColors.tooltipText,
                            fontSize: '11px',
                            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {importPieData.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 4: Logistics & Border Dynamics */}
          {currentSlide === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Trucks */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Truck size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('logistics.trucks')}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-300">{t('logistics.truckIn')}:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatCommas(logistics.truckIn, 0)} {t('logistics.unitVehicles')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-300">{t('logistics.truckOut')}:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatCommas(logistics.truckOut, 0)} {t('logistics.unitVehicles')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                      <span>{t('logistics.totalVehicles')}:</span>
                      <span className="font-mono text-sm">
                        {formatCommas(logistics.truckIn + logistics.truckOut, 0)} {t('logistics.unitVehicles')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transit Trade */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Layers size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('presentation.transitTitle')}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-300">{t('presentation.transitIn')}</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {formatCommas(logistics.transitValueIn, 2)} {t('presentation.unitMB')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-300">{t('presentation.transitOut')}</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {formatCommas(logistics.transitValueOut, 2)} {t('presentation.unitMB')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 text-amber-600 dark:text-amber-300 font-semibold text-xs">
                      <span>{t('presentation.totalTransit')}</span>
                      <span className="font-mono text-sm">
                        {formatCommas(logistics.transitValueIn + logistics.transitValueOut, 2)} {t('presentation.unitMB')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('logistics.passengers')}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-300">{t('logistics.passIn')}:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatCommas(logistics.passIn, 0)} {t('logistics.unitPersons')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-600 dark:text-slate-300">{t('logistics.passOut')}:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatCommas(logistics.passOut, 0)} {t('logistics.unitPersons')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                      <span>{t('logistics.totalPassengers')}:</span>
                      <span className="font-mono text-sm">
                        {formatCommas(logistics.passIn + logistics.passOut, 0)} {t('logistics.unitPersons')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logistics Insight Note */}
              <div className="bg-blue-50/70 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-3 transition-colors">
                <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {t('presentation.logisticsNote')}
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 5: Trend & Strategic Takeaways */}
          {currentSlide === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              {/* Left Column: Monthly Trend Line Chart */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
                    <span>{t('presentation.trendTitle')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('presentation.trendSub')}</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={presChartColors.grid} />
                        <XAxis dataKey="label" tick={{ fill: presChartColors.axis, fontSize: 10 }} axisLine={false} tickLine={false} dy={6} />
                        <YAxis tick={{ fill: presChartColors.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: presChartColors.tooltipBg,
                            borderColor: presChartColors.tooltipBorder,
                            borderRadius: '12px',
                            color: presChartColors.tooltipText,
                            fontSize: '11px',
                            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                          }}
                          formatter={(val: number | string | Array<number | string> | undefined, name: string | number | undefined) => [
                            `${formatCommas(val, 2)} ${t('metrics.unitMillionBaht')}`,
                            name === 'export' ? t('metrics.exportValue') : name === 'import' ? t('metrics.importValue') : t('metrics.tradeBalance'),
                          ]}
                        />
                        <Legend verticalAlign="top" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="export" name={t('metrics.exportValue')} fill={presChartColors.export} radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="import" name={t('metrics.importValue')} fill={presChartColors.import} radius={[3, 3, 0, 0]} maxBarSize={20} />
                        <Line type="monotone" dataKey="balance" name={t('metrics.tradeBalance')} stroke={presChartColors.balance} strokeWidth={2.5} dot={{ r: 3, fill: presChartColors.balance }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {t('presentation.trendNote')}
                </div>
              </div>

              {/* Right Column: Strategic Recommendations */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 rounded-3xl flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Compass size={18} className="text-amber-500 dark:text-amber-400" />
                    <span>{t('presentation.policyTitle')}</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl transition-colors">
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {t('presentation.policy1Title')}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {t('presentation.policy1Desc')}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl transition-colors">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        {t('presentation.policy2Title')}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {t('presentation.policy2Desc')}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl transition-colors">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                        {t('presentation.policy3Title')}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {t('presentation.policy3Desc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('presentation.preparedBy')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Speaker Notes Overlay Drawer */}
        {showSpeakerNotes && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-2 font-bold mb-1 text-amber-700 dark:text-amber-300">
              <FileText size={14} />
              <span>{t('presentation.talkingPoints', { slide: currentSlide + 1 })}:</span>
            </div>
            {currentSlide === 0 && (
              <p>
                {language === 'th'
                  ? `"ท่านผู้บริหารครับ ในรอบ ${periodName} นี้ ภาพรวมการค้าชายแดนมีมูลค่ารวมทั้งสิ้น ${formatCommas(summary.total, 2)} ล้านบาท โดยเราเกินดุล/ขาดดุลอยู่ที่ ${formatCommas(summary.balance, 2)} ล้านบาท สัดส่วนหลักขับเคลื่อนโดยการส่งออก ${exportShare.toFixed(1)}% ..."`
                  : `"Distinguished executives, during ${periodName}, total bilateral trade volume reached ${formatCommas(summary.total, 2)} M THB, with a ${isSurplus ? 'trade surplus' : 'trade deficit'} of ${formatCommas(Math.abs(summary.balance), 2)} M THB, predominantly driven by exports (${exportShare.toFixed(1)}%)..."`}
              </p>
            )}
            {currentSlide === 1 && (
              <p>
                {language === 'th' ? (
                  <>
                    "เมื่อพิจารณาโครงสร้างสินค้าส่งออก สินค้าอันดับ 1 ของเราคือ{' '}
                    <strong>{topExports[0]?.name || 'ไม่ระบุ'}</strong> มูลค่า {formatCommas(topExports[0]?.value, 2)}{' '}
                    ล้านบาท โดยสินค้า 5 อันดับแรกครองส่วนแบ่งตลาดกว่าร้อยละ{' '}
                    {(
                      (topExports.slice(0, 5).reduce((acc, c) => acc + c.value, 0) / (summary.export || 1)) *
                      100
                    ).toFixed(1)}
                    ..."
                  </>
                ) : (
                  <>
                    "Looking into our export structure, the top exported commodity is{' '}
                    <strong>{topExports[0]?.name || 'N/A'}</strong> valued at {formatCommas(topExports[0]?.value, 2)}{' '}
                    M THB, with our top 5 commodities commanding a combined share of over{' '}
                    {(
                      (topExports.slice(0, 5).reduce((acc, c) => acc + c.value, 0) / (summary.export || 1)) *
                      100
                    ).toFixed(1)}
                    %..."
                  </>
                )}
              </p>
            )}
            {currentSlide === 2 && (
              <p>
                {language === 'th' ? (
                  <>
                    "ด้านการนำเข้า สินค้าหลักคือ <strong>{topImports[0]?.name || 'ไม่ระบุ'}</strong> มูลค่า{' '}
                    {formatCommas(topImports[0]?.value, 2)} ล้านบาท ซึ่งส่วนใหญ่ถูกนำมาใช้เป็นปัจจัยการผลิตและสินค้าอุปโภคบริโภค..."
                  </>
                ) : (
                  <>
                    "On the import side, key commodities were led by{' '}
                    <strong>{topImports[0]?.name || 'N/A'}</strong> valued at{' '}
                    {formatCommas(topImports[0]?.value, 2)} M THB, mainly supporting intermediate manufacturing and essential consumption..."
                  </>
                )}
              </p>
            )}
            {currentSlide === 3 && (
              <p>
                {language === 'th'
                  ? `"ในด้านการเคลื่อนย้ายผ่านแดน มีรถบรรทุกหมุนเวียนรวมกว่า ${formatCommas(logistics.truckIn + logistics.truckOut, 0)} คัน และมีมูลค่าสินค้าผ่านแดนไปยังประเทศที่สามรวม ${formatCommas(logistics.transitValueIn + logistics.transitValueOut, 2)} ล้านบาท..."`
                  : `"Cross-border transport recorded over ${formatCommas(logistics.truckIn + logistics.truckOut, 0)} freight truck movements and transit trade to third countries reached ${formatCommas(logistics.transitValueIn + logistics.transitValueOut, 2)} M THB..."`}
              </p>
            )}
            {currentSlide === 4 && (
              <p>
                {language === 'th'
                  ? `"จากแนวโน้มรายเดือนตลอดปี จะเห็นได้ว่าดุลการค้าของเรายังคงรักษาระดับได้อย่างแข็งแกร่ง และขอเสนอแนะเชิงนโยบายเพื่อเพิ่มประสิทธิภาพในการอำนวยความสะดวกทางการค้า 3 ประการดังแสดงในสไลด์ครับ"`
                  : `"Monthly trajectories throughout the year indicate resilient balance performance, and we highlight three strategic policy priorities to optimize cross-border trade facilitation as presented."`}
              </p>
            )}
          </div>
        )}

        {/* Slide Bottom Controls Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 print:hidden">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          >
            <ChevronLeft size={16} />
            <span>{t('presentation.prev')}</span>
          </button>

          {/* Slide Indicator Dots / Jumpers */}
          <div className="flex items-center gap-2">
            {slidesMetadata.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                title={t('presentation.goToSlide', { slide: idx + 1, title: s.title })}
                className={`transition-all rounded-full cursor-pointer ${
                  currentSlide === idx
                    ? 'w-8 h-2.5 bg-blue-600 dark:bg-blue-500 shadow-md shadow-blue-500/40'
                    : 'w-2.5 h-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1))}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <span>{t('presentation.next')}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
