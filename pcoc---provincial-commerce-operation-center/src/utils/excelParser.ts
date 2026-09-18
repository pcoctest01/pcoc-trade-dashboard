import * as XLSX from 'xlsx';
import { TradeItem, LogisticsData, ImportError } from '../types';
import { round6, THAI_MONTHS, THAI_MONTHS_SHORT } from './calculations';

export interface ParseResult {
  exports?: TradeItem[];
  imports?: TradeItem[];
  logistics?: Partial<LogisticsData>;
  summary?: {
    export?: number;
    import?: number;
  };
  errors: ImportError[];
}

/**
 * แปลงข้อมูลรายการสินค้า Export หรือ Import จากแถวในชีท Excel
 */
export const parseTradeData = (
  rows: (string | number | null | undefined)[][],
  type: 'export' | 'import',
  sheetName: string
): { items: TradeItem[]; localErrors: ImportError[] } => {
  let headerIdx = -1;
  const colMap = {
    hsCode: -1,
    name: -1,
    qty: -1,
    weight: -1,
    value: -1,
    country: -1,
  };

  // ค้นหาแถวที่เป็นหัวตาราง
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i] || !Array.isArray(rows[i])) continue;
    const rowStrs = Array.from(rows[i]).map((c) => (c ? String(c).trim() : ''));
    const hsIdx = rowStrs.findIndex(
      (c) => c.includes('พิกัด') || c === 'พิกัดศุลกากร' || c === 'HS Code' || c === 'HS'
    );
    const nameIdx = rowStrs.findIndex(
      (c) => c.includes('รายการ') || c === 'สินค้า' || c === 'ชนิดสินค้า' || c === 'ชื่อสินค้า'
    );

    if (hsIdx !== -1 || nameIdx !== -1) {
      headerIdx = i;
      colMap.hsCode = hsIdx !== -1 ? hsIdx : nameIdx > 0 ? nameIdx - 1 : -1;
      colMap.name = nameIdx;
      colMap.qty = rowStrs.findIndex((c) => c.includes('ปริมาณ') || c === 'จำนวน');
      colMap.weight = rowStrs.findIndex(
        (c) => c.includes('น้ำหนัก') || c.includes('กก.') || c.includes('KGM') || c.includes('ตัน')
      );
      colMap.value = rowStrs.findIndex((c) => c.includes('มูลค่า') || c.includes('บาท'));
      colMap.country = rowStrs.findIndex(
        (c) => c.includes('ประเทศ') || c.includes('ปลายทาง') || c.includes('ต้นทาง')
      );
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error(`ไม่พบหัวตาราง "พิกัด" หรือ "รายการ" ในชีท ${sheetName}`);
  }

  const items: TradeItem[] = [];
  const localErrors: ImportError[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    const rawName = colMap.name !== -1 && row[colMap.name] ? String(row[colMap.name]) : '';
    const cleanName = rawName.trim();
    if (!cleanName || cleanName === 'รายการ' || cleanName === 'ชนิดสินค้า' || cleanName === 'ชื่อสินค้า') continue;
    
    // กรองแถวสรุปยอดรวม เช่น รวม, รวมทั้งสิ้น, Grand Total, ยอดรวม
    const isSummaryRow = 
      /^(รวม|ยอดรวม|รวมทั้งสิ้น|รวมยอด|รวมมูลค่า|total|grand\s*total)/i.test(cleanName) ||
      cleanName === 'รวม' || 
      cleanName === 'รวมทั้งสิ้น';
    if (isSummaryRow) {
      continue;
    }

    try {
      let hsCode = '';
      if (colMap.hsCode !== -1 && row[colMap.hsCode]) {
        hsCode = String(row[colMap.hsCode]).trim();
        // จัดการรหัสพิกัด 3 หลัก ให้เติม 0 ด้านหน้า
        if (hsCode && hsCode.length === 3) hsCode = '0' + hsCode;
      }

      if (/^(รวม|ยอดรวม|รวมทั้งสิ้น|total)/i.test(hsCode)) {
        continue;
      }

      const rawQty = colMap.qty !== -1 && row[colMap.qty] ? String(row[colMap.qty]).replace(/,/g, '') : '';
      const rawWeight =
        colMap.weight !== -1 && row[colMap.weight]
          ? parseFloat(String(row[colMap.weight]).replace(/,/g, '')) || 0
          : 0;

      const rawValue = colMap.value !== -1 && row[colMap.value] ? String(row[colMap.value]).replace(/,/g, '') : '0';
      const parsedValue = parseFloat(rawValue);

      if (isNaN(parsedValue)) {
        throw new Error('ช่องมูลค่าไม่ใช่ตัวเลขที่ถูกต้อง');
      }

      // ตรวจสอบว่าหัวตารางระบุหน่วยเป็น "ล้านบาท" อยู่แล้วหรือไม่
      const headerValStr = (colMap.value !== -1 && rows[headerIdx] && rows[headerIdx][colMap.value])
        ? String(rows[headerIdx][colMap.value]).toLowerCase()
        : '';
      const isAlreadyMillionBaht = 
        headerValStr.includes('ล้านบาท') || 
        headerValStr.includes('ล้าน') || 
        headerValStr.includes('million') || 
        headerValStr.includes('ลบ.');

      const finalValue = isAlreadyMillionBaht ? round6(parsedValue) : round6(parsedValue / 1000000);

      const countryVal =
        colMap.country !== -1 && row[colMap.country] ? String(row[colMap.country]).trim() : '';

      items.push({
        id: items.length + 1,
        hsCode,
        name: cleanName,
        qty: Number(rawQty) ? Number(rawQty).toLocaleString() : rawQty,
        weight: rawWeight > 0 ? Math.round(rawWeight / 1000).toLocaleString() : '0',
        value: finalValue, // แปลงเป็นหน่วย "ล้านบาท"
        ...(type === 'export' ? { dest: countryVal } : { origin: countryVal }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ข้อมูลไม่ถูกต้อง';
      localErrors.push({ sheet: sheetName, row: i + 1, message: msg, item: cleanName });
    }
  }

  return { items, localErrors };
};

/**
 * ดึงมูลค่าสินค้าผ่านแดน (Transit Values) ขาเข้าและขาออก
 */
export const parseTransitData = (
  rows: (string | number | null | undefined)[][]
): { inVal: number; outVal: number } => {
  let inVal = 0;
  let outVal = 0;
  let headerFound = false;

  for (let i = 0; i < rows.length; i++) {
    if (!rows[i] || !Array.isArray(rows[i])) continue;
    const rowStrs = Array.from(rows[i]).map((c) => (c ? String(c).trim() : ''));

    if (rowStrs.some((s) => s.includes('ชนิดสินค้า') || s.includes('รายการ'))) {
      headerFound = true;
      continue;
    }

    if (headerFound) {
      const fullRowText = rowStrs.join('');
      if (fullRowText.includes('รวมทั้งสิ้น') || fullRowText.includes('รวมมูลค่า')) continue;

      const nameIn = rowStrs[2] || '';
      if (nameIn && nameIn !== 'รวม' && !nameIn.startsWith('รวมทั้งสิ้น')) {
        const vIn = parseFloat(String(rows[i][3] || '').replace(/,/g, ''));
        if (!isNaN(vIn)) inVal += vIn;
      }

      const nameOut = rowStrs[7] || '';
      if (nameOut && nameOut !== 'รวม' && !nameOut.startsWith('รวมทั้งสิ้น')) {
        const vOut = parseFloat(String(rows[i][8] || '').replace(/,/g, ''));
        if (!isNaN(vOut)) outVal += vOut;
      }
    }
  }

  return {
    inVal: round6(inVal / 1000000),
    outVal: round6(outVal / 1000000),
  };
};

/**
 * ดึงสถิติยานพาหนะและบุคคล (Logistics)
 */
export const parseLogisticsData = (
  rows: (string | number | null | undefined)[][],
  monthIndex: number
): Partial<LogisticsData> => {
  const result: Partial<LogisticsData> = {
    truckIn: 0,
    truckOut: 0,
    transitIn: 0,
    transitOut: 0,
    passIn: 0,
    passOut: 0,
  };

  const cleanNum = (val: unknown) => parseInt(String(val || '').replace(/,/g, ''), 10) || 0;

  const fullMonth = THAI_MONTHS[monthIndex] || '';
  const shortMonth = THAI_MONTHS_SHORT[monthIndex] || '';
  const shortMonthNoDot = shortMonth.replace(/\./g, '');

  let targetRow: (string | number | null | undefined)[] | null = null;

  for (let i = rows.length - 1; i >= 0; i--) {
    if (!rows[i] || rows[i].length === 0) continue;

    let rowStr = String(rows[i][0] || '') + String(rows[i][1] || '') + String(rows[i][2] || '');
    rowStr = rowStr.replace(/\s+/g, '');

    if (rowStr.includes('รวม') || rowStr.includes('สะสม')) continue;

    if (
      rowStr.includes(fullMonth) ||
      rowStr.includes(shortMonth) ||
      rowStr.includes(shortMonthNoDot)
    ) {
      const hasNumbers = rows[i].some((c, idx) => idx > 0 && cleanNum(c) > 0);
      if (hasNumbers) {
        targetRow = rows[i];
        break;
      }
    }
  }

  if (targetRow) {
    result.truckIn = cleanNum(targetRow[1]);
    result.truckOut = cleanNum(targetRow[2]);
    result.transitIn = cleanNum(targetRow[3]);
    result.transitOut = cleanNum(targetRow[4]);
    result.passIn = cleanNum(targetRow[11]) || cleanNum(targetRow[5]);
    result.passOut = cleanNum(targetRow[12]) || cleanNum(targetRow[6]);
  }

  return result;
};

/**
 * ประมวลผลไฟล์ Excel (.xlsx, .xls) หรือ CSV
 */
export const processExcelFiles = async (
  files: FileList | File[],
  period: string
): Promise<ParseResult> => {
  const errors: ImportError[] = [];
  const result: ParseResult = {
    errors: [],
  };

  const periodParts = (period || '').split('-');
  let monthIndex = new Date().getMonth();
  if (periodParts.length > 1 && !isNaN(parseInt(periodParts[1], 10))) {
    monthIndex = parseInt(periodParts[1], 10) - 1;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      let foundRecognizableSheet = false;

      for (const sheetName of workbook.SheetNames) {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          header: 1,
        }) as (string | number | null | undefined)[][];

        if (rows.length < 2) continue;

        const headerText = rows
          .slice(0, 15)
          .map((r) => (Array.isArray(r) ? r.join('') : ''))
          .join('')
          .replace(/\s+/g, '');

        const fName = file.name.replace(/\s+/g, '').toLowerCase();
        const sName = sheetName.replace(/\s+/g, '').toLowerCase();
        let type = 'unknown';

        if (
          sName.includes('รถ') ||
          sName.includes('คน') ||
          sName.includes('พาหนะ') ||
          headerText.includes('รถบรรทุก') ||
          headerText.includes('ผู้โดยสาร') ||
          headerText.includes('สถิติการเดินทาง')
        ) {
          type = 'logistics';
        } else if (
          sName.includes('ผ่านแดน') ||
          sName.includes('transit') ||
          headerText.includes('ผ่านแดน')
        ) {
          type = 'transit';
        } else if (
          sName.includes('ขาเข้า') ||
          sName.includes('นำเข้า') ||
          headerText.includes('สินค้านำเข้า') ||
          headerText.includes('ขาเข้า')
        ) {
          type = 'import';
        } else if (
          sName.includes('ขาออก') ||
          sName.includes('ส่งออก') ||
          headerText.includes('สินค้าส่งออก') ||
          headerText.includes('ขาออก')
        ) {
          type = 'export';
        } else if (workbook.SheetNames.length === 1) {
          if (fName.includes('รถ') || fName.includes('คน')) type = 'logistics';
          else if (fName.includes('ผ่านแดน')) type = 'transit';
          else if (fName.includes('ขาเข้า') || (fName.includes('นำเข้า') && !fName.includes('ส่งออก')))
            type = 'import';
          else if (fName.includes('ขาออก') || (fName.includes('ส่งออก') && !fName.includes('นำเข้า')))
            type = 'export';
        }

        if (type === 'import' || type === 'export') {
          try {
            const { items, localErrors } = parseTradeData(rows, type, sheetName);
            if (type === 'export') {
              const prevExports = result.exports || [];
              const combined = [...prevExports, ...items];
              combined.forEach((it, idx) => {
                it.id = idx + 1;
              });
              result.exports = combined;
              const totalVal = combined.reduce((s, it) => s + (it.value || 0), 0);
              result.summary = { ...result.summary, export: round6(totalVal) };
            } else {
              const prevImports = result.imports || [];
              const combined = [...prevImports, ...items];
              combined.forEach((it, idx) => {
                it.id = idx + 1;
              });
              result.imports = combined;
              const totalVal = combined.reduce((s, it) => s + (it.value || 0), 0);
              result.summary = { ...result.summary, import: round6(totalVal) };
            }
            errors.push(...localErrors);
            foundRecognizableSheet = true;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอ่านข้อมูล';
            errors.push({ sheet: sheetName, row: '-', message: msg, item: 'Error' });
          }
        } else if (type === 'transit') {
          try {
            const { inVal, outVal } = parseTransitData(rows);
            result.logistics = {
              ...result.logistics,
              transitValueIn: inVal,
              transitValueOut: outVal,
            };
            foundRecognizableSheet = true;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอ่านข้อมูลผ่านแดน';
            errors.push({ sheet: sheetName, row: '-', message: msg, item: 'Error' });
          }
        } else if (type === 'logistics') {
          try {
            const logData = parseLogisticsData(rows, monthIndex);
            result.logistics = {
              ...result.logistics,
              ...logData,
            };
            foundRecognizableSheet = true;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอ่านข้อมูลโลจิสติกส์';
            errors.push({ sheet: sheetName, row: '-', message: msg, item: 'Error' });
          }
        }
      }

      if (!foundRecognizableSheet) {
        errors.push({
          sheet: file.name,
          row: '-',
          message: 'ไม่พบรูปแบบโครงสร้างข้อมูลที่ระบบรองรับในไฟล์นี้',
          item: '-',
        });
      }
    } catch {
      errors.push({
        sheet: file.name,
        row: '-',
        message: 'ไฟล์เสียหายหรือไม่สามารถเปิดอ่านได้',
        item: '-',
      });
    }
  }

  result.errors = errors;
  return result;
};

