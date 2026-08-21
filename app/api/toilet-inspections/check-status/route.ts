// app/api/toilet-inspections/check-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaCode = searchParams.get('area_code');
    const inspectionDate = searchParams.get('inspection_date');
    const toiletType = searchParams.get('toilet_type') || 'laki_perempuan';

    // Validasi required parameters
    if (!areaCode || !inspectionDate) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'area_code dan inspection_date diperlukan' 
        },
        { status: 400 }
      );
    }

    // ✅ PostgreSQL: Gunakan $1, $2, $3 untuk parameter binding
    const result = await pool.query(
      `SELECT * FROM toilet_inspections 
       WHERE area_code = $1 
       AND inspection_date = $2 
       AND toilet_type = $3`,
      [areaCode, inspectionDate, toiletType]
    );

    if (result.rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        filled: true,
        data: result.rows[0]
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        filled: false,
        data: null
      });
    }
  } catch (error) {
    console.error('❌ Check status error:', error);
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