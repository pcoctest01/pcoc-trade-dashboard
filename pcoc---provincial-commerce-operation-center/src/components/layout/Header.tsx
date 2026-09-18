import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Download,
  FileSpreadsheet,
  Printer,
  Lock,
  LogOut,
  Menu,
  X,
  Database,
  Code2,
  Settings,
  ChevronDown,
  Presentation,
} from 'lucide-react';
import { ThemeMode } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface HeaderProps {
  currentPage: 'dashboard' | 'analytics';
  setCurrentPage: (page: 'dashboard' | 'analytics') => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenDataCenter: () => void;
  onOpenApiSettings: () => void;
  onOpenGasGuide: () => void;
  onOpenPresentation: () => void;
  onExport: (format: 'xlsx' | 'csv') => void;
  connectionStatus: 'connected' | 'local' | 'loading' | 'error';
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  theme,
  setTheme,
  isAdmin,
  onOpenLogin,
  onLogout,
  onOpenDataCenter,
  onOpenApiSettings,
  onOpenGasGuide,
  onOpenPresentation,
  onExport,
  connectionStatus,
}) => {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            onClick={() => setCurrentPage('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
              <Globe size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {t('app.shortTitle')}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400 px-1.5 py-0.5 rounded-sm border border-blue-200/60 dark:border-blue-900/40 hidden sm:inline-block">
                  Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden lg:block truncate max-w-[320px]">
                {t('app.subtitle')}
              </p>
            </div>
          </div>

          {/* Desktop Nav (Apple Segmented Style) */}
          <nav
            role="tablist"
            aria-label={t('nav.overviewNav')}
            className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            <button
              role="tab"
              aria-selected={currentPage === 'dashboard'}
              onClick={() => setCurrentPage('dashboard')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentPage === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('nav.overview')}
            </button>
            <button
              role="tab"
              aria-selected={currentPage === 'analytics'}
              onClick={() => setCurrentPage('analytics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentPage === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t('nav.analytics')}
            </button>
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection Status Pill */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50"
            title={
              connectionStatus === 'connected'
                ? t('nav.connected')
                : connectionStatus === 'loading'
                ? t('nav.connecting')
                : t('nav.localCache')
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : connectionStatus === 'loading'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-blue-400'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
              {connectionStatus === 'connected'
                ? t('nav.connected')
                : connectionStatus === 'loading'
                ? t('nav.connecting')
                : t('nav.localCache')}
            </span>
          </div>

          {/* Bilingual Language Switcher (Segmented Control) */}
          <LanguageSwitcher variant="segmented" className="hidden sm:inline-flex" />

          {/* Presentation Mode Button */}
          <button
            onClick={onOpenPresentation}
            aria-label={t('filter.openPresentationTooltip')}
            title={t('filter.openPresentationTooltip')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/90 dark:border-blue-800/80 bg-blue-50/80 dark:bg-blue-950/50 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100/90 dark:hover:bg-blue-900/60 transition-colors active:scale-95 shadow-xs"
          >
            <Presentation size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">{t('filter.openPresentation')}</span>
          </button>

          {/* Export Menu */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              aria-label={t('nav.export')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors active:scale-95"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{t('nav.export')}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExport('xlsx');
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-2.5 transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t('nav.exportExcel')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExport('csv');
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-2.5 transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>{t('nav.exportCsv')}</span>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700/60 my-1"></div>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    setTimeout(() => window.print(), 250);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-2.5 transition-colors"
                >
                  <Printer size={15} className="text-slate-500" />
                  <span>{t('nav.printReport')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <ThemeSwitcher variant="dropdown" />

          {/* Admin Tools */}
          {isAdmin ? (
            <div className="relative" ref={adminRef}>
              <button
                onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
              >
                <Database size={14} />
                <span className="hidden sm:inline">{t('nav.datacenter')}</span>
                <ChevronDown size={12} className="text-white/80" />
              </button>

              {isAdminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setIsAdminDropdownOpen(false);
                      onOpenDataCenter();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-2.5"
                  >
                    <Database size={15} className="text-emerald-600" />
                    <span>{t('datacenter.title')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminDropdownOpen(false);
                      onOpenApiSettings();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-2.5"
                  >
                    <Settings size={15} className="text-blue-600" />
                    <span>{t('apiSettings.title')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAdminDropdownOpen(false);
                      onOpenGasGuide();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 flex items-center gap-2.5"
                  >
                    <Code2 size={15} className="text-amber-600" />
                    <span>{t('gasGuide.title')}</span>
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-700/60 my-1"></div>
                  <button
                    onClick={() => {
                      setIsAdminDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5"
                  >
                    <LogOut size={15} />
                    <span>{t('nav.logoutAdmin')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
            >
              <Lock size={13} />
              <span className="hidden sm:inline">{t('nav.admin')}</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('common.close') : 'Menu'}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top duration-150">
          {/* Mobile Language Switcher */}
          <LanguageSwitcher variant="menu" className="pb-1" />

          {/* Mobile Theme Switcher */}
          <ThemeSwitcher variant="menu" className="pb-1" />

          <button
            onClick={() => {
              setCurrentPage('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {t('nav.overviewNav')}
          </button>
          <button
            onClick={() => {
              setCurrentPage('analytics');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              currentPage === 'analytics'
                ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {t('nav.analyticsNav')}
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenPresentation();
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/60 flex items-center gap-2 border border-blue-200/50 dark:border-blue-900/50"
          >
            <Presentation size={15} />
            <span>{t('filter.openPresentationTooltip')}</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDataCenter();
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40"
            >
              {t('datacenter.title')}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
