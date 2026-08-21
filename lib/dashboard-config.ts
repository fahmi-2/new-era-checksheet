// lib/dashboard-config.ts

// ============================================
// TYPES
// ============================================

export interface FormConfig {
  type:             string;
  label:            string;
  slug:             string;
  group:            'all' | 'legacy' | 'ga';
  inspectionType?:  'inspeksi' | 'preventive';
  analyticsEndpoint: string;
  historyEndpoint:  string; // ← selalu '/analytics/history' (unified)
  allOK?:           boolean;
}

export interface AnalyticsParams extends Record<string, string | undefined> {
  slug:             string;
  dateFrom:         string;
  dateTo:           string;
  period:           string;
  inspectionType?:  string;
  area?:            string;
}

// ============================================
// FORM TYPES  — single source of truth ✅
// ============================================
// ✅ EXPORTED untuk digunakan di ga-dashboard/page.tsx dan komponen lain
export const FORM_TYPES = [
  { value: 'All Category',             label: '📋 All Category',            slug: 'all',              group: 'all'    },

  // Legacy
  { value: 'APAR',                     label: '🧯 APAR',                    slug: 'apar',             group: 'legacy' },
  { value: 'Fire Alarm',               label: '🔔 Fire Alarm',              slug: 'fire-alarm',       group: 'legacy' },
  { value: 'Emergency Lamp',           label: '💡 Emergency Lamp',          slug: 'emergency-lamp',   group: 'legacy' },
  { value: 'APD',                      label: '🦺 APD',                     slug: 'apd',              group: 'legacy' },
  { value: 'Toilet',                   label: '🚻 Toilet',                  slug: 'toilet',           group: 'legacy' },
  { value: 'Electrical',               label: '⚡ Electrical',              slug: 'electrical',       group: 'legacy' },
  { value: 'Lift Barang - Inspeksi',   label: '🏗️ Lift Barang - Inspeksi',  slug: 'lift-barang',      group: 'legacy' },
  { value: 'Lift Barang - Preventive', label: '🏗️ Lift Barang - Preventive',slug: 'lift-barang',      group: 'legacy' },
  { value: 'Exit Lamp',                label: '🚪 Exit Lamp',               slug: 'exit-lamp',        group: 'legacy' },
  { value: 'Pintu Darurat',            label: '🚨 Pintu Darurat',           slug: 'pintu-darurat',    group: 'legacy' },
  { value: 'Titik Kumpul',             label: '📍 Titik Kumpul',            slug: 'titik-kumpul',     group: 'legacy' },

  // GA Unified
  { value: 'Tangga Listrik',           label: '🪜 Tangga Listrik',          slug: 'tg-listrik',       group: 'ga'     },
  { value: 'Infrastruktur Jalan',      label: '🛣️ Infrastruktur Jalan',     slug: 'inf-jalan',        group: 'ga'     },
  { value: 'Inspeksi APD',             label: '🦺 Inspeksi APD',            slug: 'inspeksi-apd',     group: 'ga'     },
  { value: 'Inspeksi Hydrant',         label: '🚒 Inspeksi Hydrant',        slug: 'inspeksi-hydrant', group: 'ga'     },
  { value: 'Selang Hydrant',           label: '🌊 Selang Hydrant',          slug: 'selang-hydrant',   group: 'ga'     },
  { value: 'Panel Listrik',            label: '🔌 Panel Listrik',           slug: 'panel',            group: 'ga'     },
  { value: 'Smoke Detector',           label: '💨 Smoke Detector',          slug: 'smoke-detector',   group: 'ga'     },
] as const;

export type FormTypeValue = typeof FORM_TYPES[number]['value'];

// ============================================
// UNIFIED HISTORY ENDPOINT
// Semua form menggunakan endpoint yang sama.
// Slug dikirim sebagai query param sehingga
// satu handler bisa melayani semua form.
// ============================================
const HISTORY = '/analytics/history';
const ANALYTICS = '/analytics';

// ============================================
// FORM CONFIG MAPPING
// ============================================

