import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Parameter slug diperlukan' },
        { status: 400 }
      );
    }

    // Ambil data master terbaru untuk setiap lokasi di area ini
    const result = await pool.query(
      `SELECT DISTINCT ON (i.lokasi) 
        i.no, i.jenis_apar, i.lokasi, i.no_apar, 
        i.exp_date, i.hydrotest_date
       FROM apar_items i
       JOIN apar_records r ON i.record_id = r.id
       WHERE r.area = $1
       ORDER BY i.lokasi, r.submitted_at DESC`,
      [slug]
    );

    return NextResponse.json({
      success: true,
      data: result.rows.map((row: any) => ({
        no: row.no,
        jenisApar: row.jenis_apar,
        lokasi: row.lokasi,
        noApar: row.no_apar,
        expDate: row.exp_date,
        hydrotestDate: row.hydrotest_date
      }))
    });
  } catch (error) {
    console.error('Get master data error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}