// app/api/emergency-lamp/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!area) {
      return NextResponse.json(
        { success: false, message: 'Parameter area diperlukan' },
        { status: 400 }
      );
    }

    // Build dynamic query
    const filters = ['r.area = $1'];
    const params: any[] = [area];
    let paramIndex = 2;

    if (dateFrom) {
      filters.push(`r.date >= $${paramIndex}`);
      params.push(dateFrom);
      paramIndex++;
    }
    
    if (dateTo) {
      filters.push(`r.date <= $${paramIndex}`);
      params.push(dateTo);
      paramIndex++;
    }

    const whereClause = filters.join(' AND ');
    
    // Query untuk mendapatkan records dengan count items dan NG
    const query = `
      SELECT r.*,
             COUNT(i.id) as item_count,
             SUM(CASE WHEN i.kondisi_lampu = 'NG' OR i.indicator_lamp = 'NG' OR 
                        i.battery_charger = 'NG' OR i.id_number = 'NG' OR 
                        i.kebersihan = 'NG' OR i.kondisi_kabel = 'NG'
                      THEN 1 ELSE 0 END) as ng_count
      FROM emergency_lamp_records r
      LEFT JOIN emergency_lamp_items i ON r.id = i.record_id
      WHERE ${whereClause}
      GROUP BY r.id
      ORDER BY r.submitted_at DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM emergency_lamp_records 
      WHERE area = $1
      ${dateFrom ? ` AND date >= $2` : ''}
      ${dateTo ? ` AND date <= $${dateFrom ? '3' : '2'}` : ''}
    `;
    
    const countParams = [
      area,
      ...dateFrom ? [dateFrom] : [],
      ...dateTo ? [dateTo] : []
    ];

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Get records
    const recordsResult = await pool.query(query, params);
    const records = recordsResult.rows;

    // Ambil items untuk setiap record
    const recordsWithItems = await Promise.all(records.map(async (record: any) => {
      const itemsResult = await pool.query(
        `SELECT * FROM emergency_lamp_items WHERE record_id = $1 ORDER BY no ASC`,
        [record.id]
      );
      
      return {
        id: record.id,
        date: record.date,
        area: record.area,
        checker: record.checker,
        checkerNik: record.checker_nik,
        submittedAt: record.submitted_at,
        itemCount: parseInt(record.item_count),
        ngCount: parseInt(record.ng_count),
        items: itemsResult.rows.map((item: any) => ({
          no: item.no,
          lokasi: item.lokasi,
          id: item.id_lamp,
          kondisiLampu: item.kondisi_lampu,
          indicatorLamp: item.indicator_lamp,
          batteryCharger: item.battery_charger,
          idNumber: item.id_number,
          kebersihan: item.kebersihan,
          kondisiKabel: item.kondisi_kabel,
          keterangan: item.keterangan || "",
          tindakanPerbaikan: item.tindakan_perbaikan || "",
          pic: item.pic,
          foto: item.foto ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}` : null
        }))
      };
    }));

    return NextResponse.json(
      {
        success: true,
        data: recordsWithItems,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get Emergency Lamp history error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}