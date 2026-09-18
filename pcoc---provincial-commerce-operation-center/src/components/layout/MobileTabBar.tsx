import React from 'react';
import { LayoutDashboard, TrendingUp, Presentation, Database, Download } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface MobileTabBarProps {
  currentPage: 'dashboard' | 'analytics';
  setCurrentPage: (page: 'dashboard' | 'analytics') => void;
  isAdmin: boolean;
  onOpenDataCenter: () => void;
  onOpenLogin: () => void;
  onOpenPresentation: () => void;
  onExport: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentPage,
  setCurrentPage,
  isAdmin,
  onOpenDataCenter,
  onOpenLogin,
  onOpenPresentation,
  onExport,
}) => {
  const { t } = useLanguage();

  return (
    <nav
      aria-label={t('nav.overviewNav')}
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-t border-slate-200/70 dark:border-slate-800/80 px-2 py-1 print:hidden"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentPage === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard size={19} strokeWidth={currentPage === 'dashboard' ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.overview')}</span>
        </button>

        {/* Tab 2: Analytics */}
        <button
          onClick={() => setCurrentPage('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentPage === 'analytics'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={19} strokeWidth={currentPage === 'analytics' ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.analytics')}</span>
        </button>

        {/* Tab 3: Presentation */}
        <button
          onClick={onOpenPresentation}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-all font-medium"
        >
          <Presentation size={19} strokeWidth={2.2} />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.presentation')}</span>
        </button>

        {/* Tab 4: Data Center / Admin */}
        <button
          onClick={() => (isAdmin ? onOpenDataCenter() : onOpenLogin())}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-all"
        >
          <Database size={19} strokeWidth={2} className={isAdmin ? 'text-emerald-500' : ''} />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{isAdmin ? t('nav.datacenter') : t('nav.admin')}</span>
        </button>

        {/* Tab 5: Export */}
        <button
          onClick={onExport}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 transition-all"
        >
          <Download size={19} strokeWidth={2} />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.export')}</span>
        </button>
      </div>
    </nav>
  );
};
