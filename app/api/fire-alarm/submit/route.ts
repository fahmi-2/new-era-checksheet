// app/api/fire-alarm/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface FireAlarmItem {
  no: number;
  zona: string;
  lokasi: string;
  alarmBell: string;
  indicatorLamp: string;
  manualCallPoint: string;
  idZona: string;
  kebersihan: string;
  kondisiNok: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string | null;
}

interface SubmitData {
  date: string;
  zona: string;
  checker: string;
  checkerNik: string;
  items: FireAlarmItem[];
}

export async function POST(request: NextRequest) {
  try {
    const data: SubmitData = await request.json();
    console.log('📥 Received Fire Alarm data:', JSON.stringify(data, null, 2));

    // Validasi data utama
    if (!data.date || !data.zona || !data.checker || !data.items || data.items.length === 0) {
      console.log('❌ Validation failed: Data tidak lengkap');
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Validasi items
    for (const [index, item] of data.items.entries()) {
      const requiredFields = ['alarmBell', 'indicatorLamp', 'manualCallPoint', 'idZona', 'kebersihan'];
      for (const field of requiredFields) {
        if (!item[field as keyof FireAlarmItem] || !['OK', 'NG'].includes(item[field as keyof FireAlarmItem] as string)) {
          console.log(`❌ Validation failed at item ${index + 1}: Field "${field}" tidak valid`);
          return NextResponse.json(
            { success: false, message: `Item ${index + 1}: Status "${field}" harus diisi dengan OK/NG` },
            { status: 400 }
          );
        }
      }
    }

    // Generate ID unik
    const id = `FIRE-ALARM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    console.log('📝 Generated Record ID:', id);

    // Test koneksi database
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database connection OK');
    } catch (connError) {
      console.error('❌ Database connection failed:', connError);
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
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fire_alarm_records') AS records_exists,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fire_alarm_items') AS items_exists
    `);
    
    if (!tableCheck.rows[0].records_exists || !tableCheck.rows[0].items_exists) {
      console.error('❌ Tabel tidak ditemukan:', tableCheck.rows[0]);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tabel database fire_alarm_records atau fire_alarm_items tidak ditemukan',
          hint: 'Jalankan migration SQL untuk membuat tabel'
        },
        { status: 500 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('🔄 Transaction started');

      // Insert ke fire_alarm_records
      const recordResult = await client.query(
        `INSERT INTO fire_alarm_records (
          id, date, zona, checker, checker_nik, submitted_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [id, data.date, data.zona, data.checker, data.checkerNik || null]
      );
      
      console.log('✅ Record inserted:', recordResult.rows[0]);

      // Insert ke fire_alarm_items
      let insertedCount = 0;
      for (const item of data.items) {
        const itemResult = await client.query(
          `INSERT INTO fire_alarm_items (
            record_id, no, zona, lokasi, alarm_bell, indicator_lamp, 
            manual_call_point, id_zona, kebersihan, kondisi_nok, 
            tindakan_perbaikan, pic, foto, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
          RETURNING id`,
          [
            id,
            item.no,
            item.zona,
            item.lokasi,
            item.alarmBell,
            item.indicatorLamp,
            item.manualCallPoint,
            item.idZona,
            item.kebersihan,
            item.kondisiNok || null,
            item.tindakanPerbaikan || null,
            item.pic,
            item.foto || null
          ]
        );
        insertedCount++;
        console.log(`✅ Item ${insertedCount} inserted (DB ID: ${itemResult.rows[0].id})`);
      }

      await client.query('COMMIT');
      console.log(`✅ Transaction committed. Total items: ${insertedCount}`);
      
      return NextResponse.json(
        {
          success: true,
          message: 'Data Fire Alarm berhasil disimpan',
          id,
          totalItems: insertedCount
        },
        { status: 201 }
      );
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', transactionError);
      
      // Deteksi error spesifik PostgreSQL
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('column') && transactionError.message.includes('does not exist')) {
          console.error('❌ Kolom tidak ditemukan di tabel. Periksa struktur tabel Anda.');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Struktur tabel database tidak sesuai. Periksa kolom di tabel fire_alarm_records/fire_alarm_items',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
        
        if (transactionError.message.includes('violates foreign key constraint')) {
          console.error('❌ Foreign key constraint error');
          return NextResponse.json(
            { 
              success: false, 
              message: 'Error relasi database. Pastikan record_id valid',
              error: transactionError.message
            },
            { status: 500 }
          );
        }
      }
      
      throw transactionError;
    } finally {
      client.release();
      console.log('🔓 Connection released');
    }
  } catch (error) {
    console.error('❌ Submit Fire Alarm error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server saat menyimpan data',
        error: process.env.NODE_ENV === 'development' ? {
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 5)
        } : undefined
      },
      { status: 500 }
    );
  }
}