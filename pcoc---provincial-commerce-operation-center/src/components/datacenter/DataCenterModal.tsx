import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Database as DatabaseIcon,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  DollarSign,
  Truck,
  ArrowRightLeft,
} from 'lucide-react';
import { Database, PeriodRecord, ImportError, TradeItem } from '../../types';
import {
  MONTH_OPTIONS,
  formatCommas,
  safeNum,
  round6,
  getEmptyForm,
  formatPeriodName,
} from '../../utils/calculations';
import { processExcelFiles, detectPeriodFromFilename } from '../../utils/excelParser';
import { CommaInput } from '../common/CommaInput';

interface DataCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: Database;
  onSave: (record: PeriodRecord) => Promise<void>;
  onDelete: (period: string) => void;
  initialPeriod?: string;
}

export const DataCenterModal: React.FC<DataCenterModalProps> = ({
  isOpen,
  onClose,
  db,
  onSave,
  onDelete,
  initialPeriod,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    initialPeriod || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  const [activeTab, setActiveTab] = useState<'logistics' | 'exports' | 'imports' | 'history'>('logistics');
  const [formData, setFormData] = useState<PeriodRecord>(() => {
    const p = initialPeriod || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    return db[p] ? JSON.parse(JSON.stringify(db[p])) : getEmptyForm(p);
  });

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreSaveSummary, setShowPreSaveSummary] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or initialPeriod/db updates
  useEffect(() => {
    if (isOpen) {
      const p = initialPeriod || selectedPeriod || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      setSelectedPeriod(p);
      setFormData(db[p] ? JSON.parse(JSON.stringify(db[p])) : getEmptyForm(p));
      setImportErrors([]);
      setImportSuccess(false);
      setValidationWarning(null);
    }
  }, [isOpen, initialPeriod]);

  // When Period changes in modal
  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    setFormData(db[newPeriod] ? JSON.parse(JSON.stringify(db[newPeriod])) : getEmptyForm(newPeriod));
    setImportErrors([]);
    setImportSuccess(false);
    setValidationWarning(null);
  };

  // Load existing period for editing
  const handleEditHistory = (period: string) => {
    setSelectedPeriod(period);
    setFormData(db[period] ? JSON.parse(JSON.stringify(db[period])) : getEmptyForm(period));
    setActiveTab('logistics');
    setImportErrors([]);
    setImportSuccess(false);
    setValidationWarning(null);
  };

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    setImportErrors([]);
    setImportSuccess(false);
    setValidationWarning(null);

    try {
      // Check if period can be auto-detected from filename
      const detected = detectPeriodFromFilename(files[0].name);
      const targetPeriod = detected || selectedPeriod;
      if (detected && detected !== selectedPeriod) {
        setSelectedPeriod(detected);
      }

      const parsed = await processExcelFiles(files, targetPeriod);
      const updated: PeriodRecord = {
        ...formData,
        period: targetPeriod,
        periodName: formatPeriodName(targetPeriod),
        summary: { ...formData.summary },
        logistics: { ...formData.logistics },
        exports: [...formData.exports],
        imports: [...formData.imports],
      };

      if (parsed.exports && parsed.exports.length > 0) {
        updated.exports = parsed.exports;
        if (parsed.summary?.export !== undefined) {
          updated.summary.export = parsed.summary.export;
        }
      }

      if (parsed.imports && parsed.imports.length > 0) {
        updated.imports = parsed.imports;
        if (parsed.summary?.import !== undefined) {
          updated.summary.import = parsed.summary.import;
        }
      }

      if (parsed.logistics) {
        updated.logistics = {
          ...updated.logistics,
          ...parsed.logistics,
        };
      }

      setFormData(updated);

      if (parsed.errors.length > 0) {
        setImportErrors(parsed.errors);
      } else {
        setImportSuccess(true);
      }
      setActiveTab('logistics');
    } catch {
      setImportErrors([
        { sheet: 'System', row: '-', message: 'ไฟล์เสียหายหรือไม่สามารถประมวลผลได้' },
      ]);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Array changes for Export / Import
  const handleItemChange = (
    type: 'exports' | 'imports',
    index: number,
    field: keyof TradeItem,
    value: unknown
  ) => {
    const list = [...formData[type]];
    list[index] = {
      ...list[index],
      [field]: field === 'value' ? Number(value) : value,
    };
    setFormData((prev) => ({ ...prev, [type]: list }));
  };

  const handleAddItem = (type: 'exports' | 'imports') => {
    const list = [...formData[type]];
    const newItem: TradeItem = {
      id: list.length + 1,
      hsCode: '',
      name: '',
      qty: '',
      weight: '',
      value: 0,
      ...(type === 'exports' ? { dest: 'สปป.ลาว' } : { origin: 'สปป.ลาว' }),
    };
    setFormData((prev) => ({ ...prev, [type]: [...list, newItem] }));
  };

  const handleRemoveItem = (type: 'exports' | 'imports', index: number) => {
    const list = [...formData[type]];
    list.splice(index, 1);
    list.forEach((item, idx) => {
      item.id = idx + 1;
    });
    setFormData((prev) => ({ ...prev, [type]: list }));
  };

  // Prepare Save & Validate
  const handleTriggerSave = () => {
    setValidationWarning(null);
    // Check validation: values cannot be negative
    const totalExpVal =
      safeNum(formData.summary.export) ||
      formData.exports.reduce((sum, it) => sum + safeNum(it.value), 0);
    const totalImpVal =
      safeNum(formData.summary.import) ||
      formData.imports.reduce((sum, it) => sum + safeNum(it.value), 0);

    if (totalExpVal < 0 || totalImpVal < 0) {
      setValidationWarning('มูลค่าการค้าต้องมากกว่าหรือเท่ากับ 0');
      return;
    }

    setShowPreSaveSummary(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const expSum =
        safeNum(formData.summary.export) ||
        formData.exports.reduce((sum, it) => sum + safeNum(it.value), 0);
      const impSum =
        safeNum(formData.summary.import) ||
        formData.imports.reduce((sum, it) => sum + safeNum(it.value), 0);

      const totalExp = round6(expSum);
      const totalImp = round6(impSum);

      const cleanList = (arr: TradeItem[], type: 'exports' | 'imports') =>
        arr
          .filter((it) => it.name?.trim())
          .map((it, idx) => ({
            ...it,
            id: idx + 1,
            value: round6(safeNum(it.value)),
            country: type === 'exports' ? it.dest : it.origin,
          }));

      const finalRecord: PeriodRecord = {
        period: selectedPeriod,
        periodName: formData.periodName,
        summary: {
          export: totalExp,
          import: totalImp,
          total: round6(totalExp + totalImp),
          balance: round6(totalExp - totalImp),
        },
        logistics: {
          ...formData.logistics,
          transitValueIn: round6(safeNum(formData.logistics.transitValueIn)),
          transitValueOut: round6(safeNum(formData.logistics.transitValueOut)),
        },
        exports: cleanList(formData.exports, 'exports'),
        imports: cleanList(formData.imports, 'imports'),
      };

      await onSave(finalRecord);
      setShowPreSaveSummary(false);
      onClose();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DatabaseIcon size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
                ศูนย์กลางจัดการข้อมูล (Data Center)
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                บันทึก ปรับปรุง และนำเข้าข้อมูลการค้าชายแดนจาก Excel ลง Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                รอบเดือน:
              </span>
              <select
                disabled={isSaving}
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer [&>option]:dark:bg-slate-800"
              >
                {MONTH_OPTIONS.map((opt) => (
                  <option key={`modal-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Smart Excel Import Banner */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-center sm:justify-start">
              <UploadCloud size={16} className="text-blue-600 dark:text-blue-400" />
              <span>นำเข้าข้อมูลอัตโนมัติจากไฟล์ Excel / CSV (Smart Excel Parser)</span>
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              รองรับชีทรายการส่งออก นำเข้า รถยนต์ผ่านแดน และสินค้าผ่านแดนตามแบบฟอร์มศุลกากร
            </p>
          </div>

          <div>
            <input
              type="file"
              multiple
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile || isSaving}
              className="px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-2xs cursor-pointer flex items-center gap-2"
            >
              <UploadCloud size={15} />
              <span>{isProcessingFile ? 'กำลังอ่านไฟล์...' : 'เลือกไฟล์ Excel/CSV ที่นี่'}</span>
            </button>
          </div>
        </div>

        {/* Import Results & Errors */}
        {importErrors.length > 0 && (
          <div className="bg-rose-50/70 dark:bg-rose-950/30 px-6 py-2.5 border-b border-rose-200 dark:border-rose-900/40 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 mb-1">
              <AlertCircle size={15} />
              <span>พบข้อผิดพลาดบางรายการ ({importErrors.length} รายการ):</span>
            </div>
            <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-0.5">
              {importErrors.map((err, i) => (
                <p key={i} className="text-[11px] text-rose-600 dark:text-rose-400">
                  • ชีท: {err.sheet} | แถว: {err.row} | รายละเอียด: {err.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {importSuccess && importErrors.length === 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 px-6 py-2 border-b border-emerald-200 dark:border-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>นำเข้าข้อมูลจาก Excel สำเร็จ! กรุณาตรวจสอบแล้วกด &quot;บันทึกเข้าระบบ&quot; ด้านล่าง</span>
          </div>
        )}

        {validationWarning && (
          <div className="bg-amber-50 dark:bg-amber-950/30 px-6 py-2 border-b border-amber-200 dark:border-amber-900/40 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{validationWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationWarning(null)}
              className="text-amber-500 hover:text-amber-700 p-1 rounded-lg"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 gap-2">
          <button
            onClick={() => setActiveTab('logistics')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'logistics'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            ภาพรวม & โลจิสติกส์
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'exports'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            รายการส่งออก ({formData.exports?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('imports')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'imports'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            รายการนำเข้า ({formData.imports?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            ประวัติข้อมูลรายเดือน ({Object.keys(db).length})
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/40 dark:bg-slate-900/30">
          {/* Tab 1: Logistics & Summary */}
          {activeTab === 'logistics' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Summary Values Check */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={18} className="text-blue-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    มูลค่าการค้ารวมประจำเดือน (ล้านบาท)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      มูลค่าส่งออกรวม (ล้านบาท)
                    </label>
                    <CommaInput
                      value={formData.summary.export}
                      onChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          summary: { ...p.summary, export: Number(v) },
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      มูลค่านำเข้ารวม (ล้านบาท)
                    </label>
                    <CommaInput
                      value={formData.summary.import}
                      onChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          summary: { ...p.summary, import: Number(v) },
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Logistics Counts */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Truck size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    สถิติยานพาหนะและบุคคล (คัน/ราย)
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      รถบรรทุกเข้า (คัน)
                    </label>
                    <CommaInput
                      maxDecimals={0}
                      value={formData.logistics.truckIn}
                      onChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          logistics: { ...p.logistics, truckIn: Number(v) },
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      รถบรรทุกออก (คัน)
                    </label>
                    <CommaInput
                      maxDecimals={0}
                      value={formData.logistics.truckOut}
                      onChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          logistics: { ...p.logistics, truckOut: Number(v) },
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      ผู้โดยสารเข้า (ราย)
                    </label>
                    <CommaInput
                      maxDecimals={0}
                      value={formData.logistics.passIn}
                      onChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          logistics: { ...p.logistics, passIn: Number(v) },
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      ผู้โดยสารออก (ราย)
                    </label>
                    <CommaInput
                      maxDecimals={0}
                      value={formData.logistics.passOut}
                      onChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          logistics: { ...p.logistics, passOut: Number(v) },
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Transit Statistics */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft size={18} className="text-purple-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    สถิติสินค้าและมูลค่าผ่านแดน (Transit)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Transit In */}
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-3">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">
                      ขาเข้า (ไปประเทศที่สาม)
                    </span>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        รถผ่านแดนเข้า (คัน)
                      </label>
                      <CommaInput
                        maxDecimals={0}
                        value={formData.logistics.transitIn}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p,
                            logistics: { ...p.logistics, transitIn: Number(v) },
                          }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        มูลค่าผ่านแดนเข้า (ล้านบาท)
                      </label>
                      <CommaInput
                        value={formData.logistics.transitValueIn}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p,
                            logistics: { ...p.logistics, transitValueIn: Number(v) },
                          }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  {/* Transit Out */}
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-3">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
                      ขาออก (จากประเทศที่สาม)
                    </span>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        รถผ่านแดนออก (คัน)
                      </label>
                      <CommaInput
                        maxDecimals={0}
                        value={formData.logistics.transitOut}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p,
                            logistics: { ...p.logistics, transitOut: Number(v) },
                          }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        มูลค่าผ่านแดนออก (ล้านบาท)
                      </label>
                      <CommaInput
                        value={formData.logistics.transitValueOut}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p,
                            logistics: { ...p.logistics, transitValueOut: Number(v) },
                          }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2 & 3: Exports & Imports Table */}
          {(activeTab === 'exports' || activeTab === 'imports') && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs whitespace-nowrap min-w-[760px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center font-bold">#</th>
                      <th className="py-2.5 px-2 w-24 font-bold">พิกัด HS</th>
                      <th className="py-2.5 px-3 font-bold w-full min-w-[200px]">รายการสินค้า</th>
                      <th className="py-2.5 px-2 w-24 font-bold">ปริมาณ</th>
                      <th className="py-2.5 px-2 w-24 font-bold">น้ำหนัก (ตัน)</th>
                      <th className="py-2.5 px-3 w-32 font-bold text-right">มูลค่า (ลบ.)</th>
                      <th className="py-2.5 px-3 w-32 font-bold">
                        {activeTab === 'exports' ? 'ปลายทาง' : 'ต้นทาง'}
                      </th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(formData[activeTab] || []).map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-center text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.hsCode || ''}
                            onChange={(e) =>
                              handleItemChange(activeTab, index, 'hsCode', e.target.value)
                            }
                            placeholder="0000"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.name || ''}
                            onChange={(e) =>
                              handleItemChange(activeTab, index, 'name', e.target.value)
                            }
                            placeholder="ชื่อสินค้า..."
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-semibold bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.qty || ''}
                            onChange={(e) =>
                              handleItemChange(activeTab, index, 'qty', e.target.value)
                            }
                            placeholder="จำนวน"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.weight || ''}
                            onChange={(e) =>
                              handleItemChange(activeTab, index, 'weight', e.target.value)
                            }
                            placeholder="ตัน"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <CommaInput
                            value={item.value}
                            onChange={(v) =>
                              handleItemChange(activeTab, index, 'value', v)
                            }
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold text-right text-blue-600 dark:text-blue-400 bg-transparent outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={activeTab === 'exports' ? item.dest || '' : item.origin || ''}
                            onChange={(e) =>
                              handleItemChange(
                                activeTab,
                                index,
                                activeTab === 'exports' ? 'dest' : 'origin',
                                e.target.value
                              )
                            }
                            placeholder="ประเทศ"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(activeTab, index)}
                            className="text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleAddItem(activeTab)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>เพิ่มรายการสินค้าใหม่</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: History Table */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden max-w-4xl mx-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-bold text-center w-14">#</th>
                    <th className="py-3 px-4 font-bold">รอบข้อมูล</th>
                    <th className="py-3 px-4 font-bold text-right">ส่งออกรวม (ลบ.)</th>
                    <th className="py-3 px-4 font-bold text-right">นำเข้ารวม (ลบ.)</th>
                    <th className="py-3 px-4 font-bold text-center w-36">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {Object.keys(db)
                    .sort()
                    .reverse()
                    .map((p, idx) => (
                      <tr key={p} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {db[p].periodName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-right text-blue-600 dark:text-blue-400">
                          {formatCommas(db[p].summary?.export, 2)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-right text-rose-600 dark:text-rose-400">
                          {formatCommas(db[p].summary?.import, 2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditHistory(p)}
                              className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60 transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => onDelete(p)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {db[selectedPeriod] ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                ⚠️ มีข้อมูลของเดือนนี้อยู่แล้ว การบันทึกจะเป็นการแทนที่ข้อมูลเดิม
              </span>
            ) : (
              <span>ข้อมูลใหม่จะถูกบันทึกเป็นรอบเดือน {formData.periodName}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleTriggerSave}
              disabled={isSaving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเข้าระบบ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-save Summary Confirmation Dialog */}
      {showPreSaveSummary && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              ตรวจสอบข้อมูลก่อนบันทึก
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              กรุณาตรวจสอบความถูกต้องของมูลค่าก่อนบันทึกลงฐานข้อมูล Google Sheets
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-2 text-xs mb-5 font-mono">
              <div className="flex justify-between font-sans">
                <span className="text-slate-500">รอบเดือน:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formData.periodName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">ส่งออก:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCommas(formData.summary.export, 2)} ล้านบาท
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">นำเข้า:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatCommas(formData.summary.import, 2)} ล้านบาท
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-sans">ดุลการค้า:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCommas(
                    safeNum(formData.summary.export) - safeNum(formData.summary.import),
                    2
                  )}{' '}
                  ล้านบาท
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-sans">
                <span className="text-slate-500">รายการสินค้า:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ส่งออก {formData.exports?.length || 0} รายการ | นำเข้า{' '}
                  {formData.imports?.length || 0} รายการ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreSaveSummary(false)}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                ย้อนกลับไปแก้ไข
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {isSaving ? 'กำลังส่งข้อมูล...' : 'ยืนยันการบันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
