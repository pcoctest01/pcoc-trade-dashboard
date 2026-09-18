export interface TradeItem {
  id?: number;
  hsCode: string;
  name: string;
  qty?: string | number;
  weight?: string | number;
  value: number; // in million THB (ล้านบาท)
  dest?: string; // for export
  origin?: string; // for import
  country?: string; // aggregated
}

export interface TradeSummary {
  export: number;
  import: number;
  total: number;
  balance: number;
  change?: {
    export: number;
    import: number;
    total: number;
    balance: number;
  };
  yoyChange?: {
    export: number;
    import: number;
    total: number;
    balance: number;
  };
}

export interface LogisticsData {
  truckIn: number;
  truckOut: number;
  transitIn: number;
  transitOut: number;
  passIn: number;
  passOut: number;
  transitValueIn: number; // in million THB (ล้านบาท)
  transitValueOut: number; // in million THB (ล้านบาท)
}

export interface PeriodRecord {
  period?: string; // YYYY-MM
  periodName: string;
  summary: TradeSummary;
  logistics: LogisticsData;
  exports: TradeItem[];
  imports: TradeItem[];
}

export type Database = Record<string, PeriodRecord>;

export interface AggregatedSummary {
  export: number;
  import: number;
  total: number;
  balance: number;
}

export interface GrowthMetric {
  export: number | null;
  import: number | null;
  total: number | null;
  balance: number | null;
}

export type FilterMode = 'month' | 'calendar_year' | 'year' | 'range';
export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'th' | 'en';

export interface DateRange {
  start: string;
  end: string;
}

export interface ImportError {
  sheet: string;
  row: string | number;
  message: string;
  item?: string;
}

export interface DialogState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}