/**
 * ตรวจจับงวดเดือน/ปี จากชื่อไฟล์ เช่น "Trade_2024_10.xlsx", "ต.ค. 2567.xlsx", "ตุลาคม 2567.xlsx"
 */
export const detectPeriodFromFilename = (filename: string): string | null => {
  if (!filename) return null;
  const clean = filename.toLowerCase();

  // Pattern 1: YYYY-MM or YYYY_MM (e.g. 2024-09, 2024_09)
  const yyyyMm = clean.match(/(20\d{2})[-_](\d{1,2})/);
  if (yyyyMm) {
    const y = parseInt(yyyyMm[1], 10);
    const m = parseInt(yyyyMm[2], 10);
    if (m >= 1 && m <= 12) return `${y}-${String(m).padStart(2, '0')}`;
  }

  // Pattern 2: BE Year YYYY-MM (e.g. 2567-09, 2567_09)
  const beMm = clean.match(/(25\d{2})[-_](\d{1,2})/);
  if (beMm) {
    const y = parseInt(beMm[1], 10) - 543;
    const m = parseInt(beMm[2], 10);
    if (m >= 1 && m <= 12) return `${y}-${String(m).padStart(2, '0')}`;
  }

  // Pattern 3: Thai month name or short month and year
  for (let m = 0; m < THAI_MONTHS.length; m++) {
    const fullM = THAI_MONTHS[m].toLowerCase();
    const shortM = THAI_MONTHS_SHORT[m].replace(/\./g, '').toLowerCase();
    if (clean.includes(fullM) || clean.includes(shortM)) {
      const yearMatch = clean.match(/(25\d{2}|20\d{2})/);
      if (yearMatch) {
        let yr = parseInt(yearMatch[1], 10);
        if (yr >= 2500) yr -= 543;
        const monthStr = String(m + 1).padStart(2, '0');
        return `${yr}-${monthStr}`;
      }
    }
  }

  return null;
};
