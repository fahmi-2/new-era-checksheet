/**
 * Validator utilities for GA Dashboard
 * Provides validation functions for dashboard data and API responses
 */

import { z } from 'zod';

// ============================================
// TYPE DEFINITIONS (matching page.tsx)
// ============================================

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: string;
}

export interface TrendItem {
  date: string;
  count: number;
}

export interface DistributionItem {
  status: string;
  count: number;
  category: string;
}

export interface UserItem {
  name: string;
  count: number;
}

export interface HistoryItem {
  filledAt: string;
  area: string;
  category: string;
  shift: string;
  status: string;
  ngCount: number;
  filledBy: string;
}

export interface DashboardData {
  stats: DashboardStats;
  trendData: TrendItem[];
  distributionData: DistributionItem[];
  topUsers: UserItem[];
  historyData: HistoryItem[];
}

export interface Category {
  label: string;
  value: string;
  type: string;
  area: string;
}

// ============================================
// ZOD SCHEMAS
// ============================================

export const DashboardStatsSchema = z.object({
  total: z.number().min(0),
  completed: z.number().min(0),
  pending: z.number().min(0),
  completionRate: z.string(),
});

export const TrendItemSchema = z.object({
  date: z.string(),
  count: z.number().min(0),
});

export const DistributionItemSchema = z.object({
  status: z.string(),
  count: z.number().min(0),
  category: z.string(),
});

export const UserItemSchema = z.object({
  name: z.string(),
  count: z.number().min(0),
});

export const HistoryItemSchema = z.object({
  filledAt: z.string(),
  area: z.string(),
  category: z.string(),
  shift: z.string(),
  status: z.string(),
  ngCount: z.number().min(0),
  filledBy: z.string(),
});

export const DashboardDataSchema = z.object({
  stats: DashboardStatsSchema,
  trendData: z.array(TrendItemSchema),
  distributionData: z.array(DistributionItemSchema),
  topUsers: z.array(UserItemSchema),
  historyData: z.array(HistoryItemSchema),
});

export const CategorySchema = z.object({
  label: z.string(),
  value: z.string(),
  type: z.string(),
  area: z.string(),
});

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate DashboardStats object
 */
export function validateDashboardStats(data: unknown): DashboardStats | null {
  try {
    return DashboardStatsSchema.parse(data);
  } catch (error) {
    console.error('❌ Invalid DashboardStats:', error);
    return null;
  }
}

/**
 * Validate TrendItem object
 */
export function validateTrendItem(data: unknown): TrendItem | null {
  try {
    return TrendItemSchema.parse(data);
  } catch (error) {
    console.error('❌ Invalid TrendItem:', error);
    return null;
  }
}

/**
 * Validate DistributionItem object
 */
export function validateDistributionItem(data: unknown): DistributionItem | null {
  try {
    return DistributionItemSchema.parse(data);
  } catch (error) {
    console.error('❌ Invalid DistributionItem:', error);
    return null;
  }
}

/**
 * Validate UserItem object
 */
export function validateUserItem(data: unknown): UserItem | null {
  try {
    return UserItemSchema.parse(data);
  } catch (error) {
    console.error('❌ Invalid UserItem:', error);
    return null;
  }
}

/**
 * Validate HistoryItem object
 */
export function validateHistoryItem(data: unknown): HistoryItem | null {
  try {
    return HistoryItemSchema.parse(data);
  } catch (error) {
    console.error('❌ Invalid HistoryItem:', error);
    return null;
  }
}

/**
 * Validate complete DashboardData object
 */
export function validateDashboardData(data: unknown): DashboardData | null {
  try {
    return DashboardDataSchema.parse(data);
  } catch (error) {
    console.error('❌ Invalid DashboardData:', error);
    return null;
  }
}

/**
 * Validate Category object
 */
export function validateCategory(data: unknown): Category | null {
  try {
    return CategorySchema.parse(data);
  } catch (error) {
    console.error('❌ Invalid Category:', error);
    return null;
  }
}

/**
 * Validate array of Categories
 */
export function validateCategories(data: unknown): Category[] | null {
  try {
    const categories = z.array(CategorySchema).parse(data);
    return categories;
  } catch (error) {
    console.error('❌ Invalid Categories array:', error);
    return null;
  }
}

/**
 * Validate API response structure
 */
export function validateApiResponse<T>(data: unknown, schema: z.ZodSchema<T>): { success: boolean; data?: T; error?: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Validate date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
 */
export function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate month and year values
 */
export function validateMonthYear(month: number, year: number): boolean {
  return month >= 0 && month <= 11 && year >= 2000 && year <= 2100;
}

/**
 * Validate category value
 */
export function isValidCategory(value: string, validCategories: Category[]): boolean {
  return validCategories.some(cat => cat.value === value);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/['<>]/g, '');
}

/**
 *<>]/g, Validate number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ JSON parse error:', error);
    return fallback;
  }
}
