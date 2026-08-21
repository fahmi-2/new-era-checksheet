import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const recordId = searchParams.get('record_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Parameter slug diperlukan' },
        { status: 400 }
      );
    }

    // ✅ Jika ada record_id, ambil record spesifik untuk edit
    if (recordId) {
      const recordResult = await pool.query(
        `SELECT * FROM apar_records WHERE id = $1 AND area = $2`,
        [recordId, slug]
      );
      
      if (recordResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Record tidak ditemukan' },
          { status: 404 }
        );
      }
      
      const record = recordResult.rows[0];
      const itemsResult = await pool.query(
        `SELECT * FROM apar_items WHERE record_id = $1 ORDER BY no ASC`,
        [record.id]
      );
      
      return NextResponse.json({
        success: true,
        data: [{
          id: record.id,
          date: record.date,
          area: record.area,
          checker: record.checker,
          checker_nik: record.checker_nik,
          submitted_at: record.submitted_at,
          items: itemsResult.rows.map((item: any) => ({
            itemId: item.id,
            no: item.no,
            jenisApar: item.jenis_apar || '',
            lokasi: item.lokasi || '',
            noApar: item.no_apar || '',
            expDate: item.exp_date || '',
            hydrotestDate: item.hydrotest_date || null,
            check1: item.check1 || 'OK',
            check2: item.check2 || 'OK',
            check3: item.check3 || 'OK',
            check4: item.check4 || 'OK',
            check5: item.check5 || 'OK',
            check6: item.check6 || 'OK',
            check7: item.check7 || 'OK',
            check8: item.check8 || 'OK',
            check9: item.check9 || 'OK',
            check10: item.check10 || 'OK',
            check11: item.check11 || 'OK',
            check12: item.check12 || 'OK',
            keterangan: item.keterangan || '',
            tindakanPerbaikan: item.tindakan_perbaikan || '',
            pic: item.pic || '',
            foto: item.foto ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}` : null
          }))
        }]
      });
    }

    // ✅ Query untuk mendapatkan records dengan filter
    let query = `
      SELECT r.id, r.date, r.area, r.checker, r.checker_nik, r.submitted_at,
             COUNT(i.id) as item_count,
             SUM(CASE WHEN i.check1 = 'NG' OR i.check2 = 'NG' OR i.check3 = 'NG' OR
                        i.check4 = 'NG' OR i.check5 = 'NG' OR i.check6 = 'NG' OR
                        i.check7 = 'NG' OR i.check8 = 'NG' OR i.check9 = 'NG' OR
                        i.check10 = 'NG' OR i.check11 = 'NG' OR i.check12 = 'NG'
                      THEN 1 ELSE 0 END) as ng_count
      FROM apar_records r
      LEFT JOIN apar_items i ON r.id = i.record_id
      WHERE r.area = $1
    `;
    
    const params: any[] = [slug];
    let paramIndex = 2;

    if (dateFrom) {
      query += ` AND r.date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }
    
    if (dateTo) {
      query += ` AND r.date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    query += ` GROUP BY r.id ORDER BY r.submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // ✅ Count query
    let countQuery = `
      SELECT COUNT(DISTINCT r.id) as total 
      FROM apar_records r
      WHERE r.area = $1
    `;
    const countParams: any[] = [slug];
    
    if (dateFrom) {
      countQuery += ` AND r.date >= $${countParams.length + 1}`;
      countParams.push(dateFrom);
    }
    
    if (dateTo) {
      countQuery += ` AND r.date <= $${countParams.length + 1}`;
      countParams.push(dateTo);
    }

    const [countResult, recordsResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(query, params)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const records = recordsResult.rows;

    // ✅ Ambil items untuk setiap record
    const recordsWithItems = await Promise.all(records.map(async (record: any) => {
      const itemsResult = await pool.query(
        `SELECT * FROM apar_items WHERE record_id = $1 ORDER BY no ASC`,
        [record.id]
      );
      
      return {
        id: record.id,
        date: record.date,
        area: record.area,
        checker: record.checker,
        checker_nik: record.checker_nik,
        submitted_at: record.submitted_at,
        itemCount: parseInt(record.item_count) || 0,
        ngCount: parseInt(record.ng_count) || 0,
        items: itemsResult.rows.map((item: any) => ({
          itemId: item.id,
          no: item.no || 0,
          jenisApar: item.jenis_apar || '',
          lokasi: item.lokasi || '',
          noApar: item.no_apar || '',
          expDate: item.exp_date || '',
          hydrotestDate: item.hydrotest_date || null,
          check1: item.check1 || 'OK',
          check2: item.check2 || 'OK',
          check3: item.check3 || 'OK',
          check4: item.check4 || 'OK',
          check5: item.check5 || 'OK',
          check6: item.check6 || 'OK',
          check7: item.check7 || 'OK',
          check8: item.check8 || 'OK',
          check9: item.check9 || 'OK',
          check10: item.check10 || 'OK',
          check11: item.check11 || 'OK',
          check12: item.check12 || 'OK',
          keterangan: item.keterangan || '',
          tindakanPerbaikan: item.tindakan_perbaikan || '',
          pic: item.pic || '',
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
          hasMore: offset + recordsWithItems.length < total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get APAR history error:', error);
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