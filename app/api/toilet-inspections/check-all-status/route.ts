// app/api/toilet-inspections/check-all-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaCodes = searchParams.get('area_codes');
    const inspectionDate = searchParams.get('inspection_date');
    const toiletType = searchParams.get('toilet_type') || 'laki_perempuan';

    // Validasi required parameters
    if (!areaCodes || !inspectionDate) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'area_codes dan inspection_date diperlukan' 
        },
        { status: 400 }
      );
    }

    const areasArray = areaCodes.split(',');

    // ✅ PostgreSQL: Gunakan ANY() dengan array untuk IN clause
    const result = await pool.query(
      `SELECT 
        area_code,
        CASE WHEN COUNT(id) > 0 THEN true ELSE false END as filled,
        MAX(overall_status) as status
       FROM toilet_inspections 
       WHERE area_code = ANY($1::text[]) 
       AND inspection_date = $2
       AND toilet_type = $3
       GROUP BY area_code`,
      [areasArray, inspectionDate, toiletType]
    );

    // Build status map untuk semua area
    const statusMap = new Map<string, any>();
    
    // Initialize all areas as not filled
    areasArray.forEach(area => {
      statusMap.set(area, { 
        area_code: area, 
        filled: false, 
        status: null 
      });
    });

    // Update with actual data from database
    result.rows.forEach((item: any) => {
      statusMap.set(item.area_code, {
        area_code: item.area_code,
        filled: item.filled,
        status: item.status
      });
    });

    const data = Array.from(statusMap.values());

    return NextResponse.json({ 
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Check all status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
      },
      { status: 500 }
    );
  }
}