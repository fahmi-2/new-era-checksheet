// lib/analytics-mapper.ts

// ============================================
// INTERFACES
// ============================================

export interface AnalyticsResponse {
  success: boolean;
  data: Array<{ date: string; status: string; count: number }>;
}

export interface TopUsersResponse {
  success: boolean;
  data: Array<{ name: string; count: number }>;
}

export interface DashboardData {
  stats: {
    total: number;
    completed: number;
    pending: number;
    completionRate: string;
  };
  trendData:        Array<{ date: string; count: number }>;
  distributionData: Array<{ category: string; status: string; count: number }>;
  topUsers:         Array<{ name: string; count: number }>;
  historyData:      Array<{
    filledAt:  string;
    area:      string;
    category:  string;
    shift:     string;
    status:    string;
    ngCount:   number;
    filledBy:  string;
    formType?: string;
  }>;
}

// ============================================
// HELPERS
// ============================================

function clean(params: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

/**
 * ✅ IMPROVED: Safe timestamp parser dengan fallback
 */
function parseTimestamp(value: string | null | undefined, fieldName: string = 'timestamp'): string {
  if (!value) {
    console.warn(`⚠️ [Mapper] Missing ${fieldName}, using current date`);
    return new Date().toISOString();
  }
  
  try {
    // Jika sudah ISO format, return as-is
    if (value.includes('T') || value.includes('Z') || value.length === 19) {
      return new Date(value).toISOString();
    }
    // Jika format YYYY-MM-DD, convert ke timestamp
    if (value.length === 10 && value.includes('-')) {
      return new Date(`${value}T00:00:00Z`).toISOString();
    }
    return new Date(value).toISOString();
  } catch (err) {
    console.warn(`⚠️ [Mapper] Failed to parse ${fieldName}="${value}":`, err);
    return new Date().toISOString();
  }
}

/**
 * ✅ IMPROVED: Safe numeric parser dengan validation
 */
function parseInteger(value: any, fieldName: string = 'count', defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) return parsed;
  }
  console.warn(`⚠️ [Mapper] Invalid ${fieldName}="${value}", using default=${defaultValue}`);
  return defaultValue;
}

// ============================================
// fetchAnalytics
// ============================================

