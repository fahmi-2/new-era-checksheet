// app/api/lift-barang/inspeksi/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 [API] Memulai fetch history inspeksi...');
    
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validasi parameter
    if (!itemId) {
      console.error('❌ [API] Parameter item_id tidak ditemukan');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Parameter item_id diperlukan',
          data: { records: [], pagination: { total: 0, limit, offset, hasMore: false } }
        },
        { status: 400 }
      );
    }

    console.log(`🔍 [API] Fetching history untuk item_id: ${itemId}`);

    // Test koneksi database
    try {
      await pool.query('SELECT 1');
      console.log('✅ [API] Database connection OK');
    } catch (connError) {
      console.error('❌ [API] Database connection failed:', connError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Koneksi database gagal',
          data: { records: [], pagination: { total: 0, limit, offset, hasMore: false } },
          error: process.env.NODE_ENV === 'development' ? (connError as Error).message : undefined
        },
        { status: 500 }
      );
    }

    // Check tabel existence
    const tableCheck = await pool.query(`
      SELECT 
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lift_barang_inspections') AS inspections_exists,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lift_barang_inspection_items') AS items_exists
    `);
    
    console.log('📊 [API] Table check:', tableCheck.rows[0]);
    
    if (!tableCheck.rows[0].inspections_exists || !tableCheck.rows[0].items_exists) {
      console.error('❌ [API] Tabel tidak ditemukan:', tableCheck.rows[0]);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tabel database tidak ditemukan. Jalankan migration SQL terlebih dahulu.',
          hint: 'Pastikan tabel lift_barang_inspections dan lift_barang_inspection_items sudah dibuat',
          data: { records: [], pagination: { total: 0, limit, offset, hasMore: false } }
        },
        { status: 500 }
      );
    }

    // ✅ STEP 1: Hitung total inspeksi yang MEMILIKI item untuk item_id ini
    const countQuery = `
      SELECT COUNT(DISTINCT i.id) as total
      FROM lift_barang_inspections i
      INNER JOIN lift_barang_inspection_items ii ON i.id = ii.inspection_id
      WHERE i.inspection_type = 'inspeksi' 
        AND ii.item_id = $1
    `;
    const countResult = await pool.query(countQuery, [itemId]);
    const total = parseInt(countResult.rows[0].total);
    console.log(`🔢 [API] Total inspeksi dengan item_id ${itemId}: ${total}`);

    // ✅ Jika tidak ada data, kembalikan empty response
    if (total === 0) {
      console.log('ℹ️ [API] Tidak ada riwayat untuk item_id ini');
      return NextResponse.json({
        success: true,
        message: 'Belum ada riwayat inspeksi untuk item ini',
        data: {
          records: [],
          pagination: { total: 0, limit, offset, hasMore: false }
        }
      });
    }

    // ✅ STEP 2: Ambil hanya inspeksi yang memiliki item untuk item_id ini
    const inspectionsQuery = `
      SELECT DISTINCT i.id, i.inspection_date, i.inspector, i.inspector_nik, i.submitted_at
      FROM lift_barang_inspections i
      INNER JOIN lift_barang_inspection_items ii ON i.id = ii.inspection_id
      WHERE i.inspection_type = 'inspeksi' 
        AND ii.item_id = $1
      ORDER BY i.submitted_at DESC
      LIMIT $2 OFFSET $3
    `;
    const inspectionsResult = await pool.query(inspectionsQuery, [itemId, limit, offset]);
    const inspections = inspectionsResult.rows;
    console.log(`📋 [API] Ditemukan ${inspections.length} inspeksi dengan item_id ${itemId}`);

    // ✅ STEP 3: Ambil semua items untuk inspeksi yang ditemukan
    const inspectionIds = inspections.map((insp: any) => insp.id);
    const itemsQuery = `
      SELECT inspection_id, sub_item_id, status, keterangan, solusi, foto_path
      FROM lift_barang_inspection_items
      WHERE inspection_id = ANY($1) 
        AND item_id = $2
      ORDER BY sub_item_id ASC
    `;
    const itemsResult = await pool.query(itemsQuery, [inspectionIds, itemId]);

    // ✅ Group items by inspection_id
    const itemsByInspection: Record<string, Record<string, any>> = {};
    itemsResult.rows.forEach((item: any) => {
      if (!itemsByInspection[item.inspection_id]) {
        itemsByInspection[item.inspection_id] = {};
      }
      itemsByInspection[item.inspection_id][item.sub_item_id] = {
        status: item.status,
        keterangan: item.keterangan || '',
        solusi: item.solusi || '',
        foto_path: item.foto_path || null
      };
    });

    // ✅ Build records (HANYA inspeksi yang memiliki items)
    const records = inspections.map((inspection: any) => {
      const items = itemsByInspection[inspection.id] || {};
      
      // ✅ Pastikan items tidak kosong (seharusnya tidak mungkin kosong karena pakai INNER JOIN)
      if (Object.keys(items).length === 0) {
        console.warn(`⚠️ [API] Inspection ${inspection.id} tidak memiliki items untuk item_id ${itemId}`);
        return null; // Skip record ini
      }
      
      return {
        id: inspection.id,
        date: inspection.inspection_date,
        inspector: inspection.inspector,
        inspectorNik: inspection.inspector_nik,
        submittedAt: inspection.submitted_at,
        items: items
      };
    }).filter(record => record !== null); // ✅ Hapus record yang kosong

    console.log(`✅ [API] History fetch berhasil. Records valid: ${records.length}`);
    
    return NextResponse.json(
      {
        success: true,
        message: `Ditemukan ${records.length} riwayat inspeksi`,
        data: {
          records,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ [API] ERROR LENGKAP:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server saat mengambil riwayat',
        data: { 
          records: [], 
          pagination: { total: 0, limit: 20, offset: 0, hasMore: false } 
        },
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 10)
        } : undefined
      },
      { status: 500 }
    );
  }
}