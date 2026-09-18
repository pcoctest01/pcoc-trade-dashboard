import React, { useState } from 'react';
import { X, Copy, Check, Code2, Table, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface GasScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_GAS_CODE = `/**
 * PCOC (Provincial Commerce Operation Center) - Google Apps Script Backend (Code.gs)
 * ศูนย์ข้อมูลเศรษฐกิจการค้าจังหวัด
 * Version: 2.0.0
 */

const SHEET_NAMES = {
  SUMMARY: 'Summary',
  EXPORTS: 'Exports',
  IMPORTS: 'Imports'
};

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {};
    
    // 1. Read Summary & Logistics
    const sumSheet = ss.getSheetByName(SHEET_NAMES.SUMMARY);
    if (sumSheet && sumSheet.getLastRow() > 1) {
      const sumData = sumSheet.getDataRange().getValues();
      for (let i = 1; i < sumData.length; i++) {
        const row = sumData[i];
        const period = String(row[0]).trim();
        if (!period) continue;
        
        result[period] = {
          period: period,
          periodName: formatThaiPeriod(period),
          summary: {
            export: Number(row[1]) || 0,
            import: Number(row[2]) || 0,
            total: Number(row[3]) || 0,
            balance: Number(row[4]) || 0
          },
          logistics: {
            truckIn: Number(row[5]) || 0,
            truckOut: Number(row[6]) || 0,
            transitIn: Number(row[7]) || 0,
            transitOut: Number(row[8]) || 0,
            passIn: Number(row[9]) || 0,
            passOut: Number(row[10]) || 0,
            transitValueIn: Number(row[11]) || 0,
            transitValueOut: Number(row[12]) || 0
          },
          exports: [],
          imports: []
        };
      }
    }
    
    // 2. Read Exports
    const expSheet = ss.getSheetByName(SHEET_NAMES.EXPORTS);
    if (expSheet && expSheet.getLastRow() > 1) {
      const expData = expSheet.getDataRange().getValues();
      for (let i = 1; i < expData.length; i++) {
        const row = expData[i];
        const period = String(row[0]).trim();
        if (result[period]) {
          result[period].exports.push({
            id: Number(row[1]) || result[period].exports.length + 1,
            hsCode: String(row[2] || ''),
            name: String(row[3] || ''),
            qty: String(row[4] || ''),
            weight: String(row[5] || ''),
            value: Number(row[6]) || 0,
            dest: String(row[7] || 'สปป.ลาว'),
            country: String(row[7] || 'สปป.ลาว')
          });
        }
      }
    }

    // 3. Read Imports
    const impSheet = ss.getSheetByName(SHEET_NAMES.IMPORTS);
    if (impSheet && impSheet.getLastRow() > 1) {
      const impData = impSheet.getDataRange().getValues();
      for (let i = 1; i < impData.length; i++) {
        const row = impData[i];
        const period = String(row[0]).trim();
        if (result[period]) {
          result[period].imports.push({
            id: Number(row[1]) || result[period].imports.length + 1,
            hsCode: String(row[2] || ''),
            name: String(row[3] || ''),
            qty: String(row[4] || ''),
            weight: String(row[5] || ''),
            value: Number(row[6]) || 0,
            origin: String(row[7] || 'สปป.ลาว'),
            country: String(row[7] || 'สปป.ลาว')
          });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'savePeriod' || action === 'save') {
      const record = postData.record || postData;
      savePeriodRecord(ss, record);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Saved successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deletePeriod' || action === 'delete') {
      const period = postData.period;
      deletePeriodRecord(ss, period);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Deleted successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatThaiPeriod(periodStr) {
  const parts = periodStr.split('-');
  if (parts.length !== 2) return periodStr;
  const thMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const mIndex = parseInt(parts[1], 10) - 1;
  const thYear = parseInt(parts[0], 10) + 543;
  return (thMonths[mIndex] || '') + ' ' + thYear;
}
`;

export const GasScriptGuideModal: React.FC<GasScriptGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SAMPLE_GAS_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Code2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t('gasGuide.title')}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t('gasGuide.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          {/* Quick Steps */}
          <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
              <Sparkles size={16} />
              <span>{t('gasGuide.stepsTitle')}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-1">
              <li>{t('gasGuide.step1')}</li>
              <li>{t('gasGuide.step2')}</li>
              <li>{t('gasGuide.step3')}</li>
            </ol>
          </div>

          {/* Sheets Structure Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Table size={16} className="text-emerald-500" />
              <span>{t('gasGuide.tableStructure')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  1. ชีท &quot;Summary&quot;
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                  Period | Export | Import | Total | Balance | TruckIn | TruckOut | TransitIn |
                  TransitOut | PassIn | PassOut | TransitValIn | TransitValOut
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  2. ชีท &quot;Exports&quot;
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                  Period | Rank | HSCode | ItemName | Qty | Weight | Value | Destination
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  3. ชีท &quot;Imports&quot;
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                  Period | Rank | HSCode | ItemName | Qty | Weight | Value | Origin
                </p>
              </div>
            </div>
          </div>

          {/* Code Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Code2 size={16} className="text-blue-500" />
                <span>{t('gasGuide.codeSection')}</span>
              </h4>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors font-semibold cursor-pointer"
              >
                {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{isCopied ? t('gasGuide.copied') : t('gasGuide.copyCode')}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto font-mono text-[11px] leading-relaxed max-h-96 custom-scrollbar border border-slate-800">
              <code>{SAMPLE_GAS_CODE}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            {t('gasGuide.closeModal')}
          </button>
        </div>
      </div>
    </div>
  );
};
