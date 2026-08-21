// app/api/analytics/electrical-inspections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// Interface untuk type safety
interface AreaStatsRow {
  area: string;
  total_checklists: string;
  total_items: string;
  total_nok: string;
}

interface TrendStatsRow {
  period: string;
  total_checklists: string;
  total_items: string;
  total_nok: string;
}

interface SummaryRow {
  total_checklists: string;
  total_items: string;
  total_nok: string;
}

// Helper: Hitung compliance rate
const calculateComplianceRate = (items: number, nok: number): number => {
  if (items === 0) return 100;
  return parseFloat(((items - nok) / items * 100).toFixed(2));
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const period = searchParams.get('period') || 'monthly'; // daily/monthly/yearly
    const type = searchParams.get('type'); // instalasi-listrik | stop-kontak

    // Validasi periode
    if (!['daily', 'monthly', 'yearly'].includes(period)) {
      return NextResponse.json(
        { success: false, message: 'Periode harus daily, monthly, atau yearly' },
        { status: 400 }
      );
    }

    // Bangun kondisi WHERE dinamis
    const whereClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (area) {
      whereClauses.push(`r.area = $${paramIndex}`);
      params.push(area);
      paramIndex++;
    }

    if (dateFrom) {
      whereClauses.push(`r.tanggal >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClauses.push(`r.tanggal <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    if (type) {
      whereClauses.push(`r.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Summary Metrics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT r.id) AS total_checklists,
        COUNT(d.id) AS total_items,
        SUM(CASE WHEN d.hasil = 'NOK' THEN 1 ELSE 0 END) AS total_nok
      FROM electrical_inspections r
      LEFT JOIN electrical_inspection_details d ON r.id = d.inspection_id
      ${whereClause}
    `;

    // 2. Compliance by Area
    const areaQuery = `
      SELECT 
        r.area,
        COUNT(DISTINCT r.id) AS total_checklists,
        COUNT(d.id) AS total_items,
        SUM(CASE WHEN d.hasil = 'NOK' THEN 1 ELSE 0 END) AS total_nok
      FROM electrical_inspections r
      LEFT JOIN electrical_inspection_details d ON r.id = d.inspection_id
      ${whereClause}
      GROUP BY r.area
      ORDER BY total_nok DESC
    `;

    // 3. Trend Analysis (daily/monthly/yearly)
    const periodFormat = period === 'daily' ? 'YYYY-MM-DD' : 
                         period === 'monthly' ? 'YYYY-MM' : 'YYYY';
    
    const trendQuery = `
      SELECT 
        TO_CHAR(r.tanggal, '${periodFormat}') AS period,
        COUNT(DISTINCT r.id) AS total_checklists,
        COUNT(d.id) AS total_items,
        SUM(CASE WHEN d.hasil = 'NOK' THEN 1 ELSE 0 END) AS total_nok
      FROM electrical_inspections r
      LEFT JOIN electrical_inspection_details d ON r.id = d.inspection_id
      ${whereClause}
      GROUP BY TO_CHAR(r.tanggal, '${periodFormat}')
      ORDER BY period ASC
    `;

    // Eksekusi semua query secara paralel
    const [summaryRes, areaRes, trendRes] = await Promise.all([
      pool.query<SummaryRow>(summaryQuery, params),
      pool.query<AreaStatsRow>(areaQuery, params),
      pool.query<TrendStatsRow>(trendQuery, params)
    ]);

    const summary = summaryRes.rows[0];
    const totalItems = parseInt(summary?.total_items || '0');
    const totalNok = parseInt(summary?.total_nok || '0');
    const complianceRate = calculateComplianceRate(totalItems, totalNok);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalChecklists: parseInt(summary?.total_checklists || '0'),
          totalItems,
          totalNok,
          complianceRate,
          nokRate: parseFloat((100 - complianceRate).toFixed(2))
        },
        byArea: areaRes.rows.map((row: AreaStatsRow) => {
          const items = parseInt(row.total_items || '0');
          const nok = parseInt(row.total_nok || '0');
          return {
            area: row.area,
            totalChecklists: parseInt(row.total_checklists || '0'),
            totalItems: items,
            totalNok: nok,
            complianceRate: calculateComplianceRate(items, nok)
          };
        }),
        trend: trendRes.rows.map((row: TrendStatsRow) => {
          const items = parseInt(row.total_items || '0');
          const nok = parseInt(row.total_nok || '0');
          return {
            period: row.period,
            totalChecklists: parseInt(row.total_checklists || '0'),
            totalItems: items,
            totalNok: nok,
            complianceRate: calculateComplianceRate(items, nok)
          };
        })
      }
    });

  } catch (error) {
    console.error('Analytics electrical inspections error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data analitik',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}