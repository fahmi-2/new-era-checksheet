// app/api/toilet-inspections/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ✅ Helper: Generate list kolom item untuk SELECT
function getItemColumns(): string {
  const cols: string[] = [];
  for (let i = 1; i <= 13; i++) {
    // Kolom untuk Laki-laki
    cols.push(`item_${i}_hasil_l`);
    cols.push(`item_${i}_keterangan_l`);
    cols.push(`item_${i}_foto_l`);
    cols.push(`item_${i}_tindakan_l`);
    cols.push(`item_${i}_pic_l`);
    // Kolom untuk Perempuan
    cols.push(`item_${i}_hasil_p`);
    cols.push(`item_${i}_keterangan_p`);
    cols.push(`item_${i}_foto_p`);
    cols.push(`item_${i}_tindakan_p`);
    cols.push(`item_${i}_pic_p`);
  }
  return cols.join(',\n        ');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaCode = searchParams.get('area_code');
    const inspectionDate = searchParams.get('inspection_date'); // ✅ Filter tanggal
    const statusFilter = searchParams.get('status'); // ✅ Filter status
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Validasi required parameters
    if (!areaCode) {
      return NextResponse.json(
        { success: false, message: 'area_code diperlukan' },
        { status: 400 }
      );
    }

    // ✅ Validasi limit dan offset
    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      return NextResponse.json(
        { success: false, message: 'Limit harus antara 1-1000' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { success: false, message: 'Offset tidak valid' },
        { status: 400 }
      );
    }

    console.log('🔍 Querying history for area:', areaCode, {
      inspectionDate, statusFilter, limit, offset
    });

    // ✅ Cek apakah tabel ada
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'toilet_inspections'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.error('❌ Table toilet_inspections does not exist');
        return NextResponse.json(
          { 
            success: false, 
            message: 'Tabel toilet_inspections belum ada di database.',
            error: 'table_not_found'
          },
          { status: 500 }
        );
      }
    } catch (tableError) {
      console.error('❌ Table check error:', tableError);
      return NextResponse.json(
        { success: false, message: 'Gagal memeriksa tabel database', error: 'database_error' },
        { status: 500 }
      );
    }

    // ✅ Cek apakah kolom item_11, item_12, item_13 sudah ada
    try {
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'toilet_inspections' 
        AND column_name IN ('item_11_hasil_l', 'item_12_hasil_l', 'item_13_hasil_l')
      `);
      
      const existingColumns = columnCheck.rows.map((r: any) => r.column_name);
      if (existingColumns.length < 3) {
        console.warn('⚠️ Kolom item 11-13 belum lengkap di database. Menjalankan migrasi otomatis...');
        
        // ✅ Auto-migration: Tambahkan kolom yang belum ada
        const migrationSQL = `
          -- Item 11
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_hasil_l VARCHAR(10);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_keterangan_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_foto_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_tindakan_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_pic_l VARCHAR(100);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_hasil_p VARCHAR(10);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_keterangan_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_foto_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_tindakan_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_11_pic_p VARCHAR(100);
          -- Item 12
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_hasil_l VARCHAR(10);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_keterangan_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_foto_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_tindakan_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_pic_l VARCHAR(100);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_hasil_p VARCHAR(10);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_keterangan_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_foto_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_tindakan_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_12_pic_p VARCHAR(100);
          -- Item 13
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_hasil_l VARCHAR(10);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_keterangan_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_foto_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_tindakan_l TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_pic_l VARCHAR(100);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_hasil_p VARCHAR(10);
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_keterangan_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_foto_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_tindakan_p TEXT;
          ALTER TABLE toilet_inspections ADD COLUMN IF NOT EXISTS item_13_pic_p VARCHAR(100);
        `;
        await pool.query(migrationSQL);
        console.log('✅ Auto-migration berhasil');
      }
    } catch (migrationError: any) {
      console.warn('⚠️ Auto-migration error (non-fatal):', migrationError.message);
      // Lanjutkan, jangan block request
    }

    // ✅ Build dynamic WHERE clause
    const whereConditions: string[] = ['area_code = $1'];
    const queryParams: any[] = [areaCode];
    let paramIndex = 2;

    if (inspectionDate) {
      whereConditions.push(`inspection_date = $${paramIndex}`);
      queryParams.push(inspectionDate);
      paramIndex++;
    }

    if (statusFilter && (statusFilter === 'OK' || statusFilter === 'NG')) {
      whereConditions.push(`overall_status = $${paramIndex}`);
      queryParams.push(statusFilter);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // ✅ Get total count dengan filter
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM toilet_inspections WHERE ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);
    console.log('📊 Total records:', total);

    // ✅ SELECT semua kolom termasuk item 1-13
    const itemColumns = getItemColumns();
    
    const dataQuery = `
      SELECT 
        id, user_id, area_code, area_name, 
        inspection_date, inspection_time, 
        toilet_type, inspector_name, inspector_nik,
        overall_status, created_at, updated_at,
        ${itemColumns}
      FROM toilet_inspections
      WHERE ${whereClause}
      ORDER BY inspection_date DESC, inspection_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    console.log('📝 Executing query with', queryParams.length, 'params');

    const dataResult = await pool.query(dataQuery, queryParams);

    console.log('✅ Retrieved', dataResult.rowCount, 'records');
    
    // ✅ Log sample data untuk debugging
    if (dataResult.rows.length > 0) {
      const sample = dataResult.rows[0];
      console.log('🔍 Sample record keys:', Object.keys(sample).filter(k => k.startsWith('item_')).length, 'item columns');
      console.log('🔍 Sample item_1_hasil_l:', sample.item_1_hasil_l);
      console.log('🔍 Sample item_11_hasil_l:', sample.item_11_hasil_l);
      console.log('🔍 Sample item_13_hasil_p:', sample.item_13_hasil_p);
    }

    return NextResponse.json(
      {
        success: true,
        data: dataResult.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Get history error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      position: error.position,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });

    // ✅ PostgreSQL specific error handling
    if (error.code === '42P01') {
      return NextResponse.json(
        { success: false, message: 'Tabel tidak ditemukan.', error: 'table_not_found' },
        { status: 500 }
      );
    }

    if (error.code === '42703') {
      return NextResponse.json(
        { 
          success: false, 
          message: `Kolom tidak ditemukan: ${error.message}. Pastikan sudah menjalankan migrasi database.`,
          error: 'column_not_found' 
        },
        { status: 500 }
      );
    }

    if (error.code === '22P02') {
      return NextResponse.json(
        { success: false, message: 'Format input tidak valid', error: 'invalid_input' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' 
          ? { message: error.message, code: error.code, detail: error.detail } 
          : 'internal_server_error'
      },
      { status: 500 }
    );
  }
}