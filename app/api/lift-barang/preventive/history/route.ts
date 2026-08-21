// app/api/lift-barang/preventive/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const inspector = searchParams.get('inspector');
    const status = searchParams.get('status'); // 'OK', 'NG', atau 'all'
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Build WHERE clause dengan parameterized query
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (dateFrom) {
      whereConditions.push(`h.inspection_date >= $${paramIndex++}`);
      queryParams.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push(`h.inspection_date <= $${paramIndex++}`);
      queryParams.push(dateTo);
    }
    if (inspector) {
      whereConditions.push(`h.inspector ILIKE $${paramIndex++}`);
      queryParams.push(`%${inspector}%`);
    }
    if (status && ['OK', 'NG'].includes(status)) {
      // Filter berdasarkan ada/tidaknya item NG
      if (status === 'NG') {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM preventive_items i 
          WHERE i.header_id = h.id AND i.status = 'NG'
        )`);
      } else {
        whereConditions.push(`NOT EXISTS (
          SELECT 1 FROM preventive_items i 
          WHERE i.header_id = h.id AND i.status = 'NG'
        )`);
      }
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const client = await pool.connect();
    
    try {
      // Set timeout
      await client.query('SET statement_timeout = 30000');

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT h.id) as total 
        FROM preventive_header h
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Fetch records dengan aggregation items
      queryParams.push(limit, offset);
      
      const recordsQuery = `
        SELECT 
          h.id,
          h.inspection_date,
          h.inspector,
          h.inspector_nik,
          h.additional_notes,
          h.created_at,
          h.updated_at,
          COUNT(i.id) as items_count,
          COUNT(CASE WHEN i.status = 'NG' THEN 1 END) as ng_count,
          ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'item_id', i.item_id,
              'item_name', i.item_name,
              'status', i.status,
              'keterangan', i.keterangan,
              'foto_path', i.foto_path
            )
          ) FILTER (WHERE i.id IS NOT NULL) as items_detail
        FROM preventive_header h
        LEFT JOIN preventive_items i ON h.id = i.header_id
        ${whereClause}
        GROUP BY h.id
        ORDER BY h.inspection_date DESC, h.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      const recordsResult = await client.query(recordsQuery, queryParams);

      // Format response sesuai expectation frontend
      const records = recordsResult.rows.map((row) => {
        // Parse items_detail dari PostgreSQL JSON array
        const itemsDetail = row.items_detail?.[0] ? 
          (Array.isArray(row.items_detail) ? row.items_detail : [row.items_detail]) 
          .reduce((acc: Record<string, any>, item: any) => {
            if (item?.item_id) {
              acc[item.item_id] = {
                status: item.status,
                keterangan: item.keterangan || '',
                foto_path: item.foto_path
              };
            }
            return acc;
          }, {}) : {};

        const ngCount = parseInt(row.ng_count) || 0;
        
        return {
          id: row.id.toString(),
          date: row.inspection_date, // Pastikan format YYYY-MM-DD
          inspector: row.inspector,
          inspectorNik: row.inspector_nik,
          items: itemsDetail,
          itemsCount: parseInt(row.items_count) || 0,
          ngCount: ngCount,
          additionalNotes: row.additional_notes,
          status: ngCount > 0 ? 'NG' : 'OK',
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });

      const duration = Date.now() - startTime;
      console.log(`⏱️ Lift preventive history fetched: ${records.length} records in ${duration}ms`);

      return NextResponse.json(
        {
          success: true,
          message: 'Data riwayat berhasil diambil',
          data: {
            records,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
              hasNext: offset + limit < total,
              hasPrev: page > 1
            }
          }
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ Fetch lift preventive history error:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      query: error?.query,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });

    // Handle PostgreSQL specific errors
    switch (error?.code) {
      case '42P01': // undefined_table
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tabel preventive_header/preventive_items tidak ditemukan',
            hint: 'Jalankan migration SQL untuk membuat tabel preventive lift barang'
          },
          { status: 500 }
        );
      case '42703': // undefined_column
        return NextResponse.json(
          { 
            success: false, 
            message: 'Kolom tabel tidak sesuai',
            detail: error?.detail 
          },
          { status: 500 }
        );
      case '08001':
      case '08006':
        return NextResponse.json(
          { success: false, message: 'Koneksi database gagal' },
          { status: 503 }
        );
      case '22007': // invalid_datetime_format
        return NextResponse.json(
          { success: false, message: 'Format tanggal filter tidak valid. Gunakan YYYY-MM-DD' },
          { status: 400 }
        );
    }

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data riwayat preventive lift barang',
        error: isDev ? error?.message : undefined,
        debug: isDev ? { code: error?.code, detail: error?.detail } : undefined
      },
      { status: 500 }
    );
  }
}