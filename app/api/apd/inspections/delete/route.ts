// app/api/apd/inspections/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID data inspeksi wajib disertakan' },
        { status: 400 }
      );
    }

    const checkResult = await pool.query(
      'SELECT id FROM apd_inspection_records WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data inspeksi tidak ditemukan' },
        { status: 404 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ambil rows
      const rowRes = await client.query(
        'SELECT id FROM apd_inspection_rows WHERE record_id = $1',
        [id]
      );
      const rowIds = rowRes.rows.map(r => r.id);

      // Hapus nok_details
      if (rowIds.length > 0) {
        await client.query(
          'DELETE FROM apd_inspection_nok_details WHERE row_id = ANY($1)',
          [rowIds]
        );
      }

      // Hapus rows
      await client.query(
        'DELETE FROM apd_inspection_rows WHERE record_id = $1',
        [id]
      );

      // Hapus record utama
      await client.query(
        'DELETE FROM apd_inspection_records WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');
      console.log(`✅ Record APD ${id} deleted successfully`);

      return NextResponse.json({
        success: true,
        message: 'Data inspeksi APD berhasil dihapus',
        id,
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Delete APD Inspection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat menghapus data inspeksi',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}
