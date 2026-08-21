// app/api/lift-barang/inspeksi/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db';

interface InspectionItem {
  status: "OK" | "NG";
  keterangan?: string;
  solusi?: string;
  foto_path?: string;
}

interface SubmitData {
  inspection_date: string;
  inspector: string;
  inspector_nik?: string;
  data: Record<string, InspectionItem>;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [API] === MULAI SUBMIT INSPEKSI LIFT BARANG ===');
    
    const text = await request.text();
    console.log('📊 [API] Raw request text length:', text.length);
    
    // ✅ Tambahkan validasi JSON parsing
    let data: SubmitData;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ [API] JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid JSON format: ' + (parseError as Error).message },
        { status: 400 }
      );
    }

    console.log('🔍 [API] Data diterima:', {
      inspection_date: data.inspection_date,
      inspector: data.inspector,
      inspector_nik: data.inspector_nik,
      has_data: !!data.data,
      data_keys: data.data ? Object.keys(data.data) : null,
      items_count: data.data ? Object.keys(data.data).length : 0
    });

    // ✅ Validasi data dasar
    if (!data.inspection_date || !data.inspector) {
      console.error('❌ [API] Validasi gagal: Data tidak lengkap');
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap: tanggal dan inspector wajib diisi' },
        { status: 400 }
      );
    }

    // ✅ Validasi data object
    if (!data.data || typeof data.data !== 'object' || Object.keys(data.data).length === 0) {
      console.error('❌ [API] Validasi gagal: Data items tidak valid atau kosong');
      return NextResponse.json(
        { success: false, message: 'Data items tidak valid atau kosong' },
        { status: 400 }
      );
    }

    // ✅ Validasi setiap item
    for (const [subItemId, item] of Object.entries(data.data)) {
      console.log(`📝 [API] Validasi item ${subItemId}:`, item);

      // Pastikan item adalah object
      if (!item || typeof item !== 'object') {
        console.error(`❌ [API] Item ${subItemId} tidak valid`);
        return NextResponse.json(
          { success: false, message: `Item ${subItemId} tidak valid` },
          { status: 400 }
        );
      }

      // Validasi status
      if (!item.status || !['OK', 'NG'].includes(item.status)) {
        console.error(`❌ [API] Item ${subItemId}: Status tidak valid (${item.status})`);
        return NextResponse.json(
          { success: false, message: `Status untuk ${subItemId} harus diisi dengan 'OK' atau 'NG'` },
          { status: 400 }
        );
      }
      
      // Jika NG, keterangan dan solusi wajib diisi
      if (item.status === 'NG') {
        const keterangan = item.keterangan?.trim() || '';
        const solusi = item.solusi?.trim() || '';
        
        if (!keterangan || !solusi) {
          console.error(`❌ [API] Item ${subItemId}: Keterangan atau solusi kosong untuk status NG`);
          return NextResponse.json(
            { success: false, message: `Untuk ${subItemId} kondisi NG, keterangan dan solusi wajib diisi` },
            { status: 400 }
          );
        }
      }
    }

    console.log('✅ [API] Semua validasi berhasil');

    // Test koneksi database
    try {
      const testResult = await pool.query('SELECT 1');
      console.log('✅ [API] Database connection OK. Result:', testResult.rows);
    } catch (connError) {
      console.error('❌ [API] Database connection failed:', connError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Koneksi database gagal',
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
          message: 'Tabel database lift_barang_inspections atau lift_barang_inspection_items tidak ditemukan',
          hint: 'Jalankan migration SQL untuk membuat tabel',
          tables_found: tableCheck.rows[0]
        },
        { status: 500 }
      );
    }

    console.log('✅ [API] Tabel database ditemukan');

    // ✅ Mulai transaction dengan PostgreSQL
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('🔄 [API] Transaction started');

      // Generate unique ID
      const inspectionId = `lift-barang-inspeksi-${Date.now()}`;
      console.log('🆔 [API] Generated inspection ID:', inspectionId);

      // Insert ke lift_barang_inspections dengan inspection_type = 'inspeksi'
      console.log('💾 [API] Inserting to lift_barang_inspections...');
      
      const recordResult = await client.query(
        `INSERT INTO lift_barang_inspections (
          id, inspection_type, inspection_date, inspector, inspector_nik, submitted_at, created_at
        ) VALUES ($1, 'inspeksi', $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [inspectionId, data.inspection_date, data.inspector, data.inspector_nik || null]
      );
      
      console.log('✅ [API] Record inserted:', recordResult.rows[0]);

      // Insert items ke lift_barang_inspection_items
      let insertedCount = 0;
      for (const [subItemId, item] of Object.entries(data.data)) {
        // Extract itemId from subItemId (e.g., "1A" -> "1")
        const itemIdMatch = subItemId.match(/^(\d+)/);
        const itemId = itemIdMatch ? itemIdMatch[1] : subItemId;

        console.log(`💾 [API] Inserting item ${insertedCount + 1}:`, {
          subItemId,
          itemId,
          status: item.status
        });
        
        try {
          const itemResult = await client.query(
            `INSERT INTO lift_barang_inspection_items (
              inspection_id, item_id, sub_item_id, status, keterangan, solusi, foto_path, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            RETURNING id`,
            [
              inspectionId,
              itemId,
              subItemId,
              item.status,
              item.status === 'NG' ? (item.keterangan || '') : null,
              item.status === 'NG' ? (item.solusi || '') : null,
              item.foto_path || null
            ]
          );
          
          insertedCount++;
          console.log(`✅ [API] Item ${insertedCount} inserted (DB ID: ${itemResult.rows[0].id})`);
        } catch (itemError) {
          console.error(`❌ [API] Error inserting item ${insertedCount + 1}:`, itemError);
          throw itemError;
        }
      }

      await client.query('COMMIT');
      console.log(`✅ [API] Transaction committed. Total items: ${insertedCount}`);
      
      // Cek apakah ada item dengan status NG
      const hasNg = Object.values(data.data).some(item => item.status === 'NG');

      console.log('✅ [API] === SUBMIT BERHASIL ===');
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data inspeksi berhasil disimpan',
          id: inspectionId,
          hasNg: hasNg,
          totalItems: insertedCount
        },
        { status: 201 }
      );
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ [API] Transaction error:', transactionError);
      
      // Deteksi error spesifik PostgreSQL
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('column') && transactionError.message.includes('does not exist')) {
          console.error('❌ [API] Kolom tidak ditemukan di tabel');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Struktur tabel database tidak sesuai. Periksa kolom di tabel lift_barang_inspections/lift_barang_inspection_items',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
        
        if (transactionError.message.includes('violates foreign key constraint')) {
          console.error('❌ [API] Foreign key constraint error');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Error relasi database. Pastikan data referensi valid',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
        
        if (transactionError.message.includes('violates not-null constraint')) {
          console.error('❌ [API] Not-null constraint error');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Ada field yang wajib diisi tapi kosong',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
        
        if (transactionError.message.includes('duplicate key value')) {
          console.error('❌ [API] Duplicate key error');
          return NextResponse.json(
            { 
              success: false, 
              message: 'ID record sudah ada. Coba lagi.',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
      }
      
      throw transactionError;
    } finally {
      client.release();
      console.log('🔓 [API] Connection released');
    }
  } catch (error) {
    console.error('❌ [API] === ERROR SUBMIT INSPEKSI LIFT BARANG ===');
    console.error('❌ [API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 10)
        } : undefined
      },
      { status: 500 }
    );
  }
}