import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 py-6 px-4 sm:px-6 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400" />
          <span>{t('app.footerTitle')}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
          <span>{t('app.footerSubtitle')}</span>
          <span>•</span>
          <span>{t('app.footerTech')}</span>
        </div>
      </div>
    </footer>
  );
};
