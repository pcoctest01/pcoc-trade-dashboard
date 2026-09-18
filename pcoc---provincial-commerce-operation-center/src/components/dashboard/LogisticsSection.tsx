import React from 'react';
import { Truck, Package, Users, ArrowRightLeft } from 'lucide-react';
import { LogisticsData } from '../../types';
import { formatCommas } from '../../utils/calculations';
import { useLanguage } from '../../i18n/LanguageContext';

interface LogisticsSectionProps {
  logistics: LogisticsData;
}

export const LogisticsSection: React.FC<LogisticsSectionProps> = ({ logistics }) => {
  const { t } = useLanguage();
  const totalTransitVal = (logistics.transitValueIn || 0) + (logistics.transitValueOut || 0);
  const inValPercent = totalTransitVal > 0 ? ((logistics.transitValueIn || 0) / totalTransitVal) * 100 : 50;
  const outValPercent = totalTransitVal > 0 ? ((logistics.transitValueOut || 0) / totalTransitVal) * 100 : 50;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Vehicles & Passengers Section (Flattened, no nested cards) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Truck size={17} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  {t('logistics.title')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {t('logistics.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Metric Groups separated by subtle dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80">
            {/* Trucks */}
            <div className="py-3 sm:py-0 sm:px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                <Truck size={14} className="text-blue-500" />
                <span>{t('logistics.trucks')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">{t('logistics.inbound')}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCommas(logistics.truckIn, 0)} <span className="text-[11px] font-normal text-slate-400">{t('logistics.vehiclesUnit')}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">{t('logistics.outbound')}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCommas(logistics.truckOut, 0)} <span className="text-[11px] font-normal text-slate-400">{t('logistics.vehiclesUnit')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Transit Vehicles */}
            <div className="py-3 sm:py-0 sm:px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                <Package size={14} className="text-emerald-500" />
                <span>{t('logistics.transitVehicles')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">{t('logistics.inbound')}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCommas(logistics.transitIn, 0)} <span className="text-[11px] font-normal text-slate-400">{t('logistics.vehiclesUnit')}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">{t('logistics.outbound')}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCommas(logistics.transitOut, 0)} <span className="text-[11px] font-normal text-slate-400">{t('logistics.vehiclesUnit')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div className="py-3 sm:py-0 sm:px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                <Users size={14} className="text-purple-500" />
                <span>{t('logistics.passengers')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">{t('logistics.inbound')}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCommas(logistics.passIn, 0)} <span className="text-[11px] font-normal text-slate-400">{t('logistics.personsUnit')}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">{t('logistics.outbound')}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCommas(logistics.passOut, 0)} <span className="text-[11px] font-normal text-slate-400">{t('logistics.personsUnit')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Transit Goods Value Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-500/10 dark:bg-slate-400/10 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <ArrowRightLeft size={16} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {t('logistics.transitGoodsTitle')}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('logistics.transitGoodsSubtitle')}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {t('logistics.transitInbound')}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCommas(logistics.transitValueIn, 2)} <span className="text-slate-400 text-[11px] font-normal">{t('logistics.transitValUnit')}</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, inValPercent))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {t('logistics.transitOutbound')}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCommas(logistics.transitValueOut, 2)} <span className="text-slate-400 text-[11px] font-normal">{t('logistics.transitValUnit')}</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, outValPercent))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium">{t('logistics.totalTransitValue')}</span>
          <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-sm tabular-nums">
            {formatCommas(totalTransitVal, 2)} <span className="text-xs font-medium text-slate-400">{t('common.millionBaht')}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