const FORM_CONFIGS: Record<string, FormConfig> = {

  // ── All ──────────────────────────────────────────────────
  'All Category': {
    type: 'All', label: '📋 All Category', slug: 'all', group: 'all',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },

  // ── Legacy ───────────────────────────────────────────────
  'APAR': {
    type: 'APAR', label: '🧯 APAR', slug: 'apar', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Fire Alarm': {
    type: 'Fire Alarm', label: '🔔 Fire Alarm', slug: 'fire-alarm', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Emergency Lamp': {
    type: 'Emergency Lamp', label: '💡 Emergency Lamp', slug: 'emergency-lamp', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'APD': {
    type: 'APD', label: '🦺 APD', slug: 'apd', group: 'legacy',
    allOK: true,
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Toilet': {
    type: 'Toilet', label: '🚻 Toilet', slug: 'toilet', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Electrical': {
    type: 'Electrical', label: '⚡ Electrical', slug: 'electrical', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Lift Barang - Inspeksi': {
    type: 'Lift Barang - Inspeksi', label: '🏗️ Lift Barang - Inspeksi',
    slug: 'lift-barang', group: 'legacy', inspectionType: 'inspeksi',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Lift Barang - Preventive': {
    type: 'Lift Barang - Preventive', label: '🏗️ Lift Barang - Preventive',
    slug: 'lift-barang', group: 'legacy', inspectionType: 'preventive',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Exit Lamp': {
    type: 'Exit Lamp', label: '🚪 Exit Lamp', slug: 'exit-lamp', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Pintu Darurat': {
    type: 'Pintu Darurat', label: '🚨 Pintu Darurat', slug: 'pintu-darurat', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Titik Kumpul': {
    type: 'Titik Kumpul', label: '📍 Titik Kumpul', slug: 'titik-kumpul', group: 'legacy',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },

  // ── GA Unified ───────────────────────────────────────────
  'Tangga Listrik': {
    type: 'Tangga Listrik', label: '🪜 Tangga Listrik', slug: 'tg-listrik', group: 'ga',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Infrastruktur Jalan': {
    type: 'Infrastruktur Jalan', label: '🛣️ Infrastruktur Jalan', slug: 'inf-jalan', group: 'ga',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Inspeksi APD': {
    type: 'Inspeksi APD', label: '🦺 Inspeksi APD', slug: 'inspeksi-apd', group: 'ga',
    allOK: true,
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Inspeksi Hydrant': {
    type: 'Inspeksi Hydrant', label: '🚒 Inspeksi Hydrant', slug: 'inspeksi-hydrant', group: 'ga',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Selang Hydrant': {
    type: 'Selang Hydrant', label: '🌊 Selang Hydrant', slug: 'selang-hydrant', group: 'ga',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Panel Listrik': {
    type: 'Panel Listrik', label: '🔌 Panel Listrik', slug: 'panel', group: 'ga',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
  'Smoke Detector': {
    type: 'Smoke Detector', label: '💨 Smoke Detector', slug: 'smoke-detector', group: 'ga',
    analyticsEndpoint: ANALYTICS, historyEndpoint: HISTORY,
  },
};

// ============================================
// CONSTANTS
// ============================================

export const ANALYTICS_PERIODS = [
  { value: 'daily',   label: 'Harian'   },
  { value: 'weekly',  label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan'  },
] as const;

export const HISTORY_LIMITS = [10, 20, 50, 100] as const;

// ============================================
// PUBLIC FUNCTIONS
// ============================================

export function getFormConfig(formType: string): FormConfig | null {
  const config = FORM_CONFIGS[formType];
  if (!config) {
    console.warn(`⚠️ Form config not found: "${formType}"`);
    return null;
  }
  return { ...config };
}

/**
 * Build params untuk /api/analytics
 */
export function buildAnalyticsParams(
  config: FormConfig,
  options: { period: string; dateFrom: string; dateTo: string; area?: string }
): Record<string, string> {
  const params: Record<string, string> = {
    slug:     config.slug,
    dateFrom: options.dateFrom,
    dateTo:   options.dateTo,
    period:   options.period,
  };

  if (config.inspectionType) {
    params.inspectionType = config.inspectionType;
    params.formType       = config.inspectionType;
  }

  if (options.area && options.area !== 'All Category' && options.area !== 'Semua Kategori') {
    const areaMap: Record<string, string> = {
      'fire-alarm':     'zona',
      'apd':            'jenis_apd',
      'toilet':         'area_code',
      'electrical':     'area',
      'apar':           'area',
      'emergency-lamp': 'area',
      'lift-barang':    'area',
    };
    params[areaMap[config.slug] ?? 'area'] = options.area;
  }

  return params;
}

export function requiresInspectionType(formType: string): boolean {
  return !!getFormConfig(formType)?.inspectionType;
}

export function getFormsBySlug(slug: string): FormConfig[] {
  return Object.values(FORM_CONFIGS).filter(c => c.slug === slug);
}

export default { FORM_TYPES, getFormConfig, buildAnalyticsParams, requiresInspectionType, getFormsBySlug };