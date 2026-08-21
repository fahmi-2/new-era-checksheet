import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID tidak boleh kosong' },
        { status: 400 }
      );
    }

    // Cek apakah data ada sebelum dihapus
    const checkResult = await pool.query(
      'SELECT id FROM toilet_inspections WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hapus data
    await pool.query('DELETE FROM toilet_inspections WHERE id = $1', [id]);

    return NextResponse.json(
      {
        success: true,
        message: 'Data berhasil dihapus',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan server saat menghapus data',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}