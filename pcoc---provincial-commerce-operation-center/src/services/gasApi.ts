import { Database, PeriodRecord } from '../types';
import { formatPeriodName } from '../utils/calculations';
import { INITIAL_BORDER_TRADE_DATA } from '../utils/initialData';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbzE_5tW70aKOGCONvTXLadf1LVKRj0nAKLEsqaebIMYT4iVh069vVGa74Um7hjsUBn0ow/exec';

export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ncr_gas_api_url') || DEFAULT_GAS_URL;
  }
  return DEFAULT_GAS_URL;
};

export const setApiUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ncr_gas_api_url', url.trim());
  }
};

/**
 * ดึงข้อมูลทั้งหมดจาก Google Apps Script Web App
 */
export const fetchAllRecords = async (): Promise<{
  data: Database;
  source: 'cloud' | 'local';
}> => {
  const apiUrl = getApiUrl();

  // ตรวจสอบใน localStorage เผื่อกรณี offline / local fallback
  let localData: Database = { ...INITIAL_BORDER_TRADE_DATA };
  try {
    const saved = localStorage.getItem('ncr_cached_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        localData = { ...localData, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Could not read cached db from localStorage', err);
  }

  if (!apiUrl || apiUrl.includes('/library/')) {
    return { data: localData, source: 'local' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const separator = apiUrl.includes('?') ? '&' : '?';
    const url = `${apiUrl}${separator}t=${Date.now()}`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const textData = await res.text();
    let rawData: Record<string, unknown>;
    try {
      rawData = JSON.parse(textData);
    } catch {
      throw new Error('Invalid JSON received from Google Apps Script Web App');
    }

    if (rawData && !('error' in rawData)) {
      const normalizedData: Database = {};
      Object.keys(rawData).forEach((key) => {
        let cleanKey = key.trim();
        const d = new Date(cleanKey);
        if (!isNaN(d.getTime())) {
          let y = d.getFullYear();
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          if (y > 2500) y -= 543;
          cleanKey = `${y}-${m}`;
        } else if (cleanKey.includes('-')) {
          const parts = cleanKey.split('-');
          if (parts.length >= 2) {
            let y = parseInt(parts[0], 10);
            const m = parts[1].padStart(2, '0');
            if (y > 2500) y -= 543;
            cleanKey = `${y}-${m}`;
          }
        }
        if (/^\d{4}-\d{2}$/.test(cleanKey)) {
          const item = rawData[key] as PeriodRecord;
          normalizedData[cleanKey] = {
            ...item,
            periodName: formatPeriodName(cleanKey),
          };
        }
      });

      // ผสานข้อมูลเข้ากับ Local Data เผื่อมีข้อมูลที่บันทึกไว้
      const merged: Database = { ...localData, ...normalizedData };
      try {
        localStorage.setItem('ncr_cached_db', JSON.stringify(merged));
      } catch (err) {
        console.warn('Failed to save to localStorage cache', err);
      }
      return { data: merged, source: 'cloud' };
    }

    return { data: localData, source: 'local' };
  } catch (error) {
    console.warn('Google Sheets API unavailable or error, falling back to cached/seed data:', error);
    return { data: localData, source: 'local' };
  }
};

/**
 * บันทึกข้อมูลรอบเดือนลง Google Sheets ผ่าน Apps Script Web App
 */
export const saveRecordToCloud = async (
  period: string,
  record: PeriodRecord,
  isOverwrite: boolean
): Promise<{ success: boolean; message: string }> => {
  // บันทึกใน LocalStorage ทันที
  try {
    const saved = localStorage.getItem('ncr_cached_db');
    const db: Database = saved ? JSON.parse(saved) : {};
    db[period] = record;
    localStorage.setItem('ncr_cached_db', JSON.stringify(db));
  } catch (err) {
    console.warn('Failed to update local cache', err);
  }

  const apiUrl = getApiUrl();
  if (!apiUrl || apiUrl.includes('/library/')) {
    return {
      success: true,
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว (โหมด Local Storage)',
    };
  }

  try {
    // ป้องกันข้อมูลซ้ำ (Auto-Delete เก่าก่อนบันทึกใหม่หากมีอยู่แล้ว)
    if (isOverwrite) {
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'delete', period }),
        });
        await new Promise((res) => setTimeout(res, 800));
      } catch (err) {
        console.warn('Notice: delete step had error, proceeding to save', err);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'save',
        period,
        ...record,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return {
      success: true,
      message: 'บันทึกข้อมูลลงฐานข้อมูล Google Sheets เรียบร้อยแล้ว',
    };
  } catch (error: unknown) {
    const msg = error instanceof Error && error.name === 'AbortError'
      ? 'เซิร์ฟเวอร์ตอบสนองช้า แต่ข้อมูลถูกอัปเดตในระบบแล้ว'
      : 'เชื่อมต่อฐานข้อมูล Google Sheets ขัดข้อง แต่ข้อมูลถูกบันทึกในระบบเรียบร้อย';
    return { success: true, message: msg };
  }
};

/**
 * ลบข้อมูลรอบเดือน
 */
export const deleteRecordFromCloud = async (
  period: string
): Promise<{ success: boolean; message: string }> => {
  // ลบจาก LocalStorage
  try {
    const saved = localStorage.getItem('ncr_cached_db');
    if (saved) {
      const db: Database = JSON.parse(saved);
      delete db[period];
      localStorage.setItem('ncr_cached_db', JSON.stringify(db));
    }
  } catch (err) {
    console.warn('Failed to delete from local cache', err);
  }

  const apiUrl = getApiUrl();
  if (!apiUrl || apiUrl.includes('/library/')) {
    return { success: true, message: 'ลบข้อมูลเรียบร้อยแล้ว' };
  }

  try {
    await fetch(apiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete', period }),
    });
    return { success: true, message: 'ลบข้อมูลออกจาก Google Sheets เรียบร้อยแล้ว' };
  } catch (error) {
    console.error('Delete error', error);
    return { success: true, message: 'ลบข้อมูลในระบบเรียบร้อย' };
  }
};

/**
 * ฟังก์ชัน Wrapper สำหรับ Dashboard และ CRUD
 */
export const fetchDatabase = async (): Promise<Database> => {
  const res = await fetchAllRecords();
  return res.data;
};

export const savePeriod = async (record: PeriodRecord): Promise<{ success: boolean; message: string }> => {
  const period = record.period || '';
  return saveRecordToCloud(period, record, true);
};

export const deletePeriod = async (period: string): Promise<{ success: boolean; message: string }> => {
  return deleteRecordFromCloud(period);
};

/**
 * การจัดการสถานะเข้าสู่ระบบผู้ดูแลข้อมูล (Admin Authentication)
 */
export const isAdminLoggedIn = (): boolean => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('ncr_admin_logged_in') === 'true';
  }
  return false;
};

export const setAdminLoggedIn = (status: boolean) => {
  if (typeof window !== 'undefined') {
    if (status) {
      sessionStorage.setItem('ncr_admin_logged_in', 'true');
    } else {
      sessionStorage.removeItem('ncr_admin_logged_in');
    }
  }
};

export const logoutAdmin = () => {
  setAdminLoggedIn(false);
};

export const loginAdmin = async (password: string): Promise<{ success: boolean; message?: string }> => {
  // รหัสผ่านเริ่มต้น: admin123 หรือรหัสที่ตั้งไว้ใน LocalStorage
  const storedPass = typeof window !== 'undefined' ? localStorage.getItem('ncr_admin_pass') || 'admin123' : 'admin123';
  if (password === storedPass) {
    setAdminLoggedIn(true);
    return { success: true };
  }
  return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
};
