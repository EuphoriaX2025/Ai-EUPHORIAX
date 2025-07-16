// src/types.ts

// شناسنامه برای داده‌های هر کارت پکیج
export interface CardData {
  id: number;
  group: number;
  packageType: string;
  price: number;
  credit: number;
  className: string;
}

// شناسنامه برای هر آیتم در جدول گزارش
export interface ReportItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}