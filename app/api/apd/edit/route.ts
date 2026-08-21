// app/api/apd/edit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

interface EditItem {
  id?: number;
  no: number;
  nama: string;
  nik: string;
  tglPengambilan: string;
  dept: string;
  jobDesc: string;
  jumlah: number;
  keterangan?: string;
}

interface EditData {
  recordId: string;
  jenisApd?: string;
  date?: string;
  checker?: string;
  checkerNik?: string;
  items: EditItem[];
}

export async function PUT(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const data: EditData = await request.json();

    if (!data.recordId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // ✅ Start transaction dengan PostgreSQL
    await client.query('BEGIN');

    // Update apd_records jika ada perubahan
    if (data.jenisApd || data.date || data.checker) {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (data.jenisApd) {
        updateFields.push(`jenis_apd = $${paramIndex++}`);
        updateValues.push(data.jenisApd);
      }
      if (data.date) {
        updateFields.push(`date = $${paramIndex++}`);
        updateValues.push(data.date);
      }
      if (data.checker) {
        updateFields.push(`checker = $${paramIndex++}`);
        updateValues.push(data.checker);
      }
      if (data.checkerNik !== undefined) {
        updateFields.push(`checker_nik = $${paramIndex++}`);
        updateValues.push(data.checkerNik);
      }

      if (updateFields.length > 0) {
        updateValues.push(data.recordId);
        await client.query(
          `UPDATE apd_records SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
          updateValues
        );
      }
    }

    // Delete existing items
    await client.query(
      `DELETE FROM apd_items WHERE record_id = $1`,
      [data.recordId]
    );

    // ✅ INSERT UPDATED ITEMS - PERBAIKAN LENGKAP
    for (const item of data.items) {
      await client.query(
        `INSERT INTO apd_items (
          record_id, no, nama, nik, tgl_pengambilan, dept, job_desc, jumlah, keterangan, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          data.recordId,           // 1 - record_id
          item.no,                 // 2 - no
          item.nama,               // 3 - nama
          item.nik,                // 4 - nik
          item.tglPengambilan,     // 5 - tgl_pengambilan
          item.dept,               // 6 - dept
          item.jobDesc,            // 7 - job_desc
          item.jumlah,             // 8 - jumlah
          item.keterangan || null  // 9 - keterangan
        ]
      );
    }

    // ✅ Commit transaction
    await client.query('COMMIT');
    
    return NextResponse.json(
      {
        success: true,
        message: 'Data APD berhasil diperbarui'
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Edit APD error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server',
        error: (error as any).message
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
