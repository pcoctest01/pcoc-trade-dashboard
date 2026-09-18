import { PeriodRecord } from '../types';

export const THEME_COLORS = {
  blue: '#2563EB',     // Blue - Export / Primary
  red: '#DC2626',      // Red - Import / Negative
  green: '#16A34A',    // Green - Positive / Balance
  amber: '#D97706',    // Amber - Warning
  gray: '#64748B',     // Slate Gray - Neutral
  darkBg: '#0B0F19',   // Apple Slate Deep
  darkCard: '#111827', // Slate 900 Surface
  darkElevated: '#1E293B',
  darkBorder: '#1E293B',
};

export const getChartThemeColors = (isDark: boolean) => ({
  axis: isDark ? '#94A3B8' : '#64748B',
  grid: isDark ? 'rgba(51, 65, 85, 0.45)' : 'rgba(226, 232, 240, 0.85)',
  tooltipBg: isDark ? '#0F172A' : '#FFFFFF',
  tooltipBorder: isDark ? '#334155' : '#E2E8F0',
  tooltipText: isDark ? '#F8FAFC' : '#0F172A',
  export: isDark ? '#3B82F6' : '#2563EB',
  import: isDark ? '#F43F5E' : '#DC2626',
  balance: isDark ? '#22C55E' : '#16A34A',
  total: isDark ? '#818CF8' : '#6366F1',
});

export const PIE_COLORS = [
  '#2563EB', '#16A34A', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#EC4899', '#10B981', 
  '#F97316', '#6366F1'
];

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const CURRENT_YEAR = new Date().getFullYear();
export const START_YEAR = 2016;
export const END_YEAR = CURRENT_YEAR + 3;

/**
 * ปัดเศษทศนิยม 6 ตำแหน่งเพื่อป้องกันปัญหา Floating Point Error
 */
export const round6 = (num: number | string | null | undefined): number => {
  const n = Number(num);
  return Number.isNaN(n) ? 0 : Math.round((n + Number.EPSILON) * 1e6) / 1e6;
};

/**
 * ดึงตัวเลขที่ปลอดภัย ลบ comma และจัดการ null/undefined
 */
export const safeNum = (val: unknown): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Number.isNaN(val) ? 0 : val;
  const num = parseFloat(String(val).replace(/,/g, ''));
  return Number.isNaN(num) ? 0 : num;
};

/**
 * คำนวณอัตราการเติบโต MoM / YoY เป็นเปอร์เซ็นต์
 */
export const calculateGrowth = (
  current: number | null | undefined,
  previous: number | null | undefined
): number | null => {
  if (previous === null || previous === undefined) return null;
  const prev = safeNum(previous);
  if (prev === 0) return null;
  const curr = safeNum(current);
  return round6(((curr - prev) / Math.abs(prev)) * 100);
};

/**
 * จัดรูปแบบตัวเลขพร้อมเครื่องหมายจุลภาค
 */
export const formatCommas = (val: unknown, maxDecimals = 6): string => {
  if (val === null || val === undefined || val === '') return '';
  const num = safeNum(val);
  return num.toLocaleString('en-US', {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: maxDecimals === 2 ? 2 : 0,
  });
};

/**
 * สร้างตัวเลือกสำหรับ Dropdown (เดือน หรือ ปี)
 */
export const generateOptions = (type: 'month' | 'year') => {
  const options: { value: string; label: string }[] = [];
  for (let y = END_YEAR; y >= START_YEAR; y--) {
    if (type === 'year') {
      options.push({ value: y.toString(), label: `พ.ศ. ${y + 543}` });
    } else {
      for (let m = 12; m >= 1; m--) {
        const monthStr = m.toString().padStart(2, '0');
        options.push({
          value: `${y}-${monthStr}`,
          label: `${THAI_MONTHS[m - 1]} ${y + 543}`,
        });
      }
    }
  }
  return options;
};

export const MONTH_OPTIONS = generateOptions('month');
export const YEAR_OPTIONS = generateOptions('year');

/**
 * แปลง period เช่น "2026-09" เป็น "กันยายน 2569"
 */
export const formatPeriodName = (period: string): string => {
  if (!period) return 'ไม่มีข้อมูล';
  const match = MONTH_OPTIONS.find((o) => o.value === period);
  if (match) return match.label;
  if (period.includes('-')) {
    const parts = period.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      return `${THAI_MONTHS[m - 1]} ${y + 543}`;
    }
  }
  return period;
};

/**
 * คำนวณเดือนก่อนหน้า เช่น "2026-09" -> "2026-08", "2026-01" -> "2025-12"
 */
export const getPreviousMonth = (periodStr: string): string => {
  if (!periodStr || !periodStr.includes('-')) return '';
  const [y, m] = periodStr.split('-');
  let year = parseInt(y, 10);
  let month = parseInt(m, 10) - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${month.toString().padStart(2, '0')}`;
};

/**
 * คำนวณเดือนถัดไป เช่น "2026-09" -> "2026-10", "2026-12" -> "2027-01"
 */
export const getNextMonth = (periodStr: string): string => {
  const currentMonthStr = `${CURRENT_YEAR}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  if (!periodStr || !periodStr.includes('-')) return currentMonthStr;
  try {
    const [y, m] = periodStr.split('-');
    let year = parseInt(y, 10);
    let month = parseInt(m, 10) + 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    return `${year}-${month.toString().padStart(2, '0')}`;
  } catch {
    return currentMonthStr;
  }
};

/**
 * ตรวจสอบว่า period อยู่ในรอบปีงบประมาณที่ระบุหรือไม่
 * ปีงบประมาณไทย: ต.ค. ปีก่อนหน้า (m >= 10) ถึง ก.ย. ปีเป้าหมาย (m <= 9)
 */
export const isFiscalYear = (period: string, targetYear: number): boolean => {
  if (!period || !period.includes('-')) return false;
  const [y, m] = period.split('-').map(Number);
  return (y === targetYear - 1 && m >= 10) || (y === targetYear && m <= 9);
};

/**
 * รวมชื่อประเทศเข้าด้วยกันโดยไม่ซ้ำกัน
 */
export const mergeCountries = (existingStr = '', newStr = ''): string => {
  if (!newStr) return existingStr || '';
  const arr = new Set(
    [...(existingStr || '').split(','), ...(newStr || '').split(',')]
      .map((c) => c.trim())
      .filter(Boolean)
  );
  return Array.from(arr).join(', ');
};

/**
 * สร้าง Form ว่างสำหรับเริ่มต้นกรอกข้อมูลรอบเดือน
 */
export const getEmptyForm = (period?: string): PeriodRecord => ({
  period: period || `${CURRENT_YEAR}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  periodName: formatPeriodName(period || `${CURRENT_YEAR}-${String(new Date().getMonth() + 1).padStart(2, '0')}`),
  summary: {
    export: 0,
    import: 0,
    total: 0,
    balance: 0,
  },
  logistics: {
    truckIn: 0,
    truckOut: 0,
    transitIn: 0,
    transitOut: 0,
    passIn: 0,
    passOut: 0,
    transitValueIn: 0,
    transitValueOut: 0,
  },
  exports: [],
  imports: [],
});
