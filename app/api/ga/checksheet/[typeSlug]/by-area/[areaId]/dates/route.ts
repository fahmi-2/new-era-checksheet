// app/api/ga/checksheet/[typeSlug]/by-area/[areaId]/dates/route.ts

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type RouteParams = {
  typeSlug: string;
  areaId: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { typeSlug, areaId } = await params;

    console.log('🔍 Fetching available dates for type:', typeSlug, 'area:', areaId);

    // Cek type
    const typesResult = await pool.query(
      `SELECT id FROM ga_checksheet_types WHERE slug = $1`,
      [typeSlug]
    );

    if (typesResult.rows.length === 0) {
      console.error('❌ Type not found:', typeSlug);
      return NextResponse.json(
        { success: false, message: 'Jenis checksheet tidak ditemukan' },
        { status: 404 }
      );
    }

    const typeId = typesResult.rows[0].id;

    // ✅ PostgreSQL: TO_CHAR untuk format tanggal
    const datesResult = await pool.query(
      `
      SELECT DISTINCT DATE(check_date) as date
      FROM ga_checksheet_headers
      WHERE type_id = $1 AND area_id = $2
      ORDER BY date DESC
      `,
      [typeId, areaId]
    );

    const availableDates = datesResult.rows.map((row: any) => row.date);

    console.log('✅ Found', availableDates.length, 'dates');
    
    return NextResponse.json({ 
      success: true, 
      data: availableDates
    });
  } catch (error) {
    console.error('❌ Error fetching available dates:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data tanggal' },
      { status: 500 }
    );
  }
}