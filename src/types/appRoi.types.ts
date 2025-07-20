export interface AppRoiData {
  id?: number;
  date: string;
  app_name: string;
  bid_type: string;
  country: string;
  install_count: number;
  roi_1d?: number;
  roi_3d?: number;
  roi_7d?: number;
  roi_14d?: number;
  roi_30d?: number;
  roi_60d?: number;
  roi_90d?: number;
  roi_current?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CsvRowData {
  [index: number]: string | undefined;
  0: string; // date
  1: string; // app_name
  2: string; // bid_type
  3: string; // country
  4: string; // install_count
  5?: string; // roi_1d
  6?: string; // roi_3d
  7?: string; // roi_7d
  8?: string; // roi_14d
  9?: string; // roi_30d
  10?: string; // roi_60d
  11?: string; // roi_90d
  12?: string; // roi_current
}

export interface ProcessedRowData {
  date: string;
  app_name: string;
  bid_type: string;
  country: string;
  install_count: string;
  roi_1d: string | number;
  roi_3d: string | number;
  roi_7d: string | number;
  roi_14d: string | number;
  roi_30d: string | number;
  roi_60d: string | number;
  roi_90d: string | number;
  roi_current: string | number;
}

export interface CsvParseResult {
  success: boolean;
  data?: CsvRowData[];
  error?: string;
}

export interface DataInsertResult {
  success: boolean;
  insertedCount?: number;
  error?: string;
  details?: {
    totalRecords?: number;
    validRecords?: number;
    insertedRecords?: number;
  } | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface FilterOptions {
  app_names?: string[];
  countries?: string[];
  bid_types?: string[];
  date_range?: {
    start_date?: string;
    end_date?: string;
  };
}