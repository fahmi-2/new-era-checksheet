// app/api/apd/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jenisApd = searchParams.get('jenis_apd');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query dengan parameter PostgreSQL
    let query = `SELECT * FROM apd_records WHERE 1=1`;
    const params: any[] = [];

    if (jenisApd) {
      query += ' AND jenis_apd = $1';
      params.push(jenisApd);
    }
    if (dateFrom) {
      query += ' AND date >= $' + (params.length + 1);
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND date <= $' + (params.length + 1);
      params.push(dateTo);
    }
    query += ' ORDER BY submitted_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    // Hitung total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM apd_records WHERE 1=1
       ${jenisApd ? ' AND jenis_apd = $1' : ''}
       ${dateFrom ? ' AND date >= $' + (jenisApd ? 2 : 1) : ''}
       ${dateTo ? ' AND date <= $' + (jenisApd || dateFrom ? 3 : 1) : ''}`,
      [
        ...jenisApd ? [jenisApd] : [],
        ...dateFrom ? [dateFrom] : [],
        ...dateTo ? [dateTo] : []
      ]
    );
    const total = countResult.rows[0].total;

    // Ambil data
    const records = await pool.query(query, params);
    
    // Transform data with items
    const data = await Promise.all(records.rows.map(async (record) => {
      const itemsResult = await pool.query(
        'SELECT * FROM apd_items WHERE record_id = $1 ORDER BY no ASC',
        [record.id]
      );
      
      return {
        id: record.id.toString(),
        jenisApd: record.jenis_apd,
        date: record.date,
        checker: record.checker,
        checkerNik: record.checker_nik,
        submittedAt: record.submitted_at,
        items: itemsResult.rows.map(item => ({
          no: item.no,
          nama: item.nama,
          nik: item.nik,
          tglPengambilan: item.tgl_pengambilan,
          dept: item.dept,
          jobDesc: item.job_desc,
          jumlah: item.jumlah,
          keterangan: item.keterangan || ''
        }))
      };
    }));

    return NextResponse.json({
      success: true,
      data: data,
      pagination: {
        total: total,
        limit: limit,
        offset: offset
      }
    });

  } catch (error) {
    console.error('❌ Error fetching APD history:', error);
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
