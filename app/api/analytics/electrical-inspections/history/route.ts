// app/api/electrical-inspections/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let query = `
      SELECT 
        r.id,
        r.tanggal,
        r.created_at as filled_at,
        r.area,
        r.type as category,
        'Pagi' as shift,
        CASE 
          WHEN COUNT(d.id) = COUNT(CASE WHEN d.hasil = 'OK' THEN 1 END) 
          THEN 'OK' ELSE 'NOK' 
        END as status,
        COUNT(CASE WHEN d.hasil = 'NOK' THEN 1 END) as ng_count,
        r.pic as filled_by
      FROM electrical_inspections r
      LEFT JOIN electrical_inspection_details d ON r.id = d.inspection_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (type) {
      query += ` AND r.type = $${params.length + 1}`;
      params.push(type);
    }
    
    query += `
      GROUP BY r.id, r.tanggal, r.created_at, r.area, r.type, r.pic
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await pool.query(query, params);
    
    return NextResponse.json({
      success: true,
      data: result.rows.map((row: any) => ({
        filledAt: row.filled_at,
        area: row.area,
        category: row.category,
        shift: row.shift,
        status: row.status,
        ngCount: parseInt(row.ng_count),
        filledBy: row.filled_by
      }))
    });
    
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}