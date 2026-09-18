import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Database,
  FilterMode,
  DateRange,
  ThemeMode,
  ToastMessage,
  DialogState,
  PeriodRecord,
  TradeItem,
} from './types';
import { INITIAL_DATABASE } from './utils/initialData';
import {
  formatPeriodName,
  safeNum,
  round6,
  calculateGrowth,
  isFiscalYear,
  mergeCountries,
  MONTH_OPTIONS,
} from './utils/calculations';
import {
  fetchDatabase,
  savePeriod,
  deletePeriod,
  isAdminLoggedIn,
  setAdminLoggedIn,
  logoutAdmin,
} from './services/gasApi';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { ProductAnalytics } from './components/analytics/ProductAnalytics';
import { DataCenterModal } from './components/datacenter/DataCenterModal';
import { AdminLoginModal } from './components/datacenter/AdminLoginModal';
import { ApiSettingsModal } from './components/datacenter/ApiSettingsModal';
import { GasScriptGuideModal } from './components/datacenter/GasScriptGuideModal';
import { PresentationModal } from './components/presentation/PresentationModal';
import { CustomDialog } from './components/common/CustomDialog';
import { Toast } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  // 1. Data & Network State
  const [db, setDb] = useState<Database>(INITIAL_DATABASE);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'local' | 'loading' | 'error'>('loading');

  // 2. Navigation & Theme
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'analytics'>('dashboard');
  const { theme, setTheme, isDark } = useTheme();
  const { formatPeriodDisplayName, language } = useLanguage();

  // 3. Admin Auth & Modals
  const [isAdmin, setIsAdmin] = useState(isAdminLoggedIn());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDataCenterOpen, setIsDataCenterOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isGasGuideOpen, setIsGasGuideOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // 4. Notifications & Dialogs
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dialog, setDialog] = useState<DialogState>({ isOpen: false, type: 'info', title: '', message: '' });

  // 5. Global Dashboard Filters
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-09');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '2024-01', end: '2024-09' });

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load Database from GAS or Local Cache
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setConnectionStatus('loading');
    try {
      const data = await fetchDatabase();
      if (Object.keys(data).length > 0) {
        setDb(data);
        const sortedPeriods = Object.keys(data).filter((p) => /^\d{4}-\d{2}$/.test(p)).sort();
        if (sortedPeriods.length > 0) {
          const latest = sortedPeriods[sortedPeriods.length - 1];
          setSelectedMonth(latest);
          setSelectedYear(latest.split('-')[0]);
          setDateRange({
            start: sortedPeriods[0],
            end: latest,
          });
        }
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('local');
      }
    } catch {
      setConnectionStatus('local');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -------------------------------------------------------------
  // Dynamic Calculation Engine based on active filterMode
  // -------------------------------------------------------------
  const {
    activePeriods,
    periodName,
    periodSubtext,
    summary,
    mom,
    yoy,
    logistics,
    topExports,
    topImports,
    chartData,
  } = useMemo(() => {
    const allPeriods = Object.keys(db || {}).filter((p) => /^\d{4}-\d{2}$/.test(p)).sort();
    let currentPeriodList: string[] = [];
    let pName = '';
    let pSubtext: string | undefined = undefined;

    if (filterMode === 'month') {
      currentPeriodList = selectedMonth ? [selectedMonth] : [];
    } else if (filterMode === 'calendar_year') {
      currentPeriodList = allPeriods.filter((p) => p.startsWith(selectedYear));
    } else if (filterMode === 'year') {
      const targetYear = parseInt(selectedYear, 10);
      currentPeriodList = allPeriods.filter((p) => isFiscalYear(p, targetYear));
    } else if (filterMode === 'range') {
      const actualStart = dateRange.start <= dateRange.end ? dateRange.start : dateRange.end;
      const actualEnd = dateRange.start <= dateRange.end ? dateRange.end : dateRange.start;
      currentPeriodList = allPeriods.filter((p) => p >= actualStart && p <= actualEnd);
    }

    const { name: localizedName, subtext: localizedSubtext } = formatPeriodDisplayName(
      filterMode,
      selectedMonth,
      selectedYear,
      dateRange,
      allPeriods
    );
    pName = localizedName;
    pSubtext = localizedSubtext;

    // 1. Accumulate summary & logistics for active periods
    let sumExport = 0;
    let sumImport = 0;
    const logAcc = {
      truckIn: 0,
      truckOut: 0,
      transitIn: 0,
      transitOut: 0,
      passIn: 0,
      passOut: 0,
      transitValueIn: 0,
      transitValueOut: 0,
    };

    // Product accumulation maps
    const exportMap: Record<string, TradeItem> = {};
    const importMap: Record<string, TradeItem> = {};

    currentPeriodList.forEach((period) => {
      const rec = db[period];
      if (!rec) return;

      const expVal = safeNum(rec.summary?.export);
      const impVal = safeNum(rec.summary?.import);
      sumExport = round6(sumExport + expVal);
      sumImport = round6(sumImport + impVal);

      // Logistics
      logAcc.truckIn += safeNum(rec.logistics?.truckIn);
      logAcc.truckOut += safeNum(rec.logistics?.truckOut);
      logAcc.transitIn += safeNum(rec.logistics?.transitIn);
      logAcc.transitOut += safeNum(rec.logistics?.transitOut);
      logAcc.passIn += safeNum(rec.logistics?.passIn);
      logAcc.passOut += safeNum(rec.logistics?.passOut);
      logAcc.transitValueIn = round6(logAcc.transitValueIn + safeNum(rec.logistics?.transitValueIn));
      logAcc.transitValueOut = round6(logAcc.transitValueOut + safeNum(rec.logistics?.transitValueOut));

      // Product items
      (rec.exports || []).forEach((item) => {
        const key = item.hsCode?.trim() || item.name?.trim() || 'unknown';
        if (!exportMap[key]) {
          exportMap[key] = { ...item, value: 0, country: '' };
        }
        exportMap[key].value = round6(exportMap[key].value + safeNum(item.value));
        exportMap[key].country = mergeCountries(exportMap[key].country, item.dest || item.country);
      });

      (rec.imports || []).forEach((item) => {
        const key = item.hsCode?.trim() || item.name?.trim() || 'unknown';
        if (!importMap[key]) {
          importMap[key] = { ...item, value: 0, country: '' };
        }
        importMap[key].value = round6(importMap[key].value + safeNum(item.value));
        importMap[key].country = mergeCountries(importMap[key].country, item.origin || item.country);
      });
    });

    const sumTotal = round6(sumExport + sumImport);
    const sumBalance = round6(sumExport - sumImport);

    // 2. Calculate Growth: MoM & YoY
    let momGrowth = { export: null as number | null, import: null as number | null, total: null as number | null, balance: null as number | null };
    let yoyGrowth = { export: null as number | null, import: null as number | null, total: null as number | null, balance: null as number | null };

    if (filterMode === 'month' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      // Prior month
      let prevM = m - 1;
      let prevY = y;
      if (prevM === 0) {
        prevM = 12;
        prevY -= 1;
      }
      const prevPeriod = `${prevY}-${String(prevM).padStart(2, '0')}`;
      const prevRec = db[prevPeriod];
      if (prevRec) {
        momGrowth = {
          export: calculateGrowth(sumExport, prevRec.summary?.export),
          import: calculateGrowth(sumImport, prevRec.summary?.import),
          total: calculateGrowth(sumTotal, prevRec.summary?.total),
          balance: calculateGrowth(sumBalance, prevRec.summary?.balance),
        };
      }

      // Prior year same month
      const yoyPeriod = `${y - 1}-${String(m).padStart(2, '0')}`;
      const yoyRec = db[yoyPeriod];
      if (yoyRec) {
        yoyGrowth = {
          export: calculateGrowth(sumExport, yoyRec.summary?.export),
          import: calculateGrowth(sumImport, yoyRec.summary?.import),
          total: calculateGrowth(sumTotal, yoyRec.summary?.total),
          balance: calculateGrowth(sumBalance, yoyRec.summary?.balance),
        };
      }
    } else if (filterMode === 'calendar_year' || filterMode === 'year') {
      // Annual YoY Comparison vs previous full year
      const currentYearNum = parseInt(selectedYear, 10);
      const prevYearNum = currentYearNum - 1;
      const prevPeriods = allPeriods.filter((p) =>
        filterMode === 'calendar_year'
          ? p.startsWith(String(prevYearNum))
          : isFiscalYear(p, prevYearNum)
      );

      if (prevPeriods.length > 0) {
        let prevExport = 0;
        let prevImport = 0;
        prevPeriods.forEach((p) => {
          prevExport += safeNum(db[p]?.summary?.export);
          prevImport += safeNum(db[p]?.summary?.import);
        });
        const prevTotal = round6(prevExport + prevImport);
        const prevBalance = round6(prevExport - prevImport);

        yoyGrowth = {
          export: calculateGrowth(sumExport, prevExport),
          import: calculateGrowth(sumImport, prevImport),
          total: calculateGrowth(sumTotal, prevTotal),
          balance: calculateGrowth(sumBalance, prevBalance),
        };
      }
    }

    // 3. Top Products
    const sortedExports = Object.values(exportMap).sort((a, b) => b.value - a.value);
    const sortedImports = Object.values(importMap).sort((a, b) => b.value - a.value);

    // 4. Trend Chart Data (Show 12 most recent periods or selected range)
    const targetChartPeriods =
      filterMode === 'month'
        ? allPeriods.slice(-12)
        : currentPeriodList.length > 0
        ? currentPeriodList
        : allPeriods.slice(-12);

    const cData = targetChartPeriods.map((period) => {
      const rec = db[period];
      const [y, m] = period.split('-');
      const thShortYear = (parseInt(y, 10) + 543).toString().slice(-2);
      const label = `${m}/${thShortYear}`;

      const exp = round6(safeNum(rec?.summary?.export));
      const imp = round6(safeNum(rec?.summary?.import));
      return {
        period,
        label,
        export: exp,
        import: imp,
        total: round6(exp + imp),
        balance: round6(exp - imp),
      };
    });

    return {
      activePeriods: currentPeriodList,
      periodName: pName,
      periodSubtext: pSubtext,
      summary: {
        export: sumExport,
        import: sumImport,
        total: sumTotal,
        balance: sumBalance,
      },
      mom: momGrowth,
      yoy: yoyGrowth,
      logistics: logAcc,
      topExports: sortedExports,
      topImports: sortedImports,
      chartData: cData,
    };
  }, [db, filterMode, selectedMonth, selectedYear, dateRange, formatPeriodDisplayName, language]);

  // -------------------------------------------------------------
  // Data Center CRUD Operations
  // -------------------------------------------------------------
  const handleSavePeriod = async (record: PeriodRecord) => {
    try {
      await savePeriod(record);
      setDb((prev) => ({
        ...prev,
        [record.period]: record,
      }));
      showToast(`บันทึกข้อมูลรอบเดือน ${record.periodName} เรียบร้อยแล้ว`, 'success');
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  };

  const handleDeletePeriod = (period: string) => {
    const pName = db[period]?.periodName || period;
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการลบข้อมูลถาวร',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลรอบเดือน "${pName}" อย่างถาวร?\nข้อมูลใน Google Sheets และในระบบจะถูกลบและไม่สามารถกู้คืนได้`,
      onConfirm: async () => {
        try {
          await deletePeriod(period);
          setDb((prev) => {
            const next = { ...prev };
            delete next[period];
            return next;
          });
          showToast(`ลบข้อมูลรอบเดือน ${pName} เรียบร้อยแล้ว`, 'success');
        } catch {
          showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error');
        }
      },
    });
  };

  // -------------------------------------------------------------
  // Export Data Engine (XLSX & CSV)
  // -------------------------------------------------------------
  const handleExportData = (format: 'xlsx' | 'csv') => {
    try {
      const summaryRows = activePeriods.map((p) => {
        const r = db[p];
        return {
          'รอบเดือน': r?.periodName || p,
          'ส่งออก (ล้านบาท)': r?.summary?.export || 0,
          'นำเข้า (ล้านบาท)': r?.summary?.import || 0,
          'มูลค่ารวม (ล้านบาท)': r?.summary?.total || 0,
          'ดุลการค้า (ล้านบาท)': r?.summary?.balance || 0,
          'รถบรรทุกเข้า (คัน)': r?.logistics?.truckIn || 0,
          'รถบรรทุกออก (คัน)': r?.logistics?.truckOut || 0,
          'รถผ่านแดนเข้า (คัน)': r?.logistics?.transitIn || 0,
          'รถผ่านแดนออก (คัน)': r?.logistics?.transitOut || 0,
          'ผู้โดยสารเข้า (ราย)': r?.logistics?.passIn || 0,
          'ผู้โดยสารออก (ราย)': r?.logistics?.passOut || 0,
          'มูลค่าผ่านแดนเข้า (ล้านบาท)': r?.logistics?.transitValueIn || 0,
          'มูลค่าผ่านแดนออก (ล้านบาท)': r?.logistics?.transitValueOut || 0,
        };
      });

      const exportProductRows = topExports.map((item, idx) => ({
        'อันดับ': idx + 1,
        'พิกัด HS': item.hsCode || '-',
        'รายการสินค้าส่งออก': item.name,
        'มูลค่ารวม (ล้านบาท)': item.value,
        'ประเทศปลายทาง': item.country || item.dest || '-',
      }));

      const importProductRows = topImports.map((item, idx) => ({
        'อันดับ': idx + 1,
        'พิกัด HS': item.hsCode || '-',
        'รายการสินค้านำเข้า': item.name,
        'มูลค่ารวม (ล้านบาท)': item.value,
        'ประเทศต้นทาง': item.country || item.origin || '-',
      }));

      const wb = XLSX.utils.book_new();

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const wsExports = XLSX.utils.json_to_sheet(exportProductRows);
      XLSX.utils.book_append_sheet(wb, wsExports, 'Top Exports');

      const wsImports = XLSX.utils.json_to_sheet(importProductRows);
      XLSX.utils.book_append_sheet(wb, wsImports, 'Top Imports');

      const fileName = `PCOC_Trade_Report_${selectedMonth || 'Data'}.${format}`;

      if (format === 'xlsx') {
        XLSX.writeFile(wb, fileName);
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(wsSummary);
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      }

      showToast(`ส่งออกไฟล์ ${format.toUpperCase()} สำเร็จแล้ว`, 'success');
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการส่งออกไฟล์', 'error');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        {/* Header */}
        <Header
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          theme={theme}
          setTheme={setTheme}
          isAdmin={isAdmin}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={() => {
            logoutAdmin();
            setIsAdmin(false);
            showToast('ออกจากระบบผู้ดูแลข้อมูลแล้ว', 'info');
          }}
          onOpenDataCenter={() => setIsDataCenterOpen(true)}
          onOpenApiSettings={() => setIsApiSettingsOpen(true)}
          onOpenGasGuide={() => setIsGasGuideOpen(true)}
          onOpenPresentation={() => setIsPresentationOpen(true)}
          onExport={handleExportData}
          connectionStatus={connectionStatus}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6 pb-24 sm:pb-12">
          {currentPage === 'dashboard' ? (
            <OverviewDashboard
              db={db}
              isLoading={isLoading}
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
              summary={summary}
              mom={mom}
              yoy={yoy}
              logistics={logistics}
              topExports={topExports}
              topImports={topImports}
              chartData={chartData}
              isDark={isDark}
              onSelectProduct={() => {
                setCurrentPage('analytics');
              }}
              onOpenPresentation={() => setIsPresentationOpen(true)}
            />
          ) : (
            <ProductAnalytics db={db} isDark={isDark} />
          )}
        </main>

        {/* Mobile Tab Bar (iOS Style) */}
        <MobileTabBar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          isAdmin={isAdmin}
          onOpenDataCenter={() => setIsDataCenterOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenPresentation={() => setIsPresentationOpen(true)}
          onExport={() => handleExportData('xlsx')}
        />

        {/* Footer */}
        <Footer />

        {/* Executive Presentation Deck */}
        <PresentationModal
          isOpen={isPresentationOpen}
          onClose={() => setIsPresentationOpen(false)}
          db={db}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          periodName={periodName}
          periodSubtext={periodSubtext}
          summary={summary}
          mom={mom}
          yoy={yoy}
          logistics={logistics}
          topExports={topExports}
          topImports={topImports}
          chartData={chartData}
          isDark={isDark}
        />

        {/* Global Modals & Dialogs */}
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={() => {
            setAdminLoggedIn(true);
            setIsAdmin(true);
            showToast('เข้าสู่ระบบผู้ดูแลข้อมูลสำเร็จ', 'success');
            setIsDataCenterOpen(true);
          }}
        />

        <DataCenterModal
          isOpen={isDataCenterOpen}
          onClose={() => setIsDataCenterOpen(false)}
          db={db}
          onSave={handleSavePeriod}
          onDelete={handleDeletePeriod}
          initialPeriod={selectedMonth}
        />

        <ApiSettingsModal
          isOpen={isApiSettingsOpen}
          onClose={() => setIsApiSettingsOpen(false)}
          onSaved={() => {
            showToast('ปรับปรุงการตั้งค่า API แล้ว กำลังโหลดข้อมูล...', 'info');
            loadData();
          }}
        />

        <GasScriptGuideModal
          isOpen={isGasGuideOpen}
          onClose={() => setIsGasGuideOpen(false)}
        />

        <CustomDialog
          dialog={dialog}
          onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
        />

        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ErrorBoundary>
  );
}
