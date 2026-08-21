// app/api/apd/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ApdItem {
  no: number;
  nama: string;
  nik: string;
  tglPengambilan: string;
  dept: string;
  jobDesc: string;
  jumlah: number;
  keterangan?: string;
}

interface SubmitData {
  jenisApd: string;      // ✅ Field kunci untuk APD (bukan 'slug')
  date: string;
  checker: string;
  checkerNik?: string;
  items: ApdItem[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const parseDate = (dateStr: string): string => {
  if (!dateStr) throw new Error('Tanggal tidak boleh kosong');
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Format tanggal tidak valid: ${dateStr}. Gunakan YYYY-MM-DD`);
  }
  return date.toISOString().split('T')[0];
};

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let client: any;

  try {
    // 1. Parse request body
    let data: SubmitData;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError);
      return NextResponse.json(
        { success: false, message: 'Format JSON tidak valid' },
        { status: 400 }
      );
    }

    // 2. Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 Received APD submit request:', {
        jenisApd: data?.jenisApd,
        date: data?.date,
        checker: data?.checker,
        itemsCount: data?.items?.length,
        rawKeys: data ? Object.keys(data) : []
      });
    }

    // 3. Validasi data wajib - PESAN ERROR SPESIFIK APD
    if (!data?.jenisApd?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Jenis APD wajib diisi',
          field: 'jenisApd'
        },
        { status: 400 }
      );
    }
    
    if (!data?.date) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tanggal inspeksi wajib diisi',
          field: 'date'
        },
        { status: 400 }
      );
    }
    
    if (!data?.checker?.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Nama checker wajib diisi',
          field: 'checker'
        },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Minimal 1 item APD harus diisi',
          field: 'items'
        },
        { status: 400 }
      );
    }

    // 4. Validasi & parse tanggal utama
    let safeDate: string;
    try {
      safeDate = parseDate(data.date);
    } catch (e: any) {
      return NextResponse.json(
        { success: false, message: e.message, field: 'date' },
        { status: 400 }
      );
    }

    // 5. Validasi setiap item
    for (const [index, item] of data.items.entries()) {
      const prefix = `Item #${index + 1}`;
      
      if (!item.nama?.trim()) {
        return NextResponse.json(
          { success: false, message: `${prefix}: Nama wajib diisi`, field: `items[${index}].nama` },
          { status: 400 }
        );
      }
      if (!item.nik?.trim()) {
        return NextResponse.json(
          { success: false, message: `${prefix}: NIK wajib diisi`, field: `items[${index}].nik` },
          { status: 400 }
        );
      }
      if (!item.tglPengambilan) {
        return NextResponse.json(
          { success: false, message: `${prefix}: Tanggal pengambilan wajib diisi`, field: `items[${index}].tglPengambilan` },
          { status: 400 }
        );
      }
      if (!item.dept?.trim()) {
        return NextResponse.json(
          { success: false, message: `${prefix}: Departemen wajib diisi`, field: `items[${index}].dept` },
          { status: 400 }
        );
      }
      if (!item.jobDesc?.trim()) {
        return NextResponse.json(
          { success: false, message: `${prefix}: Job description wajib diisi`, field: `items[${index}].jobDesc` },
          { status: 400 }
        );
      }
      if (!item.jumlah || item.jumlah <= 0) {
        return NextResponse.json(
          { success: false, message: `${prefix}: Jumlah harus lebih dari 0`, field: `items[${index}].jumlah` },
          { status: 400 }
        );
      }
    }

    // 6. Connect to database
    client = await pool.connect();
    
    try {
      await client.query('SET statement_timeout = 30000');
      await client.query('BEGIN');
      console.log('🔄 Transaction started for APD submit');

      // Generate unique record ID
      const recordId = `apd-${data.jenisApd.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      // 7. Insert to apd_records
      // ⚠️ "date" adalah reserved keyword di PostgreSQL, gunakan kutip ganda
      await client.query(
        `INSERT INTO apd_records (
          id, jenis_apd, "date", checker, checker_nik, submitted_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          recordId,
          data.jenisApd.trim(),
          safeDate,
          data.checker.trim(),
          data.checkerNik?.trim() || null
        ]
      );

      // 8. Insert items to apd_items (batch insert untuk performa)
      const itemValues: any[] = [];
      const itemPlaceholders: string[] = [];
      
      for (const [idx, item] of data.items.entries()) {
        const baseIndex = idx * 9;
        itemPlaceholders.push(
          `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, CURRENT_TIMESTAMP)`
        );
        
        // Parse tanggal pengambilan per item
        let safeTglPengambilan: string;
        try {
          safeTglPengambilan = parseDate(item.tglPengambilan);
        } catch (e: any) {
          throw new Error(`Item #${idx + 1}: ${e.message}`);
        }
        
        itemValues.push(
          recordId,
          item.no,
          item.nama.trim(),
          item.nik.trim(),
          safeTglPengambilan,
          item.dept.trim(),
          item.jobDesc.trim(),
          item.jumlah,
          item.keterangan?.trim() || null
        );
      }

      const insertQuery = `
        INSERT INTO apd_items (
          record_id, no, nama, nik, tgl_pengambilan, dept, job_desc, jumlah, keterangan, created_at
        ) VALUES ${itemPlaceholders.join(', ')}
      `;
      
      await client.query(insertQuery, itemValues);

      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');

      const duration = Date.now() - startTime;
      console.log(`⏱️ APD submit completed in ${duration}ms`);

      return NextResponse.json(
        {
          success: true,
          message: 'Data APD berhasil disimpan',
          data: {
            id: recordId,
            jenisApd: data.jenisApd,
            itemsCount: data.items.length,
            timestamp: new Date().toISOString()
          }
        },
        { status: 201 }
      );

    } catch (dbError: any) {
      try {
        await client.query('ROLLBACK');
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      throw dbError;
    }

  } catch (error: any) {
    console.error('❌ Submit APD error:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });

    // Handle PostgreSQL specific errors
    switch (error?.code) {
      case '23505': // unique_violation
        return NextResponse.json(
          { success: false, message: 'Data duplikat: Record sudah ada' },
          { status: 409 }
        );
      case '23503': // foreign_key_violation
        return NextResponse.json(
          { success: false, message: 'Referensi data tidak valid' },
          { status: 400 }
        );
      case '22007': // invalid_datetime_format
        return NextResponse.json(
          { success: false, message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' },
          { status: 400 }
        );
      case '08001':
      case '08006':
        return NextResponse.json(
          { success: false, message: 'Koneksi database gagal' },
          { status: 503 }
        );
    }

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Terjadi kesalahan server',
        field: error?.field,
        debug: isDev ? { code: error?.code, detail: error?.detail } : undefined
      },
      { status: 500 }
    );

  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.error('❌ Failed to release connection:', e);
      }
    }
  }
}