// app/api/emergency-lamp/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface EmergencyItem {
  no: number;
  lokasi: string;
  id: string;
  kondisiLampu: string;
  indicatorLamp: string;
  batteryCharger: string;
  idNumber: string;
  kebersihan: string;
  kondisiKabel: string;
  keterangan?: string;
  tindakanPerbaikan?: string;
  pic: string;
  foto?: string;
}

interface SubmitData {
  date: string;
  area: string;
  checker: string;
  checkerNik?: string;
  items: EmergencyItem[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [API] === MULAI SUBMIT EMERGENCY LAMP ===');
    
    const data: SubmitData = await request.json(); // ✅ Perbaikan: penamaan variabel
    console.log('📊 [API] Data diterima:', {
      date: data.date,
      area: data.area,
      checker: data.checker,
      checkerNik: data.checkerNik,
      itemsCount: data.items.length
    });

    // Validasi data
    if (!data.date || !data.area || !data.checker || !data.items || data.items.length === 0) {
      console.error('❌ [API] Validasi gagal: Data tidak lengkap');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Data tidak lengkap: date, area, checker, dan items wajib diisi' 
        },
        { status: 400 }
      );
    }

    console.log(`✅ [API] Validasi data dasar berhasil. Jumlah items: ${data.items.length}`);

    // Validasi semua item
    for (let index = 0; index < data.items.length; index++) {
      const item = data.items[index];
      
      console.log(`📝 [API] Validasi item ${index + 1}:`, {
        no: item.no,
        lokasi: item.lokasi,
        id: item.id
      });

      // Validasi field wajib
      if (!item.no) {
        console.error(`❌ [API] Item ${index + 1}: no tidak boleh kosong`);
        return NextResponse.json(
          { success: false, message: `Item ${index + 1}: Nomor urut tidak boleh kosong` },
          { status: 400 }
        );
      }
      
      if (!item.lokasi || item.lokasi.trim() === '') {
        console.error(`❌ [API] Item ${index + 1}: lokasi tidak boleh kosong`);
        return NextResponse.json(
          { success: false, message: `Item ${index + 1}: Lokasi wajib diisi` },
          { status: 400 }
        );
      }
      
      if (!item.id || item.id.trim() === '') {
        console.error(`❌ [API] Item ${index + 1}: id tidak boleh kosong`);
        return NextResponse.json(
          { success: false, message: `Item ${index + 1}: ID wajib diisi` },
          { status: 400 }
        );
      }

      // Validasi status fields
      const statusFields = [
        'kondisiLampu', 'indicatorLamp', 'batteryCharger', 
        'idNumber', 'kebersihan', 'kondisiKabel'
      ];
      
      for (const field of statusFields) {
        const value = item[field as keyof EmergencyItem] as string;
        
        if (!value || (value !== 'OK' && value !== 'NG')) {
          console.error(`❌ [API] Item ${index + 1}: ${field} harus 'OK' atau 'NG' (ditemukan: '${value}')`);
          return NextResponse.json(
            { 
              success: false, 
              message: `Item ${index + 1}: ${field} harus diisi dengan 'OK' atau 'NG'` 
            },
            { status: 400 }
          );
        }
      }

      // Validasi keterangan untuk item NG
      const hasNg = statusFields.some(field => item[field as keyof EmergencyItem] === 'NG');
      if (hasNg && (!item.keterangan || item.keterangan.trim() === '')) {
        console.error(`❌ [API] Item ${index + 1}: Keterangan wajib diisi untuk item NG`);
        return NextResponse.json(
          { 
            success: false, 
            message: `Item ${index + 1}: Keterangan wajib diisi untuk item dengan status NG` 
          },
          { status: 400 }
        );
      }
    }

    console.log('✅ [API] Semua validasi item berhasil');

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
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emergency_lamp_records') AS records_exists,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emergency_lamp_items') AS items_exists
    `);
    
    console.log('📊 [API] Table check:', tableCheck.rows[0]);
    
    if (!tableCheck.rows[0].records_exists || !tableCheck.rows[0].items_exists) {
      console.error('❌ [API] Tabel tidak ditemukan:', tableCheck.rows[0]);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tabel database emergency_lamp_records atau emergency_lamp_items tidak ditemukan',
          hint: 'Jalankan migration SQL untuk membuat tabel'
        },
        { status: 500 }
      );
    }

    console.log('✅ [API] Tabel database ditemukan');

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('🔄 [API] Transaction started');

      // Generate unique ID
      const recordId = `emergency-lamp-${data.area}-${Date.now()}`;
      console.log('🆔 [API] Generated record ID:', recordId);

      // Insert ke emergency_lamp_records
      console.log('💾 [API] Inserting to emergency_lamp_records...');
      
      const recordResult = await client.query(
        `INSERT INTO emergency_lamp_records (
          id, date, area, checker, checker_nik, submitted_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [recordId, data.date, data.area, data.checker, data.checkerNik || null]
      );
      
      console.log('✅ [API] Record inserted:', recordResult.rows[0]);

      // Insert items ke emergency_lamp_items
      let insertedCount = 0;
      for (const item of data.items) {
        console.log(`💾 [API] Inserting item ${insertedCount + 1}:`, {
          no: item.no,
          lokasi: item.lokasi,
          id: item.id
        });
        
        try {
          const itemResult = await client.query(
            `INSERT INTO emergency_lamp_items (
              record_id, no, lokasi, id_lamp, kondisi_lampu, indicator_lamp, 
              battery_charger, id_number, kebersihan, kondisi_kabel, keterangan, 
              tindakan_perbaikan, pic, foto, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
            RETURNING id`,
            [
              recordId,
              item.no,
              item.lokasi,
              item.id,
              item.kondisiLampu,
              item.indicatorLamp,
              item.batteryCharger,
              item.idNumber,
              item.kebersihan,
              item.kondisiKabel,
              item.keterangan || null,
              item.tindakanPerbaikan || null,
              item.pic,
              item.foto || null
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
      const hasNg = data.items.some(
        (item) =>
          item.kondisiLampu === 'NG' ||
          item.indicatorLamp === 'NG' ||
          item.batteryCharger === 'NG' ||
          item.idNumber === 'NG' ||
          item.kebersihan === 'NG' ||
          item.kondisiKabel === 'NG'
      );

      console.log('✅ [API] === SUBMIT BERHASIL ===');
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data berhasil disimpan',
          data: {  // ✅ Perbaikan: pastikan ada "data" sebagai properti
            id: recordId,
            hasNg: hasNg,
            totalItems: insertedCount
          }
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
              message: 'Struktur tabel database tidak sesuai. Periksa kolom di tabel emergency_lamp_records/emergency_lamp_items',
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
              message: 'Error relasi database. Pastikan record_id valid',
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
    console.error('❌ [API] === ERROR SUBMIT EMERGENCY LAMP ===');
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