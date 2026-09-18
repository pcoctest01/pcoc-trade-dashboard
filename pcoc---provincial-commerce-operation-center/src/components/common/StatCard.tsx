import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCommas, safeNum } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';

interface StatCardProps {
  id?: string;
  title: string;
  value: number;
  change?: number | null; // MoM %
  mom?: number | null;
  yoyChange?: number | null; // YoY %
  yoy?: number | null;
  icon: LucideIcon | React.ReactNode;
  color: 'blue' | 'red' | 'green' | 'amber' | 'slate' | string;
  showMom?: boolean;
  unit?: string;
  subtext?: string;
}

const ACCENT_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-400/10',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/20',
  },
  red: {
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    text: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-rose-500/20',
  },
  green: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20',
  },
  slate: {
    bg: 'bg-slate-500/10 dark:bg-slate-400/10',
    text: 'text-slate-700 dark:text-slate-300',
    ring: 'ring-slate-500/20',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  change,
  mom,
  yoyChange,
  yoy,
  icon,
  color,
  showMom = true,
  unit,
  subtext,
}) => {
  const { t } = useLanguage();
  const safeValue = safeNum(value);
  const effectiveMom = mom !== undefined ? mom : change;
  const effectiveYoy = yoy !== undefined ? yoy : yoyChange;
  const effectiveUnit = unit || t('stats.unitMillionThb');

  const style = ACCENT_STYLES[color] || ACCENT_STYLES.blue;

  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>, {
        'aria-hidden': true,
      });
    }
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent size={18} strokeWidth={2.2} aria-hidden={true} className="shrink-0" />;
    }
    if (icon && typeof icon === 'object' && 'render' in (icon as unknown as Record<string, unknown>)) {
      const IconComponent = icon as unknown as React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; 'aria-hidden'?: boolean }>;
      return <IconComponent size={18} strokeWidth={2.2} aria-hidden={true} className="shrink-0" />;
    }
    return null;
  };

  const renderDelta = (val: number | null | undefined, label: string) => {
    if (val === undefined || val === null || Number.isNaN(val)) return null;

    const isPositive = val > 0;
    const isNegative = val < 0;
    const isNeutral = val === 0;

    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
          {label}
        </span>
        <div
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums transition-colors ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
              : isNegative
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {isPositive ? (
            <TrendingUp size={11} strokeWidth={2.5} />
          ) : isNegative ? (
            <TrendingDown size={11} strokeWidth={2.5} />
          ) : (
            <Minus size={11} strokeWidth={2.5} />
          )}
          <span>{Math.abs(val).toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div
      id={id}
      className="stat-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            {title}
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}
          >
            {renderIcon()}
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-mono tabular-nums">
              {formatCommas(safeValue, 2)}
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {effectiveUnit}
            </span>
          </div>
          {subtext && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
              {subtext}
            </p>
          )}
        </div>
      </div>

      {/* Comparisons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 print:hidden">
        {showMom && renderDelta(effectiveMom, t('stats.growthMom'))}
        {renderDelta(effectiveYoy, t('stats.growthYoy'))}
      </div>
    </div>
  );
};
