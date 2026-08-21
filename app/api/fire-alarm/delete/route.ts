// app/api/fire-alarm/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // ✅ Validasi ID
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID record diperlukan' },
        { status: 400 }
      );
    }

    // ✅ Cek apakah record ada
    const checkQuery = 'SELECT id FROM fire_alarm_records WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // ✅ Gunakan TRANSACTION untuk hapus data child dulu, lalu parent
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1️⃣ Hapus items terlebih dahulu (child table)
      await client.query(
        'DELETE FROM fire_alarm_items WHERE record_id = $1',
        [id]
      );

      // 2️⃣ Hapus record utama (parent table)
      await client.query(
        'DELETE FROM fire_alarm_records WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');

      return NextResponse.json(
        { 
          success: true, 
          message: 'Data berhasil dihapus',
          deletedId: id 
        },
        { status: 200 }
      );

    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', transactionError);
      
      // Deteksi foreign key constraint error
      if (transactionError instanceof Error && transactionError.message.includes('foreign key')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Gagal menghapus: Masih ada data terkait. Silakan hapus items terlebih dahulu.' 
          },
          { status: 400 }
        );
      }
      
      throw transactionError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Delete Fire Alarm error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan server: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}