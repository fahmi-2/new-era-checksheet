import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    // Jika tidak ada slug, kembalikan master data ringkasan per area atau seluruh area
    if (!slug) {
      const allQuery = `
        WITH latest_records AS (
          SELECT DISTINCT ON (r.area, i.no_apar)
            r.area,
            i.id as item_id,
            i.no as no,
            i.jenis_apar,
            i.lokasi,
            i.no_apar,
            i.exp_date,
            i.hydrotest_date,
            r.submitted_at
          FROM apar_items i
          JOIN apar_records r ON i.record_id = r.id
          ORDER BY r.area, i.no_apar, r.submitted_at DESC
        )
        SELECT 
          area,
          COUNT(item_id)::int as count
        FROM latest_records
        GROUP BY area
      `;

      const allResult = await pool.query(allQuery);
      const areaCounts: Record<string, number> = {};
      allResult.rows.forEach((row: any) => {
        areaCounts[row.area] = parseInt(row.count) || 0;
      });

      return NextResponse.json({
        success: true,
        countsByArea: areaCounts,
        totalApar: Object.values(areaCounts).reduce((a, b) => a + b, 0)
      });
    }

    // Query untuk mendapatkan data master dari record terbaru untuk setiap APAR
    // Kita ambil data dari tabel apar_items berdasarkan record_id terakhir
    const query = `
      WITH latest_records AS (
        SELECT DISTINCT ON (i.no_apar)
          i.id as item_id,
          i.no as no,
          i.jenis_apar,
          i.lokasi,
          i.no_apar,
          i.exp_date,
          i.hydrotest_date,
          r.submitted_at
        FROM apar_items i
        JOIN apar_records r ON i.record_id = r.id
        WHERE r.area = $1
        ORDER BY i.no_apar, r.submitted_at DESC
      )
      SELECT 
        item_id,
        no,
        jenis_apar,
        lokasi,
        no_apar,
        exp_date,
        hydrotest_date
      FROM latest_records
      ORDER BY no ASC
    `;

    const result = await pool.query(query, [slug]);

    // Transform data ke format yang diharapkan frontend
    const masterData = result.rows.map((row: any) => ({
      no: row.no,
      jenisApar: row.jenis_apar || '',
      lokasi: row.lokasi || '',
      noApar: row.no_apar || '',
      expDate: row.exp_date || '',
      hydrotestDate: row.hydrotest_date || ''
    }));

    return NextResponse.json({
      success: true,
      data: masterData,
      count: masterData.length
    });

  } catch (error) {
    console.error('Get APAR master data error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server',
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
