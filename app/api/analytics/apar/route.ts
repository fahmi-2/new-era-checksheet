// app/api/analytics/apar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';
// Tambahkan di baris paling atas file route.ts
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  };
};
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area'); // opsional: filter area tertentu
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const period = searchParams.get('period') || 'monthly'; // daily/monthly/yearly

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
      whereClauses.push(`r.date >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClauses.push(`r.date <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Summary Metrics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT r.id) AS total_checklists,
        COUNT(i.id) AS total_items,
        SUM(
          (CASE WHEN i.check1 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check2 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check3 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check4 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check5 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check6 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check7 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check8 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check9 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check10 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check11 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check12 = 'X' THEN 1 ELSE 0 END)
        ) AS total_ng
      FROM apar_records r
      JOIN apar_items i ON r.id = i.record_id
      ${whereClause}
    `;

    // 2. Compliance by Area
    const areaQuery = `
      SELECT 
        r.area,
        COUNT(DISTINCT r.id) AS total_checklists,
        COUNT(i.id) AS total_items,
        SUM(
          (CASE WHEN i.check1 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check2 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check3 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check4 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check5 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check6 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check7 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check8 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check9 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check10 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check11 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check12 = 'X' THEN 1 ELSE 0 END)
        ) AS total_ng
      FROM apar_records r
      JOIN apar_items i ON r.id = i.record_id
      ${whereClause}
      GROUP BY r.area
      ORDER BY total_ng DESC
    `;

    // 3. Trend Analysis (daily/monthly/yearly)
    const periodFormat = period === 'daily' ? 'YYYY-MM-DD' : 
                         period === 'monthly' ? 'YYYY-MM' : 'YYYY';
    
    const trendQuery = `
      SELECT 
        TO_CHAR(r.date, '${periodFormat}') AS period,
        COUNT(DISTINCT r.id) AS total_checklists,
        COUNT(i.id) AS total_items,
        SUM(
          (CASE WHEN i.check1 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check2 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check3 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check4 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check5 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check6 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check7 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check8 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check9 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check10 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check11 = 'X' THEN 1 ELSE 0 END) +
          (CASE WHEN i.check12 = 'X' THEN 1 ELSE 0 END)
        ) AS total_ng
      FROM apar_records r
      JOIN apar_items i ON r.id = i.record_id
      ${whereClause}
      GROUP BY TO_CHAR(r.date, '${periodFormat}')
      ORDER BY period ASC
    `;

    // Eksekusi semua query secara paralel
    const [summaryRes, areaRes, trendRes] = await Promise.all([
      pool.query(summaryQuery, params),
      pool.query(areaQuery, params),
      pool.query(trendQuery, params)
    ]);

    const summary = summaryRes.rows[0];
    const totalItems = parseInt(summary.total_items || 0);
    const totalNg = parseInt(summary.total_ng || 0);
    const complianceRate = totalItems > 0 
      ? parseFloat(((totalItems - totalNg) / totalItems * 100).toFixed(2)) 
      : 100;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalChecklists: parseInt(summary.total_checklists || 0),
          totalItems,
          totalNg,
          complianceRate,
          ngRate: parseFloat((100 - complianceRate).toFixed(2))
        },
        byArea: areaRes.rows.map((row: { 
  area: string; 
  total_checklists: string; 
  total_items: string; 
  total_ng: string; 
}) => {
  const items = parseInt(row.total_items || '0');
  const ng = parseInt(row.total_ng || '0');
  return {
    area: row.area,
    totalChecklists: parseInt(row.total_checklists || '0'),
    totalItems: items,
    totalNg: ng,
    complianceRate: items > 0 ? parseFloat(((items - ng) / items * 100).toFixed(2)) : 100
  };
}),
        trend: trendRes.rows.map((row: { 
  period: string; 
  total_checklists: string; 
  total_items: string; 
  total_ng: string; 
}) => {
  const items = parseInt(row.total_items || '0');
  const ng = parseInt(row.total_ng || '0');
  return {
    period: row.period,
    totalChecklists: parseInt(row.total_checklists || '0'),
    totalItems: items,
    totalNg: ng,
    complianceRate: items > 0 ? parseFloat(((items - ng) / items * 100).toFixed(2)) : 100
  };
})
      }
    });
  } catch (error) {
    console.error('Analytics APAR error:', error);
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