export async function fetchAnalytics(
  endpoint: string,
  params: Record<string, string | undefined>
): Promise<AnalyticsResponse | null> {
  try {
    const url = `/e-checksheet-ga/api${endpoint}?${new URLSearchParams(clean(params)).toString()}`;
    console.log('📊 [Analytics] GET', url);

    const res = await fetch(url, {
      method: 'GET', 
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.error('❌ [Analytics] HTTP', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    
    // ✅ IMPROVED: Multiple format detection
    let responseData: any[] = [];
    if (data.success && Array.isArray(data.formattedData)) {
      responseData = data.formattedData;
    } else if (data.success && Array.isArray(data.data)) {
      responseData = data.data;
    } else if (Array.isArray(data)) {
      responseData = data;
    } else {
      console.warn('⚠️ [Analytics] Unknown response format:', data);
      return null;
    }

    // ✅ IMPROVED: Validate response structure
    const validated = responseData.every((item: any) => 
      item.date !== undefined && item.status !== undefined && item.count !== undefined
    );
    
    if (!validated) {
      console.warn('⚠️ [Analytics] Some items missing required fields');
    }

    console.log(`✅ [Analytics] Received ${responseData.length} rows:`, {
      dates: [...new Set(responseData.map(d => d.date))].slice(0, 3),
      statuses: [...new Set(responseData.map(d => d.status))],
      totalCount: responseData.reduce((s, d) => s + (d.count || 0), 0),
    });

    return { 
      success: true, 
      data: responseData 
    };
  } catch (err) {
    console.error('❌ [Analytics] Fetch failed:', err);
    return null;
  }
}

// ============================================
// fetchTopUsers
// ============================================

export async function fetchTopUsers(
  endpoint: string = '/analytics/top-users',
  params: Record<string, string | undefined>
): Promise<TopUsersResponse['data']> {
  try {
    const url = `/e-checksheet-ga/api${endpoint}?${new URLSearchParams(clean(params)).toString()}`;
    console.log('👥 [TopUsers] GET', url);

    const res = await fetch(url, {
      method: 'GET', 
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.error('❌ [TopUsers] HTTP', res.status);
      return [];
    }

    const result = await res.json();
    
    // ✅ IMPROVED: Validate response
    if (result?.success && Array.isArray(result.data)) {
      // Validate each user object
      const validUsers = result.data.filter((u: any) => 
        typeof u.name === 'string' && typeof u.count === 'number'
      );
      
      if (validUsers.length !== result.data.length) {
        console.warn(`⚠️ [TopUsers] ${result.data.length - validUsers.length} invalid users filtered out`);
      }
      
      console.log('✅ [TopUsers]', validUsers.length, 'users');
      return validUsers;
    }
    
    console.warn('⚠️ [TopUsers] Invalid response format');
    return [];
  } catch (err) {
    console.error('❌ [TopUsers] Fetch failed:', err);
    return [];
  }
}

// ============================================
// fetchHistory  — UNIFIED ENDPOINT
// ============================================

export async function fetchHistory(
  _endpoint: string,        // diabaikan — selalu pakai unified endpoint
  slug: string,
  area?: string,
  limit: number = 10,
  dateFrom?: string,
  dateTo?: string,
  page: number = 1,
  extraParams?: Record<string, string>
): Promise<{ data: DashboardData['historyData']; total: number; totalPages: number }> {
  try {
    // Selalu gunakan unified endpoint
    const UNIFIED = '/e-checksheet-ga/api/analytics/history';

    const params = new URLSearchParams({
      slug:  slug.toLowerCase().trim(),
      limit: String(Math.max(limit, 1)), // Allow fetching all records for PDF download
      page:  String(Math.max(page, 1)), // Min: 1
    });

    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo)   params.append('dateTo',   dateTo);
    if (area && area !== 'All Category') params.append('area', area);

    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        if (v) params.append(k, v);
      }
    }

    const url = `${UNIFIED}?${params.toString()}`;
    console.log('📜 [History] GET', url);

    const res = await fetch(url, {
      method: 'GET', 
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      console.error('❌ [History] HTTP', res.status, await res.text());
      return { data: [], total: 0, totalPages: 0 };
    }

    const result = await res.json();
    
    // ✅ IMPROVED: Better status checking
    if (!result?.success || !Array.isArray(result.data)) {
      console.warn('⚠️ [History] Invalid response structure:', result);
      return { data: [], total: 0, totalPages: 0 };
    }

    console.log('✅ [History] total:', result.total, 'pages:', result.totalPages, 'returned:', result.data.length, 'statuses:', [...new Set(result.data.map((r: any) => r.status))]);

    // ✅ IMPROVED: Safe mapping dengan null checks
    const historyData: DashboardData['historyData'] = result.data.map((r: any) => {
      const filledAtRaw = r.filledAt ?? r.filled_at ?? r.checklist_date ?? r.inspection_date ?? '';
      const filledByRaw = r.filledBy ?? r.filled_by ?? r.checker_name ?? r.checker ?? r.inspector ?? r.inspector_name ?? '-';
      
      return {
        filledAt:  parseTimestamp(filledAtRaw, 'filledAt'),
        area:      String(r.area ?? 'N/A').trim() || 'N/A',
        category:  String(r.category ?? r.formType ?? slug ?? 'Unknown').trim() || 'Unknown',
        shift:     String(r.shift ?? 'Pagi').trim() || 'Pagi',
        status:    String(r.status ?? 'OK').toUpperCase() || 'OK',
        ngCount:   parseInteger(r.ngCount ?? r.ng_count ?? 0, 'ngCount', 0),
        filledBy:  String(filledByRaw).trim() || '-',
        formType:  String(r.formType ?? '-').trim() || '-',
      };
    });

    return {
      data:       historyData,
      total:      parseInteger(result.total, 'total', historyData.length),
      totalPages: parseInteger(result.totalPages, 'totalPages', 1),
    };
  } catch (err) {
    console.error('❌ [History] Fetch failed:', err);
    return { data: [], total: 0, totalPages: 0 };
  }
}

// ============================================
// mapAnalyticsToDashboard
// ============================================

export function mapAnalyticsToDashboard(
  analyticsData: Array<{ date: string; status: string; count: number }> | null | undefined,
  formLabel: string,
  topUsersData:   Array<{ name: string; count: number }>    = [],
  historyDataRaw: DashboardData['historyData']               = []
): DashboardData {
  const empty: DashboardData = {
    stats: { total: 0, completed: 0, pending: 0, completionRate: '0.0' },
    trendData: [], 
    distributionData: [],
    topUsers: topUsersData,
    historyData: historyDataRaw,
  };

  if (!analyticsData?.length) {
    console.warn(`⚠️ [Mapper] No analytics data for ${formLabel}`);
    return empty;
  }

  // ✅ IMPROVED: Safe aggregation
  const totalOK = analyticsData
    .filter(d => d.status === 'OK')
    .reduce((s, d) => s + parseInteger(d.count, 'count.OK'), 0);
    
  const totalNG = analyticsData
    .filter(d => d.status === 'NG')
    .reduce((s, d) => s + parseInteger(d.count, 'count.NG'), 0);
    
  const total = totalOK + totalNG;

  if (total === 0) {
    console.warn(`⚠️ [Mapper] Zero total items for ${formLabel}`);
    return empty;
  }

  // ✅ IMPROVED: Duplicate date handling
  const trendMap = new Map<string, number>();
  analyticsData.forEach(d => {
    const existing = trendMap.get(d.date) || 0;
    trendMap.set(d.date, existing + parseInteger(d.count, `count.${d.date}`));
  });

  const trendData = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const distributionData = analyticsData.map(d => ({
    category: d.date,
    status:   d.status,
    count:    parseInteger(d.count, `distribution.${d.date}.${d.status}`),
  }));

  console.log(`✅ [Mapper] ${formLabel}: total=${total}, OK=${totalOK}, NG=${totalNG}`);

  return {
    stats: {
      total,
      completed:      totalOK,
      pending:        totalNG,
      completionRate: total > 0 ? ((totalOK / total) * 100).toFixed(1) : '0.0',
    },
    trendData,
    distributionData,
    topUsers:    topUsersData,
    historyData: historyDataRaw,
  };
}