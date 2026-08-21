// app/api/electrical_inspections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const area = searchParams.get('area');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = `
      SELECT * FROM electrical_inspections
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type) {
      query += ' AND type = $1';
      params.push(type);
    }

    if (area) {
      query += ' AND area = $' + (params.length + 1);
      params.push(area);
    }

    if (startDate && endDate) {
      query += ' AND tanggal BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2);
      params.push(startDate, endDate);
    }

    query += ' ORDER BY tanggal DESC, created_at DESC';

    const result = await pool.query(query, params);
    const headers = result.rows;

    const data: any[] = [];
    
    for (const header of headers) {
      const itemResult = await pool.query(
        'SELECT * FROM electrical_inspection_details WHERE inspection_id = $1 ORDER BY item_no ASC',
        [header.id]
      );
      
      const items: any = {};
      itemResult.rows.forEach(item => {
        items[item.item_no] = {
          hasil: item.hasil,
          keterangan: item.keterangan || '',
          foto_path: item.foto_path
        };
      });
      
      data.push({
        id: header.id.toString(),
        type: header.type,
        tanggal: header.tanggal,
        area: header.area,
        pic: header.pic,
        items: items,
        additionalNotes: header.additional_notes,
        createdAt: header.created_at,
        updatedAt: header.updated_at
      });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Error fetching inspection records:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